import {
  continueReading,
  knnRecommend,
  recommend,
  storyTerms,
  type Bookmark,
  type ReaderProfile,
  type ReadingHistory,
  type ScoredRecommendation,
  type StoryCardData,
} from '@nagarikwatch/db'
import type { BookmarkRecord, ReadingHistoryRecord } from './state'
import type { ReaderPreferences } from './preferences-store'
import {
  authorFollowScore,
  rankContinueReading,
  reengagementWeight,
  returnVisitPropensity,
  scrollDepthQuality,
  topicFollowScore,
} from './signals'

export type ReaderAffinity = {
  categories: Map<string, number>
  authors: Map<string, number>
  topics: Map<string, number>
}

export type PersonalizedStory = ScoredRecommendation<StoryCardData>

/**
 * Human-auditable affinity summary used by tests and account UX. It is not a
 * second ranker; the canonical ordering still comes from @nagarikwatch/db.
 */
export function buildAffinity(
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  catalog: StoryCardData[],
  preferences?: ReaderPreferences | null,
): ReaderAffinity {
  const byId = new Map(catalog.map((story) => [story.id, story]))
  const categories = new Map<string, number>()
  const authors = new Map<string, number>()
  const topics = new Map<string, number>()
  const bump = (map: Map<string, number>, key: string | undefined, weight: number) => {
    if (!key) return
    map.set(key, (map.get(key) ?? 0) + weight)
  }

  for (const bookmark of bookmarks) {
    const story = bookmark.story ?? byId.get(bookmark.articleId)
    if (!story) continue
    bump(categories, story.category.slug, 4)
    story.authors.forEach((author) => bump(authors, author.slug, 4))
    story.tags?.forEach((tag) => bump(topics, tag.slug, 3))
  }
  for (const item of history) {
    const story = byId.get(item.articleId)
    const completionWeight = item.completed ? 2.5 : Math.max(0.5, (item.scrollDepth / 100) * 2)
    bump(categories, story?.category.slug ?? item.categorySlug, completionWeight)
    if (story) story.authors.forEach((author) => bump(authors, author.slug, completionWeight))
    else item.authorSlugs?.forEach((slug) => bump(authors, slug, completionWeight))
    if (story) story.tags?.forEach((tag) => bump(topics, tag.slug, completionWeight))
    else item.tagSlugs?.forEach((slug) => bump(topics, slug, completionWeight))
  }
  preferences?.categories.forEach((slug) => bump(categories, slug, 5))
  preferences?.authors.forEach((slug) => bump(authors, slug, 5))
  preferences?.tags.forEach((slug) => bump(topics, slug, 5))
  return { categories, authors, topics }
}

function toProfile(
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  preferences?: ReaderPreferences | null,
): ReaderProfile {
  const userId = 'browser-reader'
  return {
    userId,
    bookmarks: bookmarks.map((item): Bookmark => ({
      id: `bookmark:${item.articleId}`,
      userId,
      articleId: item.articleId,
      createdAt: item.savedAt,
    })),
    follows: [
      ...(preferences?.categories ?? []).map((targetSlug, index) => ({
        id: `follow:category:${index}:${targetSlug}`,
        userId,
        kind: 'category' as const,
        targetSlug,
        createdAt: preferences?.updatedAt ?? new Date(0).toISOString(),
      })),
      ...(preferences?.tags ?? []).map((targetSlug, index) => ({
        id: `follow:topic:${index}:${targetSlug}`,
        userId,
        kind: 'topic' as const,
        targetSlug,
        createdAt: preferences?.updatedAt ?? new Date(0).toISOString(),
      })),
      ...(preferences?.authors ?? []).map((targetSlug, index) => ({
        id: `follow:author:${index}:${targetSlug}`,
        userId,
        kind: 'author' as const,
        targetSlug,
        createdAt: preferences?.updatedAt ?? new Date(0).toISOString(),
      })),
      ...(preferences?.provinces ?? []).map((targetSlug, index) => ({
        id: `follow:province:${index}:${targetSlug}`,
        userId,
        kind: 'province' as const,
        targetSlug,
        createdAt: preferences?.updatedAt ?? new Date(0).toISOString(),
      })),
    ],
    history: history.map((item): ReadingHistory => ({
      id: `history:${item.articleId}`,
      userId,
      articleId: item.articleId,
      categorySlug: item.categorySlug,
      tagSlugs: item.tagSlugs,
      authorSlugs: item.authorSlugs,
      readAt: item.readAt,
      scrollDepth: item.scrollDepth,
      readingSeconds: item.dwellSeconds,
      completed: item.completed,
    })),
  }
}

export type RecommendForReaderOptions = {
  limit?: number
  preferences?: ReaderPreferences | null
  /** Consented reader×article matrix; CF activates only above volume floor. */
  interactions?: Record<string, Record<string, number>>
  readerId?: string
}

/**
 * Prefer the hybrid recommender, then lightly boost with exact k-NN over
 * story term vectors when the reader has affinity signal. Collaborative
 * co-read stays volume-gated inside `recommend` (needs multi-reader matrix).
 */
export function recommendForReader(
  catalog: StoryCardData[],
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  limitOrOptions: number | RecommendForReaderOptions = 6,
  preferencesArg?: ReaderPreferences | null,
): PersonalizedStory[] {
  const options: RecommendForReaderOptions =
    typeof limitOrOptions === 'number'
      ? { limit: limitOrOptions, preferences: preferencesArg }
      : limitOrOptions
  const limit = options.limit ?? 6
  const preferences = options.preferences ?? preferencesArg ?? null
  const profile = {
    ...toProfile(bookmarks, history, preferences),
    userId: options.readerId ?? 'browser-reader',
  }
  const interactions = options.interactions
  const readerCount = interactions ? Object.keys(interactions).length : 0
  const base = recommend(catalog, profile, {
    limit: Math.max(limit, 12),
    maxPerCategory: 2,
    maxPerAuthor: 2,
    maxPerSource: 2,
    fatigueWindowHours: 48,
    collaborative:
      interactions && readerCount > 0 ? { enabled: true, interactions, minReaders: 25 } : undefined,
  })

  const affinity = buildAffinity(bookmarks, history, catalog, preferences)
  const interest = new Map<string, number>()
  for (const [key, value] of affinity.categories) interest.set(`cat:${key}`, value)
  for (const [key, value] of affinity.topics) interest.set(`tag:${key}`, value)
  for (const [key, value] of affinity.authors) interest.set(`author:${key}`, value)

  if (interest.size === 0) return base.slice(0, limit)

  const knn = knnRecommend(
    interest,
    catalog.map((story) => ({ id: story.id, vector: storyTerms(story), value: story })),
    Math.max(limit * 2, 12),
  )
  const knnBoost = new Map(knn.map((item) => [item.id, item.similarity]))

  // Follow signals ride on top of the hybrid score rather than replacing it:
  // `recommend` already decides what is a sensible candidate, these decide
  // which of those this particular reader keeps coming back for. Scaled by
  // how deeply they actually read, so a history of bounces moves little.
  const depthQuality = scrollDepthQuality(history)
  const propensity = returnVisitPropensity(history)

  return [...base]
    .map((item) => {
      const boost = knnBoost.get(item.id) ?? 0
      const topic = topicFollowScore(affinity, item)
      const author = authorFollowScore(affinity, item)
      const follow = Math.max(topic, author)
      const reengage = follow > 0 ? reengagementWeight(propensity, follow) : 0
      const uplift =
        boost * 0.35 +
        (topic * 0.22 + author * 0.18) * depthQuality +
        reengage * 0.12 * depthQuality
      if (uplift <= 0) return item
      return { ...item, recScore: item.recScore + uplift }
    })
    .sort((a, b) => b.recScore - a.recScore)
    .slice(0, limit)
}

/**
 * Best unfinished read, not merely the most recent one.
 *
 * `continueReading` from @nagarikwatch/db returns the latest incomplete
 * article; `rankContinueReading` weighs how much was read, how recently, and
 * how often the reader came back. The db pick stays as the fallback so a
 * history the ranker rejects (everything bounced, or nothing left in the
 * catalog) still resolves the way it always did.
 */
export function continueReadingForReader(
  catalog: StoryCardData[],
  history: ReadingHistoryRecord[],
  now = new Date(),
): StoryCardData | null {
  const best = rankContinueReading(catalog, history, now)[0]
  if (best) return best.story
  const articleId = continueReading(toProfile([], history))
  return articleId ? (catalog.find((story) => story.id === articleId) ?? null) : null
}
