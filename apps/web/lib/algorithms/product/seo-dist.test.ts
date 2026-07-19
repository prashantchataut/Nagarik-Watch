import { describe, expect, it } from 'vitest'
import { newsSitemapPriority, ogImageDimensionOk, ogImageDimensionScore } from './seo-dist'

describe('newsSitemapPriority', () => {
  it('gives a fresh breaking story the highest priority', () => {
    expect(newsSitemapPriority(0, true, 1)).toBeCloseTo(1)
  })

  it('decays priority as a story ages', () => {
    const fresh = newsSitemapPriority(1, false, 0.8)
    const stale = newsSitemapPriority(40, false, 0.8)
    expect(stale).toBeLessThan(fresh)
  })

  it('never goes below zero for very old stories', () => {
    expect(newsSitemapPriority(500, false, 0)).toBeGreaterThanOrEqual(0)
  })
})

describe('ogImageDimensionOk / ogImageDimensionScore', () => {
  it('passes the recommended 1200x630 minimum', () => {
    expect(ogImageDimensionOk(1200, 630)).toBe(true)
    expect(ogImageDimensionScore(1200, 630)).toBe(1)
  })

  it('fails and partially scores an undersized image', () => {
    expect(ogImageDimensionOk(600, 315)).toBe(false)
    expect(ogImageDimensionScore(600, 315)).toBeCloseTo(0.25)
  })

  it('scores zero for a non-positive dimension', () => {
    expect(ogImageDimensionScore(0, 630)).toBe(0)
  })
})
