import {
  continueReading,
  recommend,
  type Bookmark,
  type ReaderProfile,
  type ReadingHistory,
  type ScoredRecommendation,
  type StoryCardData,
} from '@nagarikwatch/db'
import type { BookmarkRecord, ReadingHistoryRecord } from './state'
import type { ReaderPreferences } from './preferences-store'

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
    story.tags?.forEach((tag) => bump(topics, typeof tag === 'string' ? tag : tag.slug, 3))
  }
  for (const item of history) {
    const story = byId.get(item.articleId)
    const completionWeight = item.completed ? 2.5 : Math.max(.5, item.scrollDepth / 100 * 2)
    bump(categories, story?.category.slug ?? item.categorySlug, completionWeight)
    if (story) story.authors.forEach((author) => bump(authors, author.slug, completionWeight))
    else item.authorSlugs?.forEach((slug) => bump(authors, slug, completionWeight))
    if (story) story.tags?.forEach((tag) => bump(topics, typeof tag === 'string' ? tag : tag.slug, completionWeight))
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
    bookmarks: bookmarks.map(
      (item): Bookmark => ({
        id: `bookmark:${item.articleId}`,
        userId,
        articleId: item.articleId,
        categorySlug: item.categorySlug,
        tagSlugs: item.tagSlugs,
        authorSlugs: item.authorSlugs,
        createdAt: item.savedAt,
      }),
    ),
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
    history: history.map(
      (item): ReadingHistory => ({
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
      }),
    ),
  }
}

export function recommendForReader(
  catalog: StoryCardData[],
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  limit = 6,
  preferences?: ReaderPreferences | null,
): PersonalizedStory[] {
  return recommend(catalog, toProfile(bookmarks, history, preferences), {
    limit,
    maxPerCategory: 2,
    maxPerAuthor: 2,
    maxPerSource: 2,
    fatigueWindowHours: 48,
  })
}

export function continueReadingForReader(
  catalog: StoryCardData[],
  history: ReadingHistoryRecord[],
): StoryCardData | null {
  const articleId = continueReading(toProfile([], history))
  return articleId ? (catalog.find((story) => story.id === articleId) ?? null) : null
}
