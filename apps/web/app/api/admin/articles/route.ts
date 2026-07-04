import { NextResponse, type NextRequest } from 'next/server'
import { requireNewsroomSession } from '@/lib/auth/session'
import { createArticle } from '@/lib/content/store/json-store'
import { canCreate, canPublish } from '@/lib/admin-roles'
import type { ArticleBlock } from '@nagarikwatch/db'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/articles — create a new article. Editors and above can
 * create; only publishers can set workflowStage to 'published'.
 *
 * Body matches the StoredArticle create input. The bodyNe/bodyEn fields are
 * arrays of ArticleBlock — the editor form converts markdown-shorthand to
 * blocks on the client.
 */
export async function POST(request: NextRequest) {
  const session = await requireNewsroomSession()
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

  const requestedStage = String(body.workflowStage ?? 'draft') as 'draft' | 'published'
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
      bodyNe: (body.bodyNe as ArticleBlock[]) ?? [{ type: 'paragraph', text: titleNe }],
      bodyEn: body.bodyEn ? (body.bodyEn as ArticleBlock[]) : undefined,
      heroImageUrl: body.heroImageUrl ? String(body.heroImageUrl) : undefined,
      heroImageAlt: body.heroImageAlt ? String(body.heroImageAlt) : undefined,
      heroCaptionNe: body.heroCaptionNe ? String(body.heroCaptionNe) : undefined,
      heroCredit: body.heroCredit ? String(body.heroCredit) : undefined,
      authorIds: Array.isArray(body.authorIds) ? body.authorIds.map(String) : [],
      tagSlugs: Array.isArray(body.tagSlugs) ? body.tagSlugs.map(String) : [],
      isBreaking: Boolean(body.isBreaking),
      isFeatured: (body.isFeatured as 'lead' | 'secondary' | 'none') ?? 'none',
      workflowStage: requestedStage,
      sourceType: (body.sourceType as 'original' | 'aggregated' | 'wire') ?? 'original',
      sourceName: body.sourceName ? String(body.sourceName) : undefined,
      sourceUrl: body.sourceUrl ? String(body.sourceUrl) : undefined,
      seoTitleNe: body.seoTitleNe ? String(body.seoTitleNe) : undefined,
      seoDescriptionNe: body.seoDescriptionNe ? String(body.seoDescriptionNe) : undefined,
      noIndex: Boolean(body.noIndex),
      includeInNewsSitemap: body.includeInNewsSitemap !== false,
      aiSummary: body.aiSummary ? String(body.aiSummary) : undefined,
      premium: Boolean(body.premium),
      commentsEnabled: body.commentsEnabled !== false,
      locale: body.locale === 'en' ? 'en' : 'ne',
      createdBy: session.userId,
    })
    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'सुरक्षित गर्न सकिएन।'
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
