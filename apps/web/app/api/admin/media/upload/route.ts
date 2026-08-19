import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit, CONTRIBUTOR_ROLES, MEDIA_MANAGER_ROLES } from '@/lib/admin-roles'
import { createMediaItem } from '@/lib/media-library'
import { recordAuditEvent } from '@/lib/audit-log'
import { enforceRateLimit } from '@/lib/rate-limit'
import { validateImageUpload } from '@/lib/storage/media-validation'
import {
  isPayloadCanonical,
  payloadCollectionAdminUrl,
  payloadAdminUrlIfConfigured,
  shouldBlockLocalContentWrites,
} from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function blockedUploadResponse() {
  const canonical = isPayloadCanonical()
  return NextResponse.json(
    {
      error: canonical
        ? 'Payload canonical मोडमा यो डेस्क upload सतह बन्द छ। मिडिया Payload CMS बाट अपलोड गर्नुहोस्।'
        : 'Live deployment content authority is misconfigured. Local media uploads are blocked.',
      cmsUrl: canonical
        ? payloadCollectionAdminUrl('media')
        : (payloadAdminUrlIfConfigured('/collections/media') ?? undefined),
      configurationHint: canonical
        ? undefined
        : 'Set CONTENT_SOURCE=payload and PAYLOAD_PUBLIC_SERVER_URL on the web deployment.',
    },
    { status: canonical ? 409 : 503 },
  )
}

/**
 * POST /api/admin/media/upload — multipart file → storage adapter → media library row.
 * Prefer order: Cloudflare R2 binding → Vercel Blob → local disk (dev/E2E only).
 */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'admin-media-upload', 20, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  const role = session.newsroomRole
  const mayUpload = canEdit(role) || MEDIA_MANAGER_ROLES.has(role) || CONTRIBUTOR_ROLES.has(role)
  if (!mayUpload) {
    return NextResponse.json({ error: 'अनुमति छैन।' }, { status: 403 })
  }
  if (shouldBlockLocalContentWrites()) return blockedUploadResponse()

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart form data.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'file field is required.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const validated = validateImageUpload({
    buffer,
    declaredType: file.type,
    size: file.size,
  })
  if (!validated.ok) {
    return NextResponse.json({ error: validated.error }, { status: 400 })
  }

  const alt =
    String(form.get('alt') ?? '').trim() ||
    file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .slice(0, 240) ||
    'Article image'
  const caption = String(form.get('caption') ?? '').trim() || undefined
  const credit = String(form.get('credit') ?? '').trim() || undefined

  const safeName = file.name.replace(/[^\w.\-]+/g, '_').slice(0, 80) || 'image.jpg'
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim()
  const requestOrigin = request.headers.get('origin') ?? undefined

  // This legacy web-desk endpoint uses Vercel Blob's server upload API. Vercel
  // request bodies have a lower practical ceiling than our local/R2 validator;
  // canonical Payload uses clientUploads and is the right path for larger media.
  if (process.env.VERCEL && token && file.size > 4 * 1024 * 1024) {
    return NextResponse.json(
      {
        error:
          'This web-desk upload is limited to 4MB on Vercel. Use Payload Media for larger files, or upload an image under 4MB.',
      },
      { status: 413 },
    )
  }

  let blobUrl: string
  let storageProvider: 'r2' | 'vercel-blob' | 'local' = 'local'
  try {
    const { saveR2MediaFile } = await import('@/lib/storage/r2-media-store')
    const r2 = await saveR2MediaFile({
      buffer,
      safeFilename: safeName,
      contentType: validated.contentType,
    })
    if (r2) {
      blobUrl = r2.url
      storageProvider = 'r2'
    } else if (token) {
      const pathname = `newsroom/${Date.now().toString(36)}-${safeName}`
      const blob = await put(pathname, buffer, {
        access: 'public',
        token,
        contentType: validated.contentType,
        addRandomSuffix: true,
      })
      blobUrl = blob.url
      storageProvider = 'vercel-blob'
    } else if (
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.CF_WORKERS === '1' ||
      process.env.CF_PAGES === '1' ||
      process.env.CF_PAGES_STATIC === '1'
    ) {
      return NextResponse.json(
        {
          error:
            'Configure Cloudflare R2 (MEDIA_BUCKET + STORAGE_PUBLIC_BASE_URL) or BLOB_READ_WRITE_TOKEN for production uploads.',
        },
        { status: 503 },
      )
    } else {
      const { saveLocalMediaFile } = await import('@/lib/storage/local-media-store')
      const saved = await saveLocalMediaFile({
        buffer,
        safeFilename: safeName,
        contentType: validated.contentType,
        requestOrigin,
      })
      blobUrl = saved.url
      storageProvider = 'local'
    }
  } catch (error) {
    console.error('[media] upload failed', error)
    const detail = error instanceof Error ? error.message : 'Upload failed.'
    const storageConfigurationError =
      /blob.*token|token.*blob|unauthori[sz]ed|forbidden|invalid.*token|BLOB_READ_WRITE_TOKEN/i.test(
        detail,
      )
    return NextResponse.json(
      {
        error: storageConfigurationError
          ? 'Media storage credentials are invalid or belong to a different deployment. Reconnect Vercel Blob to the web project (or use Payload Media in canonical mode).'
          : 'The configured media provider rejected the upload.',
        detail: detail.slice(0, 300),
        provider: token
          ? 'vercel-blob'
          : process.env.CF_WORKERS === '1'
            ? 'cloudflare-r2'
            : 'unknown',
      },
      { status: storageConfigurationError ? 503 : 502 },
    )
  }

  async function rollbackOrphanObject() {
    try {
      if (storageProvider === 'vercel-blob' && token) {
        const { del } = await import('@vercel/blob')
        await del(blobUrl, { token })
      }
      // R2/local orphans are best-effort; log for operators.
      if (storageProvider !== 'vercel-blob') {
        console.error('[media] orphan object after library persist failure', {
          url: blobUrl,
          provider: storageProvider,
        })
      }
    } catch (rollbackError) {
      console.error('[media] orphan rollback failed', rollbackError)
    }
  }

  try {
    const item = await createMediaItem({
      url: blobUrl,
      alt,
      caption,
      credit,
    })
    if (!item) {
      await rollbackOrphanObject()
      return NextResponse.json(
        { error: 'Uploaded, but media library row failed.', url: blobUrl, alt },
        { status: 500 },
      )
    }

    await recordAuditEvent({
      session,
      action: 'create',
      targetType: 'media',
      targetId: item.id,
      summary: `Media uploaded: ${item.alt}`,
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('[media] library persist failed', error)
    await rollbackOrphanObject()
    return NextResponse.json(
      {
        error: 'Uploaded, but media library row failed.',
        url: blobUrl,
        alt,
        detail: error instanceof Error ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
