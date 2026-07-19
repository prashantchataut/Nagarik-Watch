/**
 * Attention estimate for a rendered ad placement, computed from viewability
 * and dwell inputs the browser can observe honestly (IntersectionObserver
 * ratio, time-in-view, and page visibility). No vendor viewability pixel or
 * panel data is assumed — this is a local proxy metric only.
 */

export type AttentionInput = {
  /** Intersection ratio (0-1) observed when the impression fired. */
  viewableRatio: number
  /** Milliseconds the placement stayed at/above the viewability threshold. */
  dwellMs: number
  /** False when the tab was hidden for part of the dwell window. */
  tabVisible?: boolean
}

/** Diminishing returns after this much continuous dwell. */
export const ATTENTION_DWELL_CAP_MS = 5_000

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

/** 0-1 attention score: half from viewable ratio, half from dwell, discounted when the tab was hidden. */
export function attentionScore(input: AttentionInput): number {
  const ratio = clamp01(input.viewableRatio)
  const dwellFactor = clamp01(Math.max(0, input.dwellMs) / ATTENTION_DWELL_CAP_MS)
  const visibilityFactor = input.tabVisible === false ? 0.3 : 1
  return clamp01(ratio * 0.5 + dwellFactor * 0.5) * visibilityFactor
}

export function isAttentiveImpression(score: number, threshold = 0.4): boolean {
  return score >= threshold
}

export type AttentionSummary = {
  averageScore: number
  attentiveShare: number
}

/** Aggregate a batch of scored impressions for admin/report surfaces. */
export function summarizeAttention(scores: number[], threshold = 0.4): AttentionSummary {
  if (scores.length === 0) return { averageScore: 0, attentiveShare: 0 }
  const total = scores.reduce((sum, score) => sum + clamp01(score), 0)
  const attentive = scores.filter((score) => isAttentiveImpression(score, threshold)).length
  return {
    averageScore: total / scores.length,
    attentiveShare: attentive / scores.length,
  }
}
