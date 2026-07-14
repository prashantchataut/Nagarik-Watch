import { createHmac } from 'node:crypto'
import type { CollectionAfterChangeHook } from 'payload'

type ArticleDoc = {
  id: string | number
  slug?: string
  workflowStage?: string
  _status?: string
  category?: string | number | { id?: string | number; slug?: string }
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
      collection: 'categories'
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

/**
 * Notify the reader deployment after a published article changes.
 * Publishing remains available if the reader deployment is temporarily down;
 * the failure is logged and the site's normal dynamic reads remain the backstop.
 */
export const revalidatePublishedArticle: CollectionAfterChangeHook = async ({ doc, req }) => {
  const article = doc as ArticleDoc
  if (article._status !== 'published') return doc
  if (article.workflowStage !== 'published' && article.workflowStage !== 'updated') return doc

  const baseUrl = webBaseUrl()
  const secret = signingSecret()
  if (!baseUrl || !secret) {
    req.payload.logger.warn(
      'Publish webhook skipped: NEXT_PUBLIC_SITE_URL/WEB_PUBLIC_URL and a 32+ character REVALIDATE_SECRET are required.',
    )
    return doc
  }

  const payload = JSON.stringify({
    event: 'article.changed',
    articleId: String(article.id),
    slug: String(article.slug ?? ''),
    categorySlug: await categorySlug(article, req),
    status: article.workflowStage,
  })
  const timestamp = String(Date.now())
  const signature = createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex')

  try {
    const response = await fetch(`${baseUrl}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-nw-timestamp': timestamp,
        'x-nw-signature': signature,
      },
      body: payload,
      signal: AbortSignal.timeout(5000),
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
