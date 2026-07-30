import type { StoryCardData } from '@nagarikwatch/db'
import { getMostReadStats } from '@/lib/engagement/store'

/**
 * Resolve homepage / rail most-read from first-party dwell stats.
 * Falls back to recent catalog when engagement is still thin.
 */
export async function resolveMostReadStories(options: {
  catalog: StoryCardData[]
  excludeIds?: Set<string>
  limit?: number
  windowDays?: number
  minLive?: number
}): Promise<{ stories: StoryCardData[]; live: boolean }> {
  const limit = options.limit ?? 6
  const minLive = options.minLive ?? 3
  const exclude = options.excludeIds ?? new Set<string>()
  const bySlug = new Map(options.catalog.map((story) => [story.slug, story]))

  const stats = await getMostReadStats(options.windowDays ?? 7, Math.max(limit * 3, 24)).catch(
    () => [],
  )
  const liveStories: StoryCardData[] = []
  for (const row of stats) {
    const story = bySlug.get(row.articleSlug)
    if (!story || exclude.has(story.id)) continue
    liveStories.push(story)
    if (liveStories.length >= limit) break
  }

  if (liveStories.length >= minLive) {
    return { stories: liveStories, live: true }
  }

  const fallback = [...options.catalog]
    .filter((story) => !exclude.has(story.id))
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit)

  return { stories: fallback, live: false }
}
