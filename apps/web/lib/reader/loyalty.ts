/**
 * Transparent loyalty tiers from consented lifetime completed reads.
 * Same thresholds as the `reader-loyalty-tiers` capability — never invents
 * engagement to push a reader into a higher tier.
 */
export type LoyaltyTier = 'bronze' | 'silver' | 'gold'

export type LoyaltySummary = {
  tier: LoyaltyTier
  lifetimeReads: number
  nextTier: LoyaltyTier | null
  readsToNextTier: number | null
}

export function loyaltyFromLifetimeReads(lifetimeReads: number): LoyaltySummary {
  const reads = Math.max(0, Math.floor(lifetimeReads))
  if (reads >= 200) {
    return { tier: 'gold', lifetimeReads: reads, nextTier: null, readsToNextTier: null }
  }
  if (reads >= 50) {
    return {
      tier: 'silver',
      lifetimeReads: reads,
      nextTier: 'gold',
      readsToNextTier: 200 - reads,
    }
  }
  return {
    tier: 'bronze',
    lifetimeReads: reads,
    nextTier: 'silver',
    readsToNextTier: 50 - reads,
  }
}
