import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { updateArticle, deleteArticle, getArticleById } from '@/lib/content/store/json-store'
import type { StoredArticle } from '@/lib/content/store/json-store'
import { canEdit, canDelete, canPublish } from '@/lib/admin-roles'
import type { ArticleBlock } from '@nagarikwatch/db'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { enforceRateLimit } from '@/lib/rate-limit'
import { recordAuditEvent } from '@/lib/audit-log'
import { revalidatePublishedArticle, publicArticlePath, isPubliclyVisibleStage } from '@/lib/content/revalidate-published'
import {
  isPayloadCanonical,
  payloadAdminUrl,
} from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

function payloadCanonicalBlockedResponse() {
  return NextResponse.json(
    {
      error:
        'सार्वजनिक साइट Payload CMS बाट चल्छ। यो स्थानीय डेस्कबाट लेख सुरक्षित/प्रकाशित गर्दा पाठकले देख्दैनन्।',
      cmsUrl: payloadAdminUrl(),
      visibility: 'shadow',
      visibilityHint:
        'CONTENT_SOURCE=payload छ। प्रकाशन Payload एडमिनबाट गर्नुहोस्, वा CONTENT_SOURCE=json राख्नुहोस्।',
    },
    { status: 409 },
  )
}

const WORKFLOW_STAGES: StoredArticle['workflowStage'][] = [
  'idea',
  'assigned',
  'draft',
  'submitted',
  'fact_check',
  'copy_edit',
  'seo_review',
  'legal_review',
  'ready',
  'scheduled',
  'published',
  'updated',
  'archived',
  'retracted',
]

function isWorkflowStage(value: unknown): value is StoredArticle['workflowStage'] {
  return (
    typeof value === 'string' && WORKFLOW_STAGES.includes(value as StoredArticle['workflowStage'])
  )
}

/** GET /api/admin/articles/[id] — fetch a single article for the editor. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceRateLimit(request, 'admin-article-read', 120, 60_000)
  if (limited) return limited
  try {
    await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  const { id } = await params
  try {
    const article = await getArticleById(id)
    if (!article) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
    return NextResponse.json(article)
  } catch (err) {
    console.error('[admin/articles] get failed', err)
    return NextResponse.json({ error: 'Article lookup failed.' }, { status: 503 })
  }
}

/** PUT /api/admin/articles/[id] — update an article. Editors+ can update. */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (isPayloadCanonical()) return payloadCanonicalBlockedResponse()
  const limited = await enforceRateLimit(request, 'admin-article-update', 40, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canEdit(session.newsroomRole)) {
    return NextResponse.json({ error: 'सम्पादन अनुमति छैन।' }, { status: 403 })
  }
  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const requestedStage = isWorkflowStage(body.workflowStage) ? body.workflowStage : undefined
  if (body.workflowStage !== undefined && !requestedStage) {
    return NextResponse.json({ error: 'Invalid workflow stage' }, { status: 400 })
  }
  if (requestedStage === 'published' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'प्रकाशन अनुमति छैन।' }, { status: 403 })
  }
  if (requestedStage === 'scheduled' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'तालिका अनुमति छैन।' }, { status: 403 })
  }
  if (requestedStage === 'published' || requestedStage === 'updated') {
    const authorIds = Array.isArray(body.authorIds) ? body.authorIds.map(String) : null
    if (authorIds && authorIds.length === 0) {
      return NextResponse.json({ error: 'प्रकाशन अघि कम्तीमा एक लेखक छान्नुहोस्।' }, { status: 400 })
    }
    const heroUrl = body.heroImageUrl !== undefined ? String(body.heroImageUrl ?? '').trim() : null
    const heroAlt = body.heroImageAlt !== undefined ? String(body.heroImageAlt ?? '').trim() : null
    if (heroUrl && !heroAlt) {
      return NextResponse.json({ error: 'हीरो तस्बिरको alt पाठ अनिवार्य छ।' }, { status: 400 })
    }
  }

  try {
    const patch: Record<string, unknown> = { ...body }
    if (requestedStage === 'published') {
      if (body.noIndex === undefined) patch.noIndex = false
      if (body.includeInNewsSitemap === undefined) patch.includeInNewsSitemap = true
    } else if (requestedStage) {
      if (body.noIndex === undefined) patch.noIndex = true
      if (body.includeInNewsSitemap === undefined) patch.includeInNewsSitemap = false
    }
    if (body.bodyNe !== undefined) {
      patch.bodyNe = blocksFromShorthand(body.bodyNe, String(body.titleNe ?? '')) as ArticleBlock[]
    }
    if (body.bodyEn !== undefined) {
      const bodyEn = blocksFromShorthand(body.bodyEn)
      patch.bodyEn = bodyEn.length > 0 ? bodyEn : undefined
    }

    const updated = await updateArticle(
      id,
      patch as Parameters<typeof updateArticle>[1],
      session.userId,
      session.newsroomRole,
    )
    if (!updated) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
    if (requestedStage === 'published' || requestedStage === 'updated') {
      revalidatePublishedArticle({
        categorySlug: updated.categorySlug,
        slug: updated.slug,
        tagSlugs: updated.tagSlugs,
      })
      try {
        await recordAuditEvent({
          session,
          action: 'publish',
          targetType: 'article',
          targetId: updated.id,
          summary: `Article published: ${updated.titleNe}`,
          meta: { slug: updated.slug, workflowStage: requestedStage },
        })
      } catch (auditError) {
        console.error('[admin/articles] audit after publish failed', auditError)
      }
    } else {
      // Stage may have left public visibility; still bust caches for the URL.
      revalidatePublishedArticle({
        categorySlug: updated.categorySlug,
        slug: updated.slug,
        tagSlugs: updated.tagSlugs,
      })
    }
    const publicPath = publicArticlePath(updated.categorySlug, updated.slug)
    const visibility = isPubliclyVisibleStage(updated.workflowStage) ? 'public' : 'draft'
    return NextResponse.json({
      ...updated,
      publicPath,
      visibility,
      visibilityHint:
        visibility === 'public'
          ? 'सार्वजनिक साइटमा देखिनुपर्छ (ताजा / विभाग / लेख URL)।'
          : 'ड्राफ्ट मात्र सुरक्षित भयो। सार्वजनिक गर्न "प्रकाशित गर्नुहोस्" थिच्नुहोस्।',
    })
  } catch (err) {
    console.error('[admin/articles] update failed', err)
    const msg = err instanceof Error ? err.message : 'सुरक्षित गर्न सकिएन।'
    if (msg.includes('स्लग पहिले नै अवस्थित') || /unique|duplicate key/i.test(msg)) {
      return NextResponse.json({ error: msg.includes('स्लग') ? msg : 'स्लग पहिले नै अवस्थित छ।' }, { status: 409 })
    }
    if (/DATABASE_URL|Postgres|production/i.test(msg)) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/** DELETE /api/admin/articles/[id] — delete an article. Super admin only. */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (isPayloadCanonical()) return payloadCanonicalBlockedResponse()
  const limited = await enforceRateLimit(request, 'admin-article-delete', 10, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canDelete(session.newsroomRole)) {
    return NextResponse.json({ error: 'मेटाउन अनुमति छैन। केवल मुख्य एडमिन।' }, { status: 403 })
  }
  const { id } = await params
  try {
    const existing = await getArticleById(id)
    if (!existing) return NextResponse.json({ error: 'भेटिएन।' }, { status: 404 })
    const ok = await deleteArticle(id)
    if (ok && isPubliclyVisibleStage(existing.workflowStage)) {
      revalidatePublishedArticle({
        categorySlug: existing.categorySlug,
        slug: existing.slug,
        tagSlugs: existing.tagSlugs,
      })
    }
    return NextResponse.json({ ok, deletedId: id, deletedBy: session.userId })
  } catch (err) {
    console.error('[admin/articles] delete failed', err)
    return NextResponse.json({ error: 'मेटाउन सकिएन।' }, { status: 503 })
  }
}
