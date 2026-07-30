import { describe, expect, it } from 'vitest'
import { houseAdExperimentId } from '@/lib/house-ads'
import { revisionSimilarity } from '@/lib/journalist/desk-scoring'
import { PROVINCES } from '@/lib/site'

describe('recommendation follow-ups', () => {
  it('keeps house-ad experiment ids stable for promote matching', () => {
    expect(houseAdExperimentId('home-top')).toBe('house-ad-home-top')
    expect(houseAdExperimentId('article-inline')).toBe('house-ad-article-inline')
  })

  it('scores revision overlap for compare UI', () => {
    expect(revisionSimilarity('काठमाडौं मा बैठक', 'काठमाडौं मा बैठक')).toBe(1)
    expect(revisionSimilarity('पहिलो पाठ', 'दोस्रो बिल्कुल फरक')).toBeLessThan(0.5)
  })

  it('province heat rows align with site province slugs', () => {
    expect(PROVINCES.length).toBe(7)
    expect(new Set(PROVINCES.map((p) => p.slug)).size).toBe(7)
  })
})
