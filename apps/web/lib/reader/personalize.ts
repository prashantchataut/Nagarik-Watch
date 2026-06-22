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

  for (const bookmark of bookmarks) bumpStory(bookmark.story, 3)
  for (const record of history) {
    const weight = 1 + Math.min(1, record.scrollDepth / 100) + (record.completed ? 1 : 0)
    bumpStory(catalogById.get(record.articleId), weight)
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
  return {
    editorialPriority: story.isBreaking ? 3 : Math.max(0, 2 - index / 8),
    viewsPerHour: Math.max(1, 40 - index * 2),
    bookmarkVelocity: categoryAffinity,
    readingCompletion: read?.completed ? 1 : 0,
    topicSimilarity: Math.min(1, categoryAffinity / 5),
    authorAffinity: Math.min(1, authorAffinity / 4),
    fatiguePenalty: read ? 0.8 : 0,
    diversityBoost: index % 3 === 0 ? 0.2 : 0,
    qualityTrustScore: 0.8,
  }
}

export function recommendForReader(
  catalog: StoryCardData[],
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
  limit = 6,
): StoryCardData[] {
  const affinity = buildAffinity(bookmarks, history, catalog)
  return rankStories(catalog, (story, index) =>
    personalizedSignals(story, affinity, history, index),
  )
    .slice(0, limit)
    .map(({ rankScore: _rankScore, rankSignals: _rankSignals, ...story }) => story)
}
