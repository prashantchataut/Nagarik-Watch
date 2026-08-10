import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { requireNewsroomSession } from '@/lib/auth/session'
import { createArticle } from '@/lib/content/store/json-store'
import type { StoredArticle } from '@/lib/content/store/json-store'
import { canCreate, canPublish } from '@/lib/admin-roles'
import { blocksFromShorthand } from '@/lib/content/blocks'
import { enforceRateLimit } from '@/lib/rate-limit'
import { recordAuditEvent } from '@/lib/audit-log'
import {
  revalidatePublishedArticle,
  publicArticlePath,
  isPubliclyVisibleStage,
} from '@/lib/content/revalidate-published'
import {
  isPayloadCanonical,
  payloadAdminUrlIfConfigured,
  shouldBlockLocalContentWrites,
} from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

function payloadCanonicalBlockedResponse() {
  const canonical = isPayloadCanonical()
  return NextResponse.json(
    {
      error: canonical
        ? 'सार्वजनिक साइट Payload CMS बाट चल्छ। यो स्थानीय डेस्कबाट लेख सुरक्षित/प्रकाशित गर्दा पाठकले देख्दैनन्।'
        : 'Live deployment content authority is misconfigured. Shadow-store article writes are blocked to prevent invisible publications.',
      cmsUrl: payloadAdminUrlIfConfigured() ?? undefined,
      visibility: 'blocked',
      visibilityHint: canonical
        ? 'Publish editorial content from Payload CMS.'
        : 'Set CONTENT_SOURCE=payload and PAYLOAD_PUBLIC_SERVER_URL on the web deployment, then redeploy.',
    },
    { status: canonical ? 409 : 503 },
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
  if (shouldBlockLocalContentWrites()) return payloadCanonicalBlockedResponse()
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
  const isPublishing = requestedStage === 'published' || requestedStage === 'updated'
  if (isPublishing && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'प्रकाशन अनुमति छैन।' }, { status: 403 })
  }
  if (requestedStage === 'scheduled' && !canPublish(session.newsroomRole)) {
    return NextResponse.json({ error: 'तालिका अनुमति छैन।' }, { status: 403 })
  }
  const authorIds = Array.isArray(body.authorIds) ? body.authorIds.map(String) : []
  if (isPublishing && authorIds.length === 0) {
    return NextResponse.json({ error: 'प्रकाशन अघि कम्तीमा एक लेखक छान्नुहोस्।' }, { status: 400 })
  }
  const heroImageUrl = body.heroImageUrl ? String(body.heroImageUrl) : undefined
  const heroImageAlt = body.heroImageAlt ? String(body.heroImageAlt) : undefined
  if (isPublishing && heroImageUrl && !heroImageAlt) {
    return NextResponse.json({ error: 'हीरो तस्बिरको alt पाठ अनिवार्य छ।' }, { status: 400 })
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
      heroImageUrl,
      heroImageAlt,
      heroCaptionNe: body.heroCaptionNe ? String(body.heroCaptionNe) : undefined,
      heroCredit: body.heroCredit ? String(body.heroCredit) : undefined,
      authorIds,
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
      commentsEnabled: body.commentsEnabled === true,
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
      try {
        await recordAuditEvent({
          session,
          action: 'publish',
          targetType: 'article',
          targetId: article.id,
          summary: `Article published: ${article.titleNe}`,
          meta: { slug: article.slug, workflowStage: requestedStage },
        })
      } catch (auditError) {
        console.error('[admin/articles] audit after create-publish failed', auditError)
      }
    }
    const publicPath = publicArticlePath(article.categorySlug, article.slug)
    const visibility = isPubliclyVisibleStage(article.workflowStage) ? 'public' : 'draft'
    return NextResponse.json(
      {
        ...article,
        publicPath,
        visibility,
        visibilityHint:
          visibility === 'public'
            ? 'सार्वजनिक साइटमा देखिनुपर्छ (ताजा / विभाग / लेख URL)।'
            : 'ड्राफ्ट मात्र सुरक्षित भयो। सार्वजनिक गर्न "प्रकाशित गर्नुहोस्" थिच्नुहोस्।',
      },
      { status: 201 },
    )
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
