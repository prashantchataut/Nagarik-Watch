import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import { rankStories, viralityScore, weightedScore } from './ranking'

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
    expect(viralityScore({ shareVelocity: 8, commentVelocity: 2 }))
      .toBeGreaterThan(viralityScore({ shareVelocity: 2, commentVelocity: 2 }))
    expect(viralityScore({ shareVelocity: 100, commentVelocity: 100 })).toBeLessThan(1)
  })
})
