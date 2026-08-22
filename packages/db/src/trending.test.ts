import { describe, expect, it } from 'vitest'
import { burstRatio, detectTrending, velocityPerMinute, type EngagementSample } from './trending'
import type { StoryCardData } from './types'

const story = (id: string, slug: string): StoryCardData => ({
  id,
  slug,
  category: { id: 'c1', slug: 'news', nameNe: 'समाचार', nameEn: 'News' },
  categoryLabel: 'समाचार',
  titleNe: `शीर्षक ${slug}`,
  titleEn: `Title ${slug}`,
  byline: 'नागरिक वाच',
  authors: [{ id: 'u1', name: 'रीमा', slug: 'reema' }],
  publishedAt: '2026-07-29T10:00:00Z',
  hasEnglish: true,
  isBreaking: false,
})

const sample = (
  articleId: string,
  at: string,
  values: Partial<Omit<EngagementSample, 'articleId' | 'at'>> = {},
): EngagementSample => ({
  articleId,
  at,
  views: 0,
  shares: 0,
  comments: 0,
  ...values,
})

describe('trending detector', () => {
  it('boosts velocity when samples carry measured dwellSeconds', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const base = [sample('a', '2026-07-29T11:50:00Z', { views: 2, dwellSeconds: 0 })]
    const withDwell = [sample('a', '2026-07-29T11:50:00Z', { views: 2, dwellSeconds: 120 })]

    expect(velocityPerMinute(withDwell, 'a', 15, now)).toBeGreaterThan(
      velocityPerMinute(base, 'a', 15, now),
    )

    const ranked = detectTrending([story('a', 'a'), story('b', 'b')], withDwell, { now })
    expect(ranked[0]?.slug).toBe('a')
    expect(ranked[0]?.trendingScore ?? 0).toBeGreaterThan(0)
  })

  it('compares the current window against the preceding baseline without overlap', () => {
    const ratio = burstRatio(30, 21, 105, 15, 2)
    // 30 / 15 = 2 engagement/minute; 21 / 105 = 0.2/minute.
    expect(ratio).toBe(10)
  })

  it('honors custom short-window duration in burst scoring', () => {
    expect(burstRatio(20, 20, 100, 20, 2)).toBe(5)
    expect(burstRatio(20, 20, 100, 10, 2)).toBe(10)
  })

  it('ignores future-dated telemetry instead of inflating velocity', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const samples = [
      sample('a', '2026-07-29T11:55:00Z', { views: 2 }),
      sample('a', '2026-07-29T12:05:00Z', { views: 1000 }),
    ]

    expect(velocityPerMinute(samples, 'a', 15, now)).toBeCloseTo(2 / 15)
  })

  it('does not let negative or non-finite counters reduce another signal', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const samples = [
      sample('a', '2026-07-29T11:55:00Z', {
        views: -100,
        shares: Number.NaN,
        comments: 1,
        bookmarks: -2,
        dwellSeconds: -30,
      }),
    ]

    expect(velocityPerMinute(samples, 'a', 15, now)).toBeCloseTo(3 / 15)
  })

  it('uses preceding activity as baseline for a real burst', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const samples = [
      sample('a', '2026-07-29T11:55:00Z', { views: 30 }),
      sample('a', '2026-07-29T10:30:00Z', { views: 21 }),
    ]

    const [ranked] = detectTrending([story('a', 'a')], samples, {
      now,
      shortWindowMinutes: 15,
      baselineWindowMinutes: 120,
      minBaseline: 2,
    })

    expect(ranked?.baseline).toBe(21)
    expect(ranked?.burstRatio).toBe(10)
  })
})
