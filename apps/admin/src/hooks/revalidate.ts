import { createHmac } from 'node:crypto'
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'

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
  readerRevalidateStatus?: string
  readerRevalidateAt?: string
  readerRevalidateError?: string
}

type SyncStatus = 'pending' | 'ok' | 'failed' | 'skipped'

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
  context?: Record<string, unknown>
  payload: {
    logger: { warn: (msg: string) => void; error: (msg: string) => void }
    findByID(args: {
      collection: 'categories' | 'authors' | 'tags'
      id: string | number
      depth: number
      overrideAccess: boolean
    }): Promise<unknown>
    update(args: {
      collection: 'articles'
      id: string | number
      data: Record<string, unknown>
      depth: number
      overrideAccess: boolean
      context?: Record<string, unknown>
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
  items:
    | Array<{
        author?: string | number | { id?: string | number; slug?: string }
        tag?: string | number | { id?: string | number; slug?: string }
      }>
    | undefined,
  field: 'author' | 'tag',
  collection: 'authors' | 'tags',
  req: PayloadRequestLike,
): Promise<string[]> {
  const slugs = await Promise.all(
    (items ?? []).map(async (item) => {
      const relationship = item[field]
      if (relationship && typeof relationship === 'object' && relationship.slug)
        return String(relationship.slug)
      const id = typeof relationship === 'object' ? relationship?.id : relationship
      if (id === undefined || id === null) return ''
      try {
        const related = await req.payload.findByID({
          collection,
          id,
          depth: 0,
          overrideAccess: true,
        })
        return String((related as { slug?: string }).slug ?? '')
      } catch {
        return ''
      }
    }),
  )
  return [...new Set(slugs.filter(Boolean))]
}

async function postRevalidate(
  baseUrl: string,
  secret: string,
  body: string,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; detail: string }> {
  const timestamp = String(Date.now())
  const signature = createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')
  try {
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nw-timestamp': timestamp,
        'x-nw-signature': signature,
      },
      body,
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => '')
      return { ok: false, status: response.status, detail: detail.slice(0, 300) }
    }
    return { ok: true, status: response.status, detail: '' }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      detail: error instanceof Error ? error.message : String(error),
    }
  }
}

async function postRevalidateWithRetry(
  baseUrl: string,
  secret: string,
  body: string,
  req: PayloadRequestLike,
): Promise<{ ok: boolean; detail: string }> {
  const timeoutMs = Math.max(
    500,
    Math.min(5_000, Number(process.env.NW_REVALIDATE_TIMEOUT_MS ?? 1_500)),
  )
  const attempts = Math.max(1, Math.min(4, Number(process.env.NW_REVALIDATE_RETRIES ?? 3)))
  let lastDetail = ''
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const result = await postRevalidate(baseUrl, secret, body, timeoutMs)
    if (result.ok) return { ok: true, detail: '' }
    lastDetail =
      result.status > 0
        ? `HTTP ${result.status}: ${result.detail}`
        : result.detail || 'revalidate request failed'
    req.payload.logger.error(
      `Reader revalidation attempt ${attempt}/${attempts} failed: ${lastDetail}`,
    )
    if (attempt < attempts) {
      await new Promise((resolve) => setTimeout(resolve, 150 * attempt))
    }
  }
  return { ok: false, detail: lastDetail }
}

async function recordSyncStatus(
  req: PayloadRequestLike,
  articleId: string | number,
  status: SyncStatus,
  error?: string,
) {
  try {
    await req.payload.update({
      collection: 'articles',
      id: articleId,
      depth: 0,
      overrideAccess: true,
      context: { skipReaderRevalidate: true },
      data: {
        readerRevalidateStatus: status,
        readerRevalidateAt: new Date().toISOString(),
        readerRevalidateError: error ? error.slice(0, 500) : null,
      },
    })
  } catch (syncError) {
    req.payload.logger.error(
      `Could not persist reader revalidate status: ${
        syncError instanceof Error ? syncError.message : String(syncError)
      }`,
    )
  }
}

function buildRevalidatePayload(input: {
  article: ArticleDoc
  previous: ArticleDoc | null
  currentCategorySlug: string
  previousCategorySlug: string
  authorSlugs: string[]
  tagSlugs: string[]
  visibleNow: boolean
  forceUnpublish?: boolean
}) {
  const {
    article,
    previous,
    currentCategorySlug,
    previousCategorySlug,
    authorSlugs,
    tagSlugs,
    visibleNow,
    forceUnpublish,
  } = input
  return JSON.stringify({
    event: forceUnpublish ? 'article.deleted' : 'article.changed',
    articleId: String(article.id),
    slug: String(article.slug ?? ''),
    categorySlug: currentCategorySlug || previousCategorySlug,
    previousSlug: previous ? String(previous.slug ?? '') : undefined,
    previousCategorySlug,
    status: visibleNow && !forceUnpublish ? article.workflowStage : 'unpublished',
    titleNe: String(article.titleNe ?? ''),
    titleEn: article.titleEn ? String(article.titleEn) : undefined,
    isBreaking: Boolean(article.isBreaking),
    notificationMode: article.notificationMode ?? 'none',
    notificationTagSlugs: Array.isArray(article.notificationTagSlugs)
      ? article.notificationTagSlugs.map(String)
      : [],
    publishedAt: article.publishAt ? String(article.publishAt) : new Date().toISOString(),
    authorSlugs,
    tagSlugs,
  })
}

/**
 * Notify the reader deployment after a published article changes.
 * Publishing remains available if the reader deployment is temporarily down;
 * the failure is logged, status fields updated, and dynamic reads remain the backstop.
 */
export const revalidatePublishedArticle: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  if (req.context?.skipReaderRevalidate) return doc

  const article = doc as ArticleDoc
  const previous = (previousDoc ?? null) as ArticleDoc | null
  const visibleNow = isReaderVisible(article)
  const visibleBefore = isReaderVisible(previous)
  const slugChanged =
    Boolean(previous?.slug) &&
    Boolean(article.slug) &&
    String(previous?.slug) !== String(article.slug)
  const categoryChanged =
    previous != null &&
    JSON.stringify(previous.category ?? null) !== JSON.stringify(article.category ?? null)

  if (!visibleNow && !visibleBefore && !slugChanged && !categoryChanged) return doc

  const baseUrl = webBaseUrl()
  const secret = signingSecret()
  if (!baseUrl || !secret) {
    req.payload.logger.warn(
      'Publish webhook skipped: NEXT_PUBLIC_SITE_URL/WEB_PUBLIC_URL and a 32+ character REVALIDATE_SECRET are required.',
    )
    await recordSyncStatus(req, article.id, 'skipped', 'Missing WEB URL or REVALIDATE_SECRET')
    return doc
  }

  const [currentCategorySlug, previousCategorySlug, authorSlugs, tagSlugs] = await Promise.all([
    categorySlug(article, req),
    previous ? categorySlug(previous, req) : Promise.resolve(''),
    relationshipSlugs(article.authors, 'author', 'authors', req),
    relationshipSlugs(article.tags, 'tag', 'tags', req),
  ])

  const payload = buildRevalidatePayload({
    article,
    previous,
    currentCategorySlug,
    previousCategorySlug,
    authorSlugs,
    tagSlugs,
    visibleNow,
  })

  const result = await postRevalidateWithRetry(baseUrl, secret, payload, req)
  await recordSyncStatus(
    req,
    article.id,
    result.ok ? 'ok' : 'failed',
    result.ok ? undefined : result.detail,
  )

  return doc
}

/** Bust reader caches when a previously visible article is hard-deleted. */
export const revalidateDeletedArticle: CollectionAfterDeleteHook = async ({ doc, req }) => {
  if (req.context?.skipReaderRevalidate) return doc

  const article = doc as ArticleDoc
  if (!isReaderVisible(article) && article.workflowStage !== 'archived' && article.workflowStage !== 'retracted') {
    // Still bust if it was published/updated at any point with a slug.
    if (article._status !== 'published' || !article.slug) return doc
  }

  const baseUrl = webBaseUrl()
  const secret = signingSecret()
  if (!baseUrl || !secret) {
    req.payload.logger.warn(
      'Delete revalidation skipped: NEXT_PUBLIC_SITE_URL/WEB_PUBLIC_URL and REVALIDATE_SECRET are required.',
    )
    return doc
  }

  const [currentCategorySlug, authorSlugs, tagSlugs] = await Promise.all([
    categorySlug(article, req),
    relationshipSlugs(article.authors, 'author', 'authors', req),
    relationshipSlugs(article.tags, 'tag', 'tags', req),
  ])

  const payload = buildRevalidatePayload({
    article,
    previous: null,
    currentCategorySlug,
    previousCategorySlug: '',
    authorSlugs,
    tagSlugs,
    visibleNow: false,
    forceUnpublish: true,
  })

  const result = await postRevalidateWithRetry(baseUrl, secret, payload, req)
  if (!result.ok) {
    req.payload.logger.error(`Delete revalidation failed: ${result.detail}`)
  }
  return doc
}
