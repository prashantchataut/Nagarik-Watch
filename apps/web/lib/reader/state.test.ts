import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import {
  safeParseArray,
  setBookmark,
  toggleBookmark,
  upsertHistory,
  recentUnfinished,
} from './state'

const story: StoryCardData = {
  id: 'a1',
  slug: 'city-budget',
  category: { id: 'c1', slug: 'news', nameNe: 'समाचार', nameEn: 'News' },
  categoryLabel: 'समाचार',
  titleNe: 'शहरको बजेट सार्वजनिक',
  titleEn: 'City budget released',
  byline: 'नागरिक वाच',
  authors: [{ id: 'u1', name: 'रीमा श्रेष्ठ', slug: 'reema-shrestha' }],
  publishedAt: '2026-06-22T00:00:00Z',
  hasEnglish: true,
  isBreaking: false,
}

describe('reader state helpers', () => {
  it('parses only array-shaped JSON', () => {
    expect(safeParseArray<string>('["a"]')).toEqual(['a'])
    expect(safeParseArray<string>('{"a":1}')).toEqual([])
    expect(safeParseArray<string>('not-json')).toEqual([])
  })

  it('sets and toggles bookmark records deterministically', () => {
    const saved = setBookmark([], story, true, new Date('2026-06-22T00:00:00Z'))
    expect(saved).toHaveLength(1)
    expect(setBookmark(saved, story, true)).toHaveLength(1)
    expect(setBookmark(saved, story, false)).toHaveLength(0)
    expect(toggleBookmark(saved, story)).toHaveLength(0)
  })

  it('merges reading history and preserves completion', () => {
    const first = upsertHistory([], {
      articleId: 'a1',
      slug: 'city-budget',
      categorySlug: 'news',
      title: 'City budget released',
      href: '/news/city-budget',
      readAt: '2026-06-22T00:00:00Z',
      scrollDepth: 40,
      completed: false,
      readingMinutes: 3,
      dwellSeconds: 20,
    })
    const second = upsertHistory(first, {
      articleId: 'a1',
      slug: 'city-budget',
      categorySlug: 'news',
      title: 'City budget released',
      href: '/news/city-budget',
      readAt: '2026-06-22T00:03:00Z',
      scrollDepth: 95,
      completed: true,
      readingMinutes: 3,
      dwellSeconds: 60,
    })

    expect(second[0]?.sessions).toBe(2)
    expect(second[0]?.scrollDepth).toBe(95)
    expect(second[0]?.completed).toBe(true)
    expect(recentUnfinished(second)).toBeNull()
  })

  it('does not shrink same-session dwell on a shorter remount sample', () => {
    const first = upsertHistory([], {
      articleId: 'a1',
      slug: 'city-budget',
      categorySlug: 'news',
      title: 'City budget released',
      href: '/news/city-budget',
      readAt: '2026-06-22T00:00:00Z',
      scrollDepth: 40,
      completed: false,
      readingMinutes: 3,
      dwellSeconds: 90,
      sessionId: 'sess-1',
    })
    const remount = upsertHistory(first, {
      articleId: 'a1',
      slug: 'city-budget',
      categorySlug: 'news',
      title: 'City budget released',
      href: '/news/city-budget',
      readAt: '2026-06-22T00:01:00Z',
      scrollDepth: 42,
      completed: false,
      readingMinutes: 3,
      dwellSeconds: 1,
      sessionId: 'sess-1',
    })

    expect(remount[0]?.sessions).toBe(1)
    expect(remount[0]?.dwellSeconds).toBe(90)
    expect(remount[0]?.lastSessionSeconds).toBe(90)
  })
})
