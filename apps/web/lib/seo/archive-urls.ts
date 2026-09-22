/**
 * Every article URL the site can serve, for the sharded archive sitemap.
 *
 * Reads the content façade page by page instead of asking for one enormous
 * page: both sources slice in memory, and a single `perPage: 100000` would
 * materialise the whole archive as story cards in one allocation. Paging also
 * means a source that caps `perPage` internally still yields everything.
 */
import { getStories } from '@/lib/content'
import { SITE_URL } from '@/lib/site'
import { newsSitemapPriority } from '@/lib/algorithms/product/seo-dist'
import { MAX_SITEMAP_SHARDS, SITEMAP_URLS_PER_SHARD } from './sitemap-shards'

const PER_PAGE = 250
/** Stop before the shard planner's own ceiling; two locales per story. */
const MAX_STORIES = (MAX_SITEMAP_SHARDS * SITEMAP_URLS_PER_SHARD) / 2

export type ArchiveUrl = {
  loc: string
  lastModified: string
  priority: number
  alternates: Record<string, string>
}

export async function collectArchiveUrls(now = Date.now()): Promise<ArchiveUrl[]> {
  const urls: ArchiveUrl[] = []
  let page = 1
  let totalPages = 1
  let collected = 0

  while (page <= totalPages && collected < MAX_STORIES) {
    const result = await getStories({ locale: 'ne', page, perPage: PER_PAGE })
    totalPages = Math.max(1, result.totalPages)
    if (result.items.length === 0) break
    collected += result.items.length

    for (const story of result.items) {
      if (story.noIndex === true) continue
      const lastModified = new Date(story.publishedAt).toISOString()
      const ageHours = (now - Date.parse(story.publishedAt)) / 3_600_000
      // Same recency weighting the main sitemap uses, so a story does not
      // change importance by moving between files.
      const priority = 0.4 + newsSitemapPriority(ageHours, story.isBreaking, 0.8) * 0.5
      const alternates: Record<string, string> = {
        ne: `${SITE_URL}/${story.category.slug}/${story.slug}`,
      }
      if (story.hasEnglish) {
        alternates.en = `${SITE_URL}/en/${story.category.slug}/${story.slug}`
      }
      urls.push({ loc: alternates.ne, lastModified, priority, alternates })
      if (story.hasEnglish && alternates.en) {
        urls.push({ loc: alternates.en, lastModified, priority, alternates })
      }
    }
    page += 1
  }

  // Stable order across builds, so a shard's contents only change when the
  // archive does — a crawler re-fetching shard 2 should not find a different
  // slice of the site because two stories share a timestamp.
  urls.sort((a, b) => b.lastModified.localeCompare(a.lastModified) || a.loc.localeCompare(b.loc))
  return urls
}
