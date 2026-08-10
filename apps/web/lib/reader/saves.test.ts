import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import {
  bookmarkStaleness,
  isStaleBookmark,
  rankSavedForLater,
  savedEmptyState,
  staleSavesCount,
} from './saves'
import type { BookmarkRecord } from './state'

function story(id: string, readingMinutes?: number): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: 'news', slug: 'news', nameNe: 'news', nameEn: 'news' },
    categoryLabel: 'news',
    titleNe: id,
    byline: 'नागरिक वाच',
    authors: [],
    publishedAt: '2026-07-18T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes,
  }
}

function bookmark(id: string, savedAt: string, readingMinutes?: number): BookmarkRecord {
  return { articleId: id, savedAt, story: story(id, readingMinutes) }
}

describe('bookmarkStaleness / isStaleBookmark', () => {
  it('is 0 for a bookmark saved just now and 1 once past the stale window', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    expect(bookmarkStaleness(bookmark('a', '2026-07-18T12:00:00Z'), now)).toBe(0)
    expect(bookmarkStaleness(bookmark('b', '2026-05-01T12:00:00Z'), now)).toBe(1)
    expect(isStaleBookmark(bookmark('b', '2026-05-01T12:00:00Z'), now)).toBe(true)
    expect(isStaleBookmark(bookmark('a', '2026-07-18T12:00:00Z'), now)).toBe(false)
  })
})

describe('rankSavedForLater', () => {
  it('ranks a fresh short read above a stale long read', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const shortFresh = bookmark('short', '2026-07-18T00:00:00Z', 3)
    const longStale = bookmark('long', '2026-05-01T00:00:00Z', 25)
    const ranked = rankSavedForLater([longStale, shortFresh], now)
    expect(ranked[0]!.bookmark.articleId).toBe('short')
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score)
  })
})

describe('savedEmptyState', () => {
  it('reports empty when there are no saves', () => {
    expect(savedEmptyState([])).toBe('empty')
  })

  it('reports all-stale only when every save is past the threshold', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    expect(savedEmptyState([bookmark('a', '2026-05-01T00:00:00Z')], now)).toBe('all-stale')
    expect(
      savedEmptyState(
        [bookmark('a', '2026-05-01T00:00:00Z'), bookmark('b', '2026-07-18T00:00:00Z')],
        now,
      ),
    ).toBe('has-fresh')
  })
})

describe('staleSavesCount', () => {
  it('counts only bookmarks past the stale threshold', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const bookmarks = [bookmark('a', '2026-05-01T00:00:00Z'), bookmark('b', '2026-07-18T00:00:00Z')]
    expect(staleSavesCount(bookmarks, now)).toBe(1)
  })
})
