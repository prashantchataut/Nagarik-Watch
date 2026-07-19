import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import { civicWeightFor, digestScore, noveltyOf, rankDigestStories } from './digest'
import type { ReaderAffinity } from './personalize'

function story(
  id: string,
  categorySlug: string,
  publishedAt: string,
  overrides: Partial<StoryCardData> = {},
): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: categorySlug, slug: categorySlug, nameNe: categorySlug, nameEn: categorySlug },
    categoryLabel: categorySlug,
    titleNe: `शीर्षक ${id}`,
    titleEn: `Story ${id}`,
    byline: 'नागरिक वाच',
    authors: [{ id: 'a1', name: 'a1', slug: 'a1' }],
    publishedAt,
    hasEnglish: true,
    isBreaking: false,
    ...overrides,
  }
}

describe('civicWeightFor', () => {
  it('weighs governance and public-health desks above lifestyle desks', () => {
    expect(civicWeightFor(story('p1', 'politics', '2026-07-18T00:00:00Z'))).toBeGreaterThan(
      civicWeightFor(story('s1', 'sports', '2026-07-18T00:00:00Z')),
    )
  })

  it('boosts breaking stories', () => {
    const base = civicWeightFor(story('s1', 'sports', '2026-07-18T00:00:00Z'))
    const breaking = civicWeightFor(story('s2', 'sports', '2026-07-18T00:00:00Z', { isBreaking: true }))
    expect(breaking).toBeGreaterThan(base)
  })
})

describe('noveltyOf', () => {
  it('decays to zero after the 3-day digest window', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    expect(noveltyOf(story('a', 'world', '2026-07-18T12:00:00Z'), now)).toBeCloseTo(1, 5)
    expect(noveltyOf(story('b', 'world', '2026-07-10T12:00:00Z'), now)).toBe(0)
  })
})

describe('digestScore', () => {
  it('rewards affinity matches', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const affinity: ReaderAffinity = {
      categories: new Map([['politics', 8]]),
      authors: new Map(),
      topics: new Map(),
    }
    const matched = digestScore(story('p1', 'politics', '2026-07-18T00:00:00Z'), affinity, now)
    const unmatched = digestScore(story('p2', 'politics', '2026-07-18T00:00:00Z'), null, now)
    expect(matched.score).toBeGreaterThan(unmatched.score)
  })
})

describe('rankDigestStories', () => {
  it('avoids two consecutive same-category picks when alternatives exist', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const stories = [
      story('p1', 'politics', '2026-07-18T00:00:00Z'),
      story('p2', 'politics', '2026-07-17T00:00:00Z'),
      story('p3', 'politics', '2026-07-16T00:00:00Z'),
      story('w1', 'world', '2026-07-18T00:00:00Z'),
    ]
    const ranked = rankDigestStories(stories, null, { now, limit: 4 })
    const categories = ranked.map((item) => item.category.slug)
    expect(categories.slice(0, 2).sort()).toEqual(['politics', 'world'])
  })

  it('respects the limit', () => {
    const now = new Date('2026-07-18T12:00:00Z')
    const stories = Array.from({ length: 10 }, (_, i) =>
      story(`s${i}`, i % 2 ? 'sports' : 'politics', '2026-07-18T00:00:00Z'),
    )
    expect(rankDigestStories(stories, null, { now, limit: 3 })).toHaveLength(3)
  })
})
