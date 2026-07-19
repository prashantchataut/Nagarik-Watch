import { describe, expect, it } from 'vitest'
import { paywallReason, shouldShowPaywall } from './decision'

describe('shouldShowPaywall', () => {
  it('never gates members', () => {
    expect(shouldShowPaywall({ isMember: true, freeRemaining: 0, articlePremium: true })).toBe(false)
  })

  it('gates premium articles for non-members regardless of the meter', () => {
    expect(shouldShowPaywall({ isMember: false, freeRemaining: 4, articlePremium: true })).toBe(true)
  })

  it('lets non-premium articles through while free reads remain', () => {
    expect(shouldShowPaywall({ isMember: false, freeRemaining: 1, articlePremium: false })).toBe(false)
  })

  it('gates non-premium articles once the free meter is exhausted', () => {
    expect(shouldShowPaywall({ isMember: false, freeRemaining: 0, articlePremium: false })).toBe(true)
    expect(shouldShowPaywall({ isMember: false, freeRemaining: -1, articlePremium: false })).toBe(true)
  })
})

describe('paywallReason', () => {
  it('reports none, premium-article, or meter-exhausted', () => {
    expect(paywallReason({ isMember: true, freeRemaining: 0, articlePremium: true })).toBe('none')
    expect(paywallReason({ isMember: false, freeRemaining: 4, articlePremium: true })).toBe('premium-article')
    expect(paywallReason({ isMember: false, freeRemaining: 0, articlePremium: false })).toBe('meter-exhausted')
  })
})
