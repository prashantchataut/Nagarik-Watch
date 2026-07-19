import { describe, expect, it } from 'vitest'
import { loyaltyFromLifetimeReads } from './loyalty'

describe('loyaltyFromLifetimeReads', () => {
  it('starts at bronze and reports distance to silver', () => {
    expect(loyaltyFromLifetimeReads(12)).toEqual({
      tier: 'bronze',
      lifetimeReads: 12,
      nextTier: 'silver',
      readsToNextTier: 38,
    })
  })

  it('promotes to silver then gold without inventing reads', () => {
    expect(loyaltyFromLifetimeReads(50).tier).toBe('silver')
    expect(loyaltyFromLifetimeReads(199).readsToNextTier).toBe(1)
    expect(loyaltyFromLifetimeReads(200)).toMatchObject({
      tier: 'gold',
      nextTier: null,
      readsToNextTier: null,
    })
  })
})
