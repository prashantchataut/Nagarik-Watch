import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { appendCorrection } from '@/lib/content/store/json-store'
import { canPublish } from '@/lib/admin-roles'
import { enforceRateLimit } from '@/lib/rate-limit'
import { recordAuditEvent } from '@/lib/audit-log'
import { revalidatePublishedArticle } from '@/lib/content/revalidate-published'
import { shouldBlockLocalContentWrites } from '@/lib/content/payload-admin-client'
import { updateSubmissionStatus } from '@/lib/submissions'
import type { CorrectionSeverity } from '@nagarikwatch/db'

export const dynamic = 'force-dynamic'

const SEVERITIES: readonly CorrectionSeverity[] = [
  'retraction',
  'factual',
  'attribution',
  'clarification',
  'typo',
]

function isSeverity(value: unknown): value is CorrectionSeverity {
  return typeof value === 'string' && SEVERITIES.includes(value as CorrectionSeverity)
}

/**
 * POST /api/admin/articles/[id]/corrections — issue a reader-visible correction.
 *
 * Gated on `canPublish`, not `canEdit`: a correction is a public statement by
 * the masthead about its own reporting, and the people who can make that
 * statement are the people who can publish. There is no PATCH or DELETE here
 * on purpose — corrections are append-only (see `appendCorrection`).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (shouldBlockLocalContentWrites()) {
    return NextResponse.json(
      { error: 'सार्वजनिक साइट Payload CMS बाट चल्छ। सच्याइएको विवरण त्यहीँबाट जारी गर्नुहोस्।' },
      { status: 409 },
    )
  }
  const limited = await enforceRateLimit(request, 'admin-correction-issue', 20, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'सच्याइएको विवरण जारी गर्ने अनुमति छैन।' }, { status: 403 })
  }

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!isSeverity(body.severity)) {
    return NextResponse.json({ error: 'सच्याइको प्रकार छान्नुहोस्।' }, { status: 400 })
  }

  try {
    const updated = await appendCorrection(id, {
      summaryNe: String(body.summaryNe ?? ''),
      summaryEn: body.summaryEn === undefined ? undefined : String(body.summaryEn),
      severity: body.severity,
      issuedBy: session.userId,
      requestId: body.requestId === undefined ? undefined : String(body.requestId),
    })
    if (!updated) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })

    revalidatePublishedArticle({
      categorySlug: updated.categorySlug,
      slug: updated.slug,
      tagSlugs: updated.tagSlugs,
    })

    // The reader who reported it should stop seeing their request as open.
    if (body.requestId) {
      await updateSubmissionStatus({
        id: String(body.requestId),
        status: 'accepted',
        handledBy: session.userId,
        editorNote: `Correction issued on /${updated.categorySlug}/${updated.slug}`,
      }).catch((error) => {
        console.error('[admin/corrections] closing the submission failed', error)
      })
    }

    try {
      await recordAuditEvent({
        session,
        action: 'update',
        targetType: 'article',
        targetId: updated.id,
        summary: `Correction issued: ${updated.titleNe}`,
        meta: {
          slug: updated.slug,
          severity: body.severity,
          corrections: updated.corrections?.length ?? 0,
        },
      })
    } catch (auditError) {
      console.error('[admin/corrections] audit failed', auditError)
    }

    return NextResponse.json({
      ok: true,
      corrections: updated.corrections ?? [],
      publicPath: `/${updated.categorySlug}/${updated.slug}`,
    })
  } catch (err) {
    console.error('[admin/corrections] issue failed', err)
    const msg = err instanceof Error ? err.message : 'सच्याइएको विवरण थप्न सकिएन।'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
