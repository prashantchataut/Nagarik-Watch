import 'server-only'
import {
  listArticlesForAdmin,
  updateArticle,
} from '@/lib/content/store/json-store'
import {
  isPayloadCanonical,
  publishDuePayloadScheduledArticles,
} from '@/lib/content/payload-admin-client'
import { revalidatePublishedArticle } from '@/lib/content/revalidate-published'
import { canActorTransition } from '@/lib/editorial/workflow-transitions'

const SYSTEM_ACTOR = 'system:scheduled-publish'
const SYSTEM_ROLE = 'publisher' as const

export type ScheduledPublishResult = {
  published: Array<{ id: string; slug: string; publishedAt: string }>
  skipped: string
  inspected: number
}

/**
 * Promote due `scheduled` articles to `published` when publishedAt <= now.
 * Editors set workflowStage=scheduled and publishedAt to the go-live time.
 * Idempotent: already-published rows are ignored.
 */
export async function runScheduledPublish(now = new Date()): Promise<ScheduledPublishResult> {
  if (isPayloadCanonical()) {
    try {
      const payload = await publishDuePayloadScheduledArticles(now)
      for (const article of payload.published) {
        if (!article.categorySlug || !article.slug) continue
        revalidatePublishedArticle({
          categorySlug: article.categorySlug,
          slug: article.slug,
          tagSlugs: article.tagSlugs,
        })
      }
      return {
        published: payload.published.map((item) => ({
          id: item.id,
          slug: item.slug,
          publishedAt: item.publishedAt,
        })),
        skipped: payload.published.length === 0 ? 'none-due' : 'ok',
        inspected: payload.inspected,
      }
    } catch (error) {
      console.error(
        '[scheduled-publish] payload canonical failed',
        error instanceof Error ? error.message : error,
      )
      return {
        published: [],
        skipped: 'payload-publish-failed',
        inspected: 0,
      }
    }
  }

  let articles
  try {
    const listed = await listArticlesForAdmin({ limit: 500 })
    articles = listed.items
  } catch (error) {
    console.error(
      '[scheduled-publish] listArticlesForAdmin failed',
      error instanceof Error ? error.message : error,
    )
    return { published: [], skipped: 'store-unavailable', inspected: 0 }
  }
  const due = articles.filter((article) => {
    if (article.workflowStage !== 'scheduled') return false
    const at = Date.parse(article.publishedAt)
    if (!Number.isFinite(at)) return false
    return at <= now.getTime()
  })

  const published: ScheduledPublishResult['published'] = []

  for (const article of due) {
    if (!canActorTransition('system', article.workflowStage, 'published')) continue
    try {
      const updated = await updateArticle(
        article.id,
        {
          workflowStage: 'published',
          noIndex: false,
          includeInNewsSitemap: true,
        },
        SYSTEM_ACTOR,
        SYSTEM_ROLE,
      )
      if (!updated) continue
      revalidatePublishedArticle({
        categorySlug: updated.categorySlug,
        slug: updated.slug,
        tagSlugs: updated.tagSlugs,
      })
      published.push({
        id: updated.id,
        slug: updated.slug,
        publishedAt: updated.publishedAt,
      })
    } catch (error) {
      console.error(
        '[scheduled-publish] failed',
        article.id,
        error instanceof Error ? error.message : error,
      )
    }
  }

  return {
    published,
    skipped: published.length === 0 ? (due.length === 0 ? 'none-due' : 'transition-blocked') : 'ok',
    inspected: articles.length,
  }
}
