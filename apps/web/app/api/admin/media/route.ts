import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { assertNewsroomRole, MEDIA_MANAGER_ROLES, canEdit } from '@/lib/admin-roles'
import { createMediaItem, listMediaItems } from '@/lib/media-library'
import { recordAuditEvent } from '@/lib/audit-log'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isPayloadCanonical, payloadCollectionAdminUrl, payloadAdminUrlIfConfigured, shouldBlockLocalContentWrites } from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

function blockedMediaResponse() {
  const canonical = isPayloadCanonical()
  return NextResponse.json(
    {
      error: canonical
        ? 'Production media is managed in Payload CMS.'
        : 'Live deployment content authority is misconfigured. Local media writes are blocked.',
      cmsUrl: canonical
        ? payloadCollectionAdminUrl('media')
        : payloadAdminUrlIfConfigured('/collections/media') ?? undefined,
      configurationHint: canonical
        ? undefined
        : 'Set CONTENT_SOURCE=payload and PAYLOAD_PUBLIC_SERVER_URL on the web deployment.',
    },
    { status: canonical ? 409 : 503 },
  )
}

/** GET /api/admin/media — list library items for the article editor picker. */
export async function GET() {
  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'अनुमति छैन।' }, { status: 403 })
  }
  if (shouldBlockLocalContentWrites()) return blockedMediaResponse()
  const items = await listMediaItems()
  return NextResponse.json({ items })
}

/** POST /api/admin/media — register a URL in the media library (no binary upload). */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'admin-media-create', 30, 60_000)
  if (limited) return limited

  const session = await requireNewsroomSession()
  assertNewsroomRole(session.newsroomRole, MEDIA_MANAGER_ROLES)
  if (shouldBlockLocalContentWrites()) return blockedMediaResponse()

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const item = await createMediaItem({
    url: body.url,
    alt: body.alt,
    caption: body.caption,
    credit: body.credit,
  })
  if (!item) {
    return NextResponse.json({ error: 'URL र alt text आवश्यक छ।' }, { status: 400 })
  }
  await recordAuditEvent({
    session,
    action: 'create',
    targetType: 'media',
    targetId: item.id,
    summary: `Media added: ${item.alt}`,
  })
  return NextResponse.json(item, { status: 201 })
}
