import { describe, expect, it } from 'vitest'
import { detectTrending, velocityPerMinute, type EngagementSample } from './trending'
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

describe('trending dwell weighting', () => {
  it('boosts velocity when samples carry measured dwellSeconds', () => {
    const now = new Date('2026-07-29T12:00:00Z')
    const base: EngagementSample[] = [
      {
        articleId: 'a',
        at: '2026-07-29T11:50:00Z',
        views: 2,
        shares: 0,
        comments: 0,
        dwellSeconds: 0,
      },
    ]
    const withDwell: EngagementSample[] = [
      {
        articleId: 'a',
        at: '2026-07-29T11:50:00Z',
        views: 2,
        shares: 0,
        comments: 0,
        dwellSeconds: 120,
      },
    ]

    expect(velocityPerMinute(withDwell, 'a', 15, now)).toBeGreaterThan(
      velocityPerMinute(base, 'a', 15, now),
    )

    const ranked = detectTrending([story('a', 'a'), story('b', 'b')], withDwell, { now })
    expect(ranked[0]?.slug).toBe('a')
    expect(ranked[0]?.trendingScore ?? 0).toBeGreaterThan(0)
  })
})
