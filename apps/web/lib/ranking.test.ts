import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import {
  banditExplorationScore,
  rankStories,
  relatedByContent,
  spaceOutCategories,
  viralityScore,
  weightedScore,
} from './ranking'

function story(id: string, publishedAt = '2026-06-22T00:00:00Z'): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: 'c', slug: 'news', nameNe: 'समाचार', nameEn: 'News' },
    categoryLabel: 'समाचार',
    titleNe: `शीर्षक ${id}`,
    titleEn: `Story ${id}`,
    byline: 'नागरिक वाच',
    authors: [{ id: 'a', name: 'रीमा श्रेष्ठ', slug: 'reema-shrestha' }],
    publishedAt,
    hasEnglish: true,
    isBreaking: false,
  }
}

describe('ranking', () => {
  it('excludes do-not-recommend stories', () => {
    const ranked = rankStories([story('a'), story('b')], (item) => ({
      doNotRecommend: item.id === 'a',
    }))
    expect(ranked.map((item) => item.id)).toEqual(['b'])
  })

  it('rewards bookmark velocity, completion, affinity, and trust', () => {
    const base = weightedScore(story('a'), {}, new Date('2026-06-22T01:00:00Z'))
    const personalized = weightedScore(
      story('a'),
      {
        bookmarkVelocity: 8,
        readingCompletion: 0.9,
        authorAffinity: 0.8,
        qualityTrustScore: 0.9,
      },
      new Date('2026-06-22T01:00:00Z'),
    )
    expect(personalized).toBeGreaterThan(base)
  })

  it('keeps sponsored items separated with a score penalty', () => {
    const organic = weightedScore(story('organic'), {}, new Date('2026-06-22T01:00:00Z'))
    const sponsored = weightedScore(
      story('sponsored'),
      { sponsored: true },
      new Date('2026-06-22T01:00:00Z'),
    )
    expect(sponsored).toBeLessThan(organic)
  })

  it('computes a bounded heuristic virality score from measured velocity', () => {
    expect(viralityScore({ shareVelocity: 0, commentVelocity: 0 })).toBe(0)
    expect(viralityScore({ shareVelocity: 8, commentVelocity: 2 })).toBeGreaterThan(
      viralityScore({ shareVelocity: 2, commentVelocity: 2 }),
    )
    expect(viralityScore({ shareVelocity: 100, commentVelocity: 100 })).toBeLessThan(1)
  })

  it('raises bandit exploration when impressions are thin relative to peers', () => {
    const cold = banditExplorationScore({ impressions: 2, clicks: 0, totalImpressions: 200 })
    const hot = banditExplorationScore({ impressions: 80, clicks: 8, totalImpressions: 200 })
    expect(cold).toBeGreaterThan(hot)
    expect(cold).toBeGreaterThan(0)
  })
})

describe('spaceOutCategories', () => {
  const slotted = (slugs: string[]) =>
    slugs.map((slug, index) => ({
      ...story(`s${index}`),
      category: { ...story('x').category, slug },
    }))

  const longestRun = (slugs: string[]) =>
    slugs.reduce(
      (state, slug) => {
        const current = slug === state.previous ? state.current + 1 : 1
        return { previous: slug, current, longest: Math.max(state.longest, current) }
      },
      { previous: '', current: 0, longest: 0 },
    ).longest

  it('breaks a long single-desk run without dropping anything', () => {
    const input = slotted(['politics', 'politics', 'politics', 'politics', 'economy', 'sports'])
    const out = spaceOutCategories(input, 2)
    expect(out).toHaveLength(input.length)
    expect(new Set(out.map((item) => item.id))).toEqual(new Set(input.map((item) => item.id)))
    expect(longestRun(out.map((item) => item.category.slug))).toBeLessThanOrEqual(2)
  })

  it('leaves an already-varied list in its original order', () => {
    const input = slotted(['politics', 'economy', 'politics', 'sports'])
    expect(spaceOutCategories(input, 2).map((item) => item.id)).toEqual(input.map((i) => i.id))
  })

  it('keeps a single-desk list intact when there is nothing to swap in', () => {
    const input = slotted(['politics', 'politics', 'politics'])
    expect(spaceOutCategories(input, 2).map((item) => item.id)).toEqual(input.map((i) => i.id))
  })
})

describe('relatedByContent', () => {
  function topical(
    id: string,
    titleNe: string,
    options: { tags?: string[]; category?: string } = {},
  ): StoryCardData {
    return {
      ...story(id),
      titleNe,
      titleEn: undefined,
      category: {
        id: options.category ?? 'news',
        slug: options.category ?? 'news',
        nameNe: 'समाचार',
        nameEn: 'News',
      },
      tags: options.tags?.map((slug) => ({ id: slug, slug, nameNe: slug })),
    }
  }

  it('matches across Nepali inflection', () => {
    const source = topical('source', 'बजेट अधिवेशन सुरु')
    const related = relatedByContent(source, [
      topical('a', 'बजेटमा पूर्वाधारको प्राथमिकता'),
      topical('b', 'मौसम पूर्वानुमान जारी'),
    ])
    expect(related[0]?.id).toBe('a')
  })

  it('weights a rare shared word above a ubiquitous one', () => {
    // नेपाल is in every candidate, so it carries almost no information;
    // भूकम्प is in exactly one.
    const source = topical('source', 'नेपाल भूकम्प क्षति')
    const pool = [
      topical('quake', 'भूकम्प पीडितलाई राहत'),
      topical('common-1', 'नेपाल भ्रमण वर्ष'),
      topical('common-2', 'नेपाल क्रिकेट टोली'),
      topical('common-3', 'नेपाल विद्युत प्राधिकरण'),
    ]
    const related = relatedByContent(source, pool)
    expect(related[0]?.id).toBe('quake')
  })

  it('uses newsroom topic tags, which the term overlap alone would miss', () => {
    const source = topical('source', 'संसद बैठक स्थगित', { tags: ['election-2084'] })
    const related = relatedByContent(source, [
      topical('tagged', 'मतदाता नामावली अद्यावधिक', { tags: ['election-2084'] }),
      topical('untagged', 'काठमाडौं सडक विस्तार'),
    ])
    expect(related[0]?.id).toBe('tagged')
  })

  it('never returns the source story', () => {
    const source = topical('source', 'बजेट अधिवेशन')
    const related = relatedByContent(source, [source, topical('a', 'बजेट बहस')])
    expect(related.map((item) => item.id)).not.toContain('source')
  })

  it('prefers the better-sourced story when topical similarity ties', () => {
    const source = topical('source', 'बजेट अधिवेशन सुरु')
    const weak = topical('weak', 'बजेट अधिवेशन जारी')
    const strong: StoryCardData = {
      ...topical('strong', 'बजेट अधिवेशन जारी'),
      exclusive: true,
      factCheckStatus: 'verified',
    }
    const related = relatedByContent(source, [weak, strong])
    expect(related[0]?.id).toBe('strong')
  })
})
