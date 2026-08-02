import type { StoryCardData } from '@nagarikwatch/db'
import { detectTrending } from '@nagarikwatch/db'
import { getTrendingSamples } from '@/lib/engagement/store'

/**
 * Resolve homepage trending rail from first-party velocity samples.
 * Falls back to recent catalog when signal is thin. Overlap with other lenses is allowed.
 */
export async function resolveTrendingStories(options: {
  catalog: StoryCardData[]
  limit?: number
  windowMinutes?: number
  minLive?: number
}): Promise<{ stories: StoryCardData[]; live: boolean }> {
  const limit = options.limit ?? 6
  const minLive = options.minLive ?? 2
  const bySlug = new Map(options.catalog.map((story) => [story.slug, story]))

  const samples = await getTrendingSamples(options.windowMinutes ?? 120).catch(() => [])
  // Samples key articleId by slug; align story.id so detectTrending can join.
  const keyed = options.catalog.map((story) => ({ ...story, id: story.slug }))
  const ranked = detectTrending(keyed, samples)
    .filter((story) => story.trendingScore > 0)
    .map((story) => bySlug.get(story.slug))
    .filter((story): story is StoryCardData => Boolean(story))

  const unique: StoryCardData[] = []
  const seen = new Set<string>()
  for (const story of ranked) {
    if (seen.has(story.id)) continue
    seen.add(story.id)
    unique.push(story)
    if (unique.length >= limit) break
  }

  if (unique.length >= minLive) {
    return { stories: unique, live: true }
  }

  const fallback = [...options.catalog]
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, limit)

  return { stories: fallback, live: false }
}
