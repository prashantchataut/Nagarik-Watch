import {
  continueReading,
  recommend,
  type Bookmark,
  type ReaderProfile,
  type ReadingHistory,
  type StoryCardData,
} from '@nagarikwatch/db'
import type { BookmarkRecord, ReadingHistoryRecord } from './state'

function toProfile(
  bookmarks: BookmarkRecord[],
  history: ReadingHistoryRecord[],
): ReaderProfile {
  const userId = 'browser-reader'
  return {
    bookmarks: bookmarks.map(
      (item): Bookmark => ({
        id: `bookmark:${item.articleId}`,
        userId,
        articleId: item.articleId,
        createdAt: item.savedAt,
      }),
    ),
    history: history.map(
      (item): ReadingHistory => ({
        id: `history:${item.articleId}`,
        userId,
        articleId: item.articleId,
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
): StoryCardData[] {
  return recommend(catalog, toProfile(bookmarks, history), {
    limit,
    maxPerCategory: 2,
  }).map(({ recScore: _score, recStrategy: _strategy, recVersion: _version, ...story }) => story)
}

export function continueReadingForReader(
  catalog: StoryCardData[],
  history: ReadingHistoryRecord[],
): StoryCardData | null {
  const articleId = continueReading(toProfile([], history))
  return articleId ? (catalog.find((story) => story.id === articleId) ?? null) : null
}
