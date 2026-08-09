import { createHmac } from 'node:crypto'
import type { CollectionAfterChangeHook } from 'payload'

type ArticleDoc = {
  id: string | number
  slug?: string
  workflowStage?: string
  _status?: string
  category?: string | number | { id?: string | number; slug?: string }
  titleNe?: string
  titleEn?: string
  isBreaking?: boolean
  notificationMode?: 'none' | 'followers' | 'breaking'
  notificationTagSlugs?: unknown
  publishAt?: string
  authors?: Array<{ author?: string | number | { slug?: string } }>
  tags?: Array<{ tag?: string | number | { slug?: string } }>
}

function isReaderVisible(article: ArticleDoc | null | undefined): boolean {
  if (!article || article._status !== 'published') return false
  if (article.workflowStage !== 'published' && article.workflowStage !== 'updated') return false
  const publishAt = article.publishAt ? Date.parse(String(article.publishAt)) : 0
  return !publishAt || !Number.isFinite(publishAt) || publishAt <= Date.now()
}

function webBaseUrl(): string | null {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.WEB_PUBLIC_URL?.trim()
  return value ? value.replace(/\/$/, '') : null
}

function signingSecret(): string | null {
  const secret = process.env.REVALIDATE_SECRET?.trim()
  return secret && secret.length >= 32 ? secret : null
}

type PayloadRequestLike = {
  payload: {
    findByID(args: {
      collection: 'categories' | 'authors' | 'tags'
      id: string | number
      depth: number
      overrideAccess: boolean
    }): Promise<unknown>
  }
}

async function categorySlug(doc: ArticleDoc, req: PayloadRequestLike) {
  const category = doc.category
  if (category && typeof category === 'object' && category.slug) return String(category.slug)
  const id = typeof category === 'object' ? category.id : category
  if (id === undefined || id === null) return ''
  try {
    const categoryDoc = await req.payload.findByID({
      collection: 'categories',
      id,
      depth: 0,
      overrideAccess: true,
    })
    return String((categoryDoc as { slug?: string }).slug ?? '')
  } catch {
    return ''
  }
}


async function relationshipSlugs(
  items: Array<{ author?: string | number | { id?: string | number; slug?: string }; tag?: string | number | { id?: string | number; slug?: string } }> | undefined,
  field: 'author' | 'tag',
  collection: 'authors' | 'tags',
  req: PayloadRequestLike,
): Promise<string[]> {
  const slugs = await Promise.all((items ?? []).map(async (item) => {
    const relationship = item[field]
    if (relationship && typeof relationship === 'object' && relationship.slug) return String(relationship.slug)
    const id = typeof relationship === 'object' ? relationship?.id : relationship
    if (id === undefined || id === null) return ''
    try {
      const related = await req.payload.findByID({ collection, id, depth: 0, overrideAccess: true })
      return String((related as { slug?: string }).slug ?? '')
    } catch {
      return ''
    }
  }))
  return [...new Set(slugs.filter(Boolean))]
}

/**
 * Notify the reader deployment after a published article changes.
 * Publishing remains available if the reader deployment is temporarily down;
 * the failure is logged and the site's normal dynamic reads remain the backstop.
 */
export const revalidatePublishedArticle: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  const article = doc as ArticleDoc
  const previous = (previousDoc ?? null) as ArticleDoc | null
  const visibleNow = isReaderVisible(article)
  const visibleBefore = isReaderVisible(previous)
  if (!visibleNow && !visibleBefore) return doc

  const baseUrl = webBaseUrl()
  const secret = signingSecret()
  if (!baseUrl || !secret) {
    req.payload.logger.warn(
      'Publish webhook skipped: NEXT_PUBLIC_SITE_URL/WEB_PUBLIC_URL and a 32+ character REVALIDATE_SECRET are required.',
    )
    return doc
  }

  const [currentCategorySlug, previousCategorySlug, authorSlugs, tagSlugs] = await Promise.all([
    categorySlug(article, req),
    previous ? categorySlug(previous, req) : Promise.resolve(''),
    relationshipSlugs(article.authors, 'author', 'authors', req),
    relationshipSlugs(article.tags, 'tag', 'tags', req),
  ])

  const payload = JSON.stringify({
    event: 'article.changed',
    articleId: String(article.id),
    slug: String(article.slug ?? ''),
    categorySlug: currentCategorySlug,
    previousSlug: previous ? String(previous.slug ?? '') : undefined,
    previousCategorySlug,
    status: visibleNow ? article.workflowStage : 'unpublished',
    titleNe: String(article.titleNe ?? ''),
    titleEn: article.titleEn ? String(article.titleEn) : undefined,
    isBreaking: Boolean(article.isBreaking),
    notificationMode: article.notificationMode ?? 'none',
    notificationTagSlugs: Array.isArray(article.notificationTagSlugs) ? article.notificationTagSlugs.map(String) : [],
    publishedAt: article.publishAt ? String(article.publishAt) : new Date().toISOString(),
    authorSlugs,
    tagSlugs,
  })
  const timestamp = String(Date.now())
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

  try {
    const timeoutMs = Math.max(
      500,
      Math.min(5_000, Number(process.env.NW_REVALIDATE_TIMEOUT_MS ?? 1_500)),
    )
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nw-timestamp': timestamp,
        'x-nw-signature': signature,
      },
      body: payload,
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      req.payload.logger.error(
        `Reader revalidation failed (${response.status}): ${detail.slice(0, 300)}`,
      )
    }
  } catch (error) {
    req.payload.logger.error(
      `Reader revalidation failed: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  return doc
}
