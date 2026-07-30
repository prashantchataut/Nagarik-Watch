import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { createArticle } from '@/lib/content/store/json-store'
import type { StoredArticle } from '@/lib/content/store/json-store'
import { canCreate, canPublish } from '@/lib/admin-roles'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { enforceRateLimit } from '@/lib/rate-limit'
import { recordAuditEvent } from '@/lib/audit-log'
import { revalidatePublishedArticle } from '@/lib/content/revalidate-published'

export const dynamic = 'force-dynamic'

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

function asWorkflowStage(value: unknown): StoredArticle['workflowStage'] {
  const stage = String(value ?? 'draft')
  return WORKFLOW_STAGES.includes(stage as StoredArticle['workflowStage'])
    ? (stage as StoredArticle['workflowStage'])
    : 'draft'
}

/**
 * POST /api/admin/articles — create a new article. Editors and above can
 * create; only publishers can set workflowStage to 'published'.
 *
 * Body matches the editor contract. bodyNe/bodyEn may arrive as the editor's
 * markdown-shorthand and are converted to ArticleBlock[] before persistence.
 */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'admin-article-create', 20, 60_000)
  if (limited) return limited

  let session
  try {
    session = await requireNewsroomSession()
  } catch {
    return NextResponse.json({ error: 'लगइन आवश्यक।' }, { status: 401 })
  }
  if (!canCreate(session.newsroomRole)) {
    return NextResponse.json({ error: 'अनुमति छैन।' }, { status: 403 })
  }
  if (isPayloadCanonical()) {
    return NextResponse.json(
      { error: 'Production content is managed in Payload CMS.', cmsUrl: `${payloadCollectionAdminUrl('articles')}/create` },
      { status: 409 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const slug = String(body.slug ?? '').trim()
  const categorySlug = String(body.categorySlug ?? '').trim()
  const titleNe = String(body.titleNe ?? '').trim()

  if (!slug || !categorySlug || !titleNe) {
    return NextResponse.json({ error: 'आवश्यक क्षेत्रहरू भर्नुहोस्।' }, { status: 400 })
  }

  const requestedStage = asWorkflowStage(body.workflowStage)
  const isPublishing = requestedStage === 'published'
  if (requestedStage === 'published' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'प्रकाशन अनुमति छैन।' }, { status: 403 })
  }

  try {
    const article = await createArticle({
      slug,
      categorySlug,
      titleNe,
      titleEn: body.titleEn ? String(body.titleEn) : undefined,
      deckNe: body.deckNe ? String(body.deckNe) : undefined,
      deckEn: body.deckEn ? String(body.deckEn) : undefined,
      bodyNe: blocksFromShorthand(body.bodyNe, titleNe),
      bodyEn: body.bodyEn ? blocksFromShorthand(body.bodyEn) : undefined,
      heroImageUrl: body.heroImageUrl ? String(body.heroImageUrl) : undefined,
      heroImageAlt: body.heroImageAlt ? String(body.heroImageAlt) : undefined,
      heroCaptionNe: body.heroCaptionNe ? String(body.heroCaptionNe) : undefined,
      heroCredit: body.heroCredit ? String(body.heroCredit) : undefined,
      authorIds: Array.isArray(body.authorIds) ? body.authorIds.map(String) : [],
      tagSlugs: Array.isArray(body.tagSlugs) ? body.tagSlugs.map(String) : [],
      isBreaking: Boolean(body.isBreaking),
      isFeatured: (body.isFeatured as 'lead' | 'featured' | 'secondary' | 'none') ?? 'none',
      featuredExpiresAt: body.featuredExpiresAt
        ? new Date(String(body.featuredExpiresAt)).toISOString()
        : undefined,
      workflowStage: requestedStage,
      publishedAt:
        requestedStage === 'scheduled' && body.publishedAt
          ? new Date(String(body.publishedAt)).toISOString()
          : undefined,
      sourceType: (body.sourceType as 'original' | 'aggregated' | 'wire') ?? 'original',
      sourceName: body.sourceName ? String(body.sourceName) : undefined,
      sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
      seoTitleNe: body.seoTitleNe ? String(body.seoTitleNe) : undefined,
      seoDescriptionNe: body.seoDescriptionNe ? String(body.seoDescriptionNe) : undefined,
      noIndex: body.noIndex === undefined ? !isPublishing : Boolean(body.noIndex),
      includeInNewsSitemap:
        body.includeInNewsSitemap === undefined
          ? isPublishing
          : body.includeInNewsSitemap !== false,
      aiSummary: body.aiSummary ? String(body.aiSummary) : undefined,
      premium: Boolean(body.premium),
      commentsEnabled: body.commentsEnabled !== false,
      locale: body.locale === 'en' ? 'en' : 'ne',
      createdBy: session.userId,
      province: body.province ? String(body.province) : undefined,
    })
    if (requestedStage === 'published') {
      revalidatePublishedArticle({
        categorySlug: article.categorySlug,
        slug: article.slug,
        tagSlugs: article.tagSlugs,
      })
      await recordAuditEvent({
        session,
        action: 'publish',
        targetType: 'article',
        targetId: article.id,
        summary: `Article published: ${article.titleNe}`,
        meta: { slug: article.slug, workflowStage: requestedStage },
      })
    }
    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    console.error('[admin/articles] create failed', err)
    const msg = err instanceof Error ? err.message : 'सुरक्षित गर्न सकिएन।'
    if (msg.includes('स्लग पहिले नै अवस्थित')) {
      return NextResponse.json({ error: msg }, { status: 409 })
    }
    if (/DATABASE_URL|Postgres|production/i.test(msg)) {
      return NextResponse.json({ error: msg }, { status: 503 })
    }
    if (/unique|duplicate key/i.test(msg)) {
      return NextResponse.json(
        { error: 'स्लग पहिले नै अवस्थित छ। अर्को स्लग राख्नुहोस्।' },
        { status: 409 },
      )
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
