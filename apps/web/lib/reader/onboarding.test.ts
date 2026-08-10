import { describe, expect, it } from 'vitest'
import type { Category, StoryCardData } from '@nagarikwatch/db'
import { onboardingCoverage, scoreOnboardingTopics } from './onboarding'

function category(slug: string, navOrder: number): Category {
  return { id: slug, slug, nameNe: slug, nameEn: slug, navOrder, showInNav: true }
}

function story(id: string, categorySlug: string): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: categorySlug, slug: categorySlug, nameNe: categorySlug, nameEn: categorySlug },
    categoryLabel: categorySlug,
    titleNe: id,
    byline: 'नागरिक वाच',
    authors: [],
    publishedAt: '2026-07-18T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
  }
}

describe('scoreOnboardingTopics', () => {
  it('ranks categories with real recent volume above empty desks', () => {
    const categories = [category('politics', 1), category('sports', 2), category('diaspora', 3)]
    const catalog = [
      story('p1', 'politics'),
      story('p2', 'politics'),
      story('p3', 'politics'),
      story('s1', 'sports'),
    ]
    const scored = scoreOnboardingTopics(categories, catalog)
    expect(scored[0]!.slug).toBe('politics')
    expect(scored.find((item) => item.slug === 'diaspora')!.storyCount).toBe(0)
  })

  it('marks the top few as recommended', () => {
    const categories = [
      category('politics', 1),
      category('sports', 2),
      category('world', 3),
      category('opinion', 4),
    ]
    const scored = scoreOnboardingTopics(categories, [story('p1', 'politics')])
    expect(scored.filter((item) => item.recommended)).toHaveLength(4 > 3 ? 3 : categories.length)
  })

  it('respects the limit', () => {
    const categories = Array.from({ length: 10 }, (_, i) => category(`cat-${i}`, i))
    expect(scoreOnboardingTopics(categories, [], 5)).toHaveLength(5)
  })
})

describe('onboardingCoverage', () => {
  it('is zero with no available topics', () => {
    expect(onboardingCoverage(['politics'], [])).toBe(0)
  })

  it('computes the selected fraction of available topics', () => {
    expect(
      onboardingCoverage(['politics', 'sports'], ['politics', 'sports', 'world', 'business']),
    ).toBe(0.5)
  })

  it('ignores selections outside the available set', () => {
    expect(onboardingCoverage(['politics', 'unknown'], ['politics', 'sports'])).toBe(0.5)
  })
})
