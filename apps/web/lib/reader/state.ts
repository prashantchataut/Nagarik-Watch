import type { StoryCardData } from '@nagarikwatch/db'

export const READER_BOOKMARKS_KEY = 'nagarik-watch:bookmarks:v1'
export const READER_HISTORY_KEY = 'nagarik-watch:history:v1'

export type BookmarkRecord = {
  articleId: string
  savedAt: string
  story: StoryCardData
}

export type ReadingHistoryRecord = {
  articleId: string
  slug: string
  categorySlug: string
  title: string
  href: string
  readAt: string
  firstReadAt: string
  scrollDepth: number
  completed: boolean
  readingMinutes?: number
  sessions: number
  dwellSeconds: number
}

export function safeParseArray<T>(raw: string | null): T[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as T[]) : []
  } catch {
    return []
  }
}

export function toggleBookmark(
  records: BookmarkRecord[],
  story: StoryCardData,
  now = new Date(),
): BookmarkRecord[] {
  const existing = records.some((record) => record.articleId === story.id)
  if (existing) return records.filter((record) => record.articleId !== story.id)
  return [{ articleId: story.id, story, savedAt: now.toISOString() }, ...records].slice(0, 200)
}

export function upsertHistory(
  records: ReadingHistoryRecord[],
  next: Omit<ReadingHistoryRecord, 'firstReadAt' | 'sessions' | 'dwellSeconds'> & {
    dwellSeconds?: number
  },
): ReadingHistoryRecord[] {
  const existing = records.find((record) => record.articleId === next.articleId)
  const merged: ReadingHistoryRecord = {
    ...next,
    firstReadAt: existing?.firstReadAt ?? next.readAt,
    sessions: (existing?.sessions ?? 0) + 1,
    dwellSeconds: (existing?.dwellSeconds ?? 0) + (next.dwellSeconds ?? 0),
    scrollDepth: Math.max(existing?.scrollDepth ?? 0, next.scrollDepth),
    completed: Boolean(existing?.completed || next.completed),
  }

  return [merged, ...records.filter((record) => record.articleId !== next.articleId)].slice(0, 200)
}

export function recentUnfinished(records: ReadingHistoryRecord[]): ReadingHistoryRecord | null {
  return (
    [...records]
      .filter((record) => !record.completed && record.scrollDepth < 92)
      .sort((a, b) => b.readAt.localeCompare(a.readAt))[0] ?? null
  )
}
