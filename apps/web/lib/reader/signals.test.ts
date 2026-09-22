import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import type { ReadingHistoryRecord } from './state'
import {
  authorFollowScore,
  localePreference,
  rankContinueReading,
  reengagementWeight,
  returnVisitPropensity,
  scrollDepthQuality,
  topicFollowScore,
} from './signals'

const NOW = new Date('2026-06-22T12:00:00Z')

function story(id: string, overrides: Partial<StoryCardData> = {}): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: 'politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: `शीर्षक ${id}`,
    byline: 'नागरिक वाच',
    authors: [{ id: 'a1', name: 'रीमा श्रेष्ठ', slug: 'reema-shrestha' }],
    publishedAt: '2026-06-20T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    tags: [{ id: 't1', slug: 'budget', nameNe: 'बजेट' }],
    ...overrides,
  } as StoryCardData
}

function read(
  articleId: string,
  overrides: Partial<ReadingHistoryRecord> = {},
): ReadingHistoryRecord {
  return {
    articleId,
    slug: articleId,
    categorySlug: 'politics',
    title: `शीर्षक ${articleId}`,
    href: `/ne/politics/${articleId}`,
    readAt: '2026-06-22T10:00:00Z',
    firstReadAt: '2026-06-22T10:00:00Z',
    scrollDepth: 50,
    completed: false,
    sessions: 1,
    dwellSeconds: 60,
    ...overrides,
  }
}

describe('rankContinueReading', () => {
  it('prefers a deep abandoned read over a newer shallow one', () => {
    const catalog = [story('deep'), story('skim')]
    const ranked = rankContinueReading(
      catalog,
      [
        read('skim', { scrollDepth: 14, readAt: '2026-06-22T11:50:00Z', dwellSeconds: 8 }),
        read('deep', { scrollDepth: 80, readAt: '2026-06-22T10:00:00Z', dwellSeconds: 300 }),
      ],
      NOW,
    )
    expect(ranked[0]?.story.id).toBe('deep')
  })

  it('ignores completed reads, bounces, and stories already at the footer', () => {
    const catalog = [story('done'), story('bounce'), story('almost')]
    const ranked = rankContinueReading(
      catalog,
      [
        read('done', { completed: true, scrollDepth: 100 }),
        read('bounce', { scrollDepth: 4 }),
        read('almost', { scrollDepth: 96 }),
      ],
      NOW,
    )
    expect(ranked).toEqual([])
  })

  it('drops history whose story has left the catalog rather than guessing', () => {
    expect(rankContinueReading([], [read('gone')], NOW)).toEqual([])
  })

  it('rewards a reader who has come back to the same story repeatedly', () => {
    const catalog = [story('once'), story('again')]
    const ranked = rankContinueReading(
      catalog,
      [read('once', { sessions: 1 }), read('again', { sessions: 4 })],
      NOW,
    )
    expect(ranked[0]?.story.id).toBe('again')
  })
})

describe('reader behaviour scorers', () => {
  it('scores scroll-depth quality between a bouncer and a finisher', () => {
    expect(scrollDepthQuality([])).toBe(0)
    const bouncer = scrollDepthQuality([
      read('a', { scrollDepth: 8 }),
      read('b', { scrollDepth: 5 }),
    ])
    const finisher = scrollDepthQuality([
      read('a', { completed: true, scrollDepth: 100 }),
      read('b', { completed: true, scrollDepth: 100 }),
    ])
    expect(bouncer).toBeLessThan(0.2)
    expect(finisher).toBe(1)
  })

  it('reports no locale opinion below a usable sample', () => {
    const catalog = [story('a', { hasEnglish: true }), story('b')]
    expect(localePreference(catalog, [read('a')])).toBeNull()
    const preference = localePreference(catalog, [read('a'), read('a'), read('a'), read('b')])
    expect(preference).toEqual({ english: 0.75, sample: 4 })
  })

  it('normalizes follow affinity against the reader’s own peak', () => {
    const affinity = {
      topics: new Map([
        ['budget', 9],
        ['sports', 3],
      ]),
      authors: new Map([['reema-shrestha', 9]]),
    }
    expect(topicFollowScore(affinity, story('a'))).toBe(1)
    expect(
      topicFollowScore(
        affinity,
        story('b', { tags: [{ id: 't2', slug: 'sports', nameNe: 'खेल' }] }),
      ),
    ).toBeCloseTo(1 / 3, 5)
    expect(authorFollowScore(affinity, story('a'))).toBe(1)
    expect(
      authorFollowScore(affinity, story('c', { authors: [{ id: 'x', name: 'X', slug: 'x' }] })),
    ).toBe(0)
  })

  it('rates a daily reader as more likely to return than a one-off visitor', () => {
    const daily = returnVisitPropensity(
      ['18', '19', '20', '21', '22'].map((day) =>
        read(`d${day}`, { readAt: `2026-06-${day}T09:00:00Z` }),
      ),
      NOW,
    )
    const once = returnVisitPropensity([read('a', { readAt: '2026-06-10T09:00:00Z' })], NOW)
    expect(daily).toBeGreaterThan(once)
    expect(returnVisitPropensity([], NOW)).toBe(0)
  })

  it('pushes hardest at a drifting reader with strong affinity, not a daily one', () => {
    expect(reengagementWeight(0.1, 1)).toBeGreaterThan(reengagementWeight(0.9, 1))
    expect(reengagementWeight(1, 0)).toBe(0)
  })
})
