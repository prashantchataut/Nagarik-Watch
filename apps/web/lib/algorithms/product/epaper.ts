/**
 * Shared e-paper math: replica render coverage, entitlement gating, offline
 * cache health, print/digital circulation variance, and low-end page-flip
 * budgets. No replica renderer or download manager exists yet — these
 * functions honestly compute from whatever counters are supplied.
 */

export function replicaRenderScore(totalPages: number, renderedPages: number): number {
  if (totalPages <= 0) return 0
  return Math.max(0, Math.min(1, renderedPages / totalPages))
}

const ENTITLEMENT_TIERS = ['free', 'digital', 'print+digital'] as const

export function entitlementOk(tier: string, requiredTier: string): boolean {
  const userIdx = ENTITLEMENT_TIERS.indexOf(tier as (typeof ENTITLEMENT_TIERS)[number])
  const requiredIdx = ENTITLEMENT_TIERS.indexOf(requiredTier as (typeof ENTITLEMENT_TIERS)[number])
  if (userIdx === -1 || requiredIdx === -1) return false
  return userIdx >= requiredIdx
}

export function offlineCacheHealth(
  cachedPages: number,
  totalPages: number,
  quotaMb: number,
  usedMb: number,
): number {
  const coverage = totalPages > 0 ? cachedPages / totalPages : 0
  const quotaHeadroom = quotaMb > 0 ? Math.max(0, 1 - usedMb / quotaMb) : 1
  return Math.max(0, Math.min(1, coverage * 0.7 + quotaHeadroom * 0.3))
}

export function circulationVariance(printCopies: number, digitalEntitlements: number): number {
  const total = printCopies + digitalEntitlements
  if (total === 0) return 0
  return Math.abs(printCopies - digitalEntitlements) / total
}

export function pageFlipBudgetMs(deviceTier: 'low' | 'mid' | 'high'): number {
  return deviceTier === 'low' ? 220 : deviceTier === 'mid' ? 120 : 60
}

export function pageFlipScore(deviceTier: 'low' | 'mid' | 'high', measuredFlipMs: number): number {
  const budget = pageFlipBudgetMs(deviceTier)
  return measuredFlipMs <= budget ? 1 : Math.max(0, Math.min(1, budget / measuredFlipMs))
}
