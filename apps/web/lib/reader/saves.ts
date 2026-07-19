import type { BookmarkRecord } from './state'

const DAY_MS = 86_400_000
const DEFAULT_STALE_DAYS = 30
const DEFAULT_READING_MINUTES = 6

/**
 * Minimal shape ranking needs — satisfied by `BookmarkRecord` (nested
 * `story.readingMinutes`) and by lighter saved-list projections that carry a
 * flat `readingMinutes` instead of a full `StoryCardData`.
 */
export type SaveLike = { savedAt: string; readingMinutes?: number; story?: { readingMinutes?: number } }

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** Real age of a saved story in days, from its actual `savedAt` timestamp. */
export function bookmarkAgeDays(bookmark: Pick<SaveLike, 'savedAt'>, now = new Date()): number {
  const savedAt = Date.parse(bookmark.savedAt)
  if (!Number.isFinite(savedAt)) return 0
  return Math.max(0, (now.getTime() - savedAt) / DAY_MS)
}

/** 0..1 staleness — same shape as the `bookmark-expiry-ranker` heuristic (ageDays/30, clamped). */
export function bookmarkStaleness(bookmark: Pick<SaveLike, 'savedAt'>, now = new Date()): number {
  return clamp01(bookmarkAgeDays(bookmark, now) / DEFAULT_STALE_DAYS)
}

export function isStaleBookmark(
  bookmark: Pick<SaveLike, 'savedAt'>,
  now = new Date(),
  thresholdDays = DEFAULT_STALE_DAYS,
): boolean {
  return bookmarkAgeDays(bookmark, now) >= thresholdDays
}

export type SaveUrgency<T extends SaveLike> = {
  bookmark: T
  score: number
  ageDays: number
  stale: boolean
}

/**
 * Order saved stories by how worth reading-now they are: shorter reads and
 * fresher saves surface first, same weighting as the `save-later-ranking`
 * heuristic (readingMinutes/freshness), computed from the real bookmark.
 */
export function rankSavedForLater<T extends SaveLike>(bookmarks: T[], now = new Date()): SaveUrgency<T>[] {
  return bookmarks
    .map((bookmark) => {
      const ageDays = bookmarkAgeDays(bookmark, now)
      const staleness = clamp01(ageDays / DEFAULT_STALE_DAYS)
      const freshness = 1 - staleness
      const remainingMinutes = bookmark.readingMinutes ?? bookmark.story?.readingMinutes ?? DEFAULT_READING_MINUTES
      const score = clamp01((1 - Math.min(1, remainingMinutes / 20)) * 0.5 + freshness * 0.5)
      return { bookmark, score, ageDays, stale: ageDays >= DEFAULT_STALE_DAYS }
    })
    .sort((a, b) => b.score - a.score || b.bookmark.savedAt.localeCompare(a.bookmark.savedAt))
}

export type SavedEmptyState = 'empty' | 'all-stale' | 'has-fresh'

/** Which empty/attention state the saved page should show — never fabricated, derived from real saves. */
export function savedEmptyState<T extends SaveLike>(bookmarks: T[], now = new Date()): SavedEmptyState {
  if (bookmarks.length === 0) return 'empty'
  return bookmarks.every((bookmark) => isStaleBookmark(bookmark, now)) ? 'all-stale' : 'has-fresh'
}

export function staleSavesCount<T extends SaveLike>(bookmarks: T[], now = new Date()): number {
  return bookmarks.filter((bookmark) => isStaleBookmark(bookmark, now)).length
}

/** Re-exported for callers that specifically need the device bookmark shape. */
export type { BookmarkRecord }
