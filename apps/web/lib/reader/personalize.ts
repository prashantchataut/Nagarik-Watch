import type { StoryCardData } from '@nagarikwatch/db'
import type { BookmarkRecord, ReadingHistoryRecord } from './state'
import { rankStories, type RankingSignals } from '../ranking'

export type ReaderAffinity = {
  categories: Map<string, number>
  authors: Map<string, number>
}

export function buildAffinity(
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  catalog: StoryCardData[],
): ReaderAffinity {
  const categories = new Map<string, number>()
  const authors = new Map<string, number>()
  const catalogById = new Map(catalog.map((story) => [story.id, story]))

  const bumpStory = (story: StoryCardData | undefined, weight: number) => {
    if (!story) return
    categories.set(story.category.slug, (categories.get(story.category.slug) ?? 0) + weight)
    for (const author of story.authors) {
      authors.set(author.slug, (authors.get(author.slug) ?? 0) + weight)
    }
  }

  for (const bookmark of bookmarks) bumpStory(bookmark.story, 3.5)
  for (const record of history) {
    const completionWeight = Math.min(1.25, record.scrollDepth / 100)
    const dwellWeight = Math.min(1.25, record.dwellSeconds / 180)
    const completionBonus = record.completed ? 1 : 0
    bumpStory(
      catalogById.get(record.articleId),
      1 + completionWeight + dwellWeight + completionBonus,
    )
  }

  return { categories, authors }
}

export function personalizedSignals(
  story: StoryCardData,
  affinity: ReaderAffinity,
  history: ReadingHistoryRecord[],
  index: number,
): RankingSignals {
  const categoryAffinity = affinity.categories.get(story.category.slug) ?? 0
  const authorAffinity = story.authors.reduce(
    (sum, author) => sum + (affinity.authors.get(author.slug) ?? 0),
    0,
  )
  const read = history.find((record) => record.articleId === story.id)
  const readingCompletion = read ? Math.min(1, read.scrollDepth / 100) : 0
  const dwellTimeSeconds = read?.dwellSeconds ?? 0
  const fatiguePenalty = read?.completed ? 1 : read ? 0.45 : 0
  const preference = Math.min(1, (categoryAffinity * 0.65 + authorAffinity * 0.35) / 6)

  return {
    editorialPriority: story.isBreaking ? 4 : Math.max(0, 2 - index / 10),
    viewsPerHour: Math.max(1, 44 - index * 2),
    bookmarkVelocity: categoryAffinity,
    readingCompletion,
    dwellTimeSeconds,
    topicSimilarity: Math.min(1, categoryAffinity / 5),
    categorySimilarity: categoryAffinity > 0 ? Math.min(1, categoryAffinity / 4) : 0,
    authorAffinity: Math.min(1, authorAffinity / 4),
    userPreference: preference,
    fatiguePenalty,
    diversityBoost: index % 3 === 0 ? 0.2 : 0,
    qualityTrustScore: 0.86,
  }
}

export function recommendForReader(
  catalog: StoryCardData[],
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  limit = 6,
): StoryCardData[] {
  const affinity = buildAffinity(bookmarks, history, catalog)
  const ranked = rankStories(catalog, (story, index) =>
    personalizedSignals(story, affinity, history, index),
  ).map(({ rankScore: _rankScore, rankSignals: _rankSignals, ...story }) => story)

  const categoryCounts = new Map<string, number>()
  const diverse: StoryCardData[] = []

  for (const story of ranked) {
    const count = categoryCounts.get(story.category.slug) ?? 0
    if (count >= 2) continue
    categoryCounts.set(story.category.slug, count + 1)
    diverse.push(story)
    if (diverse.length >= limit) break
  }

  return diverse
}
