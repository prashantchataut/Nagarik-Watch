/**
 * Single source of truth for the reader-facing paywall gate. Combines the
 * membership check (lib/membership.ts) with the free-article session meter
 * (lib/free-article-meter.ts) so premium gating and metered gating never
 * diverge between the article page, admin tooling, and the algorithms catalog.
 */

export type PaywallDecisionInput = {
  /** True when the reader has an active membership/subscription. */
  isMember: boolean
  /** Free reads left in the current session meter. Use `Infinity` when the meter is not tracked. */
  freeRemaining: number
  /** True when the specific article requires membership regardless of the meter. */
  articlePremium: boolean
}

/**
 * Members always read free. A premium article is gated for everyone else.
 * A non-premium article is gated only once the free-article meter is exhausted.
 */
export function shouldShowPaywall({
  isMember,
  freeRemaining,
  articlePremium,
}: PaywallDecisionInput): boolean {
  if (isMember) return false
  if (articlePremium) return true
  return freeRemaining <= 0
}

export function paywallReason(
  input: PaywallDecisionInput,
): 'none' | 'premium-article' | 'meter-exhausted' {
  if (!shouldShowPaywall(input)) return 'none'
  return input.articlePremium ? 'premium-article' : 'meter-exhausted'
}
