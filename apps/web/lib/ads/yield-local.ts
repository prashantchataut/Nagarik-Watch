/**
 * Local ad-yield health helpers. These compare rates and ratios the site
 * already observes (fill/coverage, floor vs. an operator-entered market
 * estimate) — they never invent network revenue, eCPM, or auction data that
 * Nagarik Watch does not actually collect.
 */

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export type FillAnomaly = {
  /** Positive when fill dropped below baseline; zero or negative otherwise. */
  drop: number
  anomalous: boolean
}

/**
 * Flags a fill/coverage-rate drop from a recent baseline. `toleranceRatio` is
 * the fraction of baseline allowed to erode before flagging (default 15%).
 */
export function fillRateAnomaly(
  observedFillRate: number,
  baselineFillRate: number,
  toleranceRatio = 0.15,
): FillAnomaly {
  const observed = clamp01(observedFillRate)
  const baseline = clamp01(baselineFillRate)
  const drop = Math.max(0, baseline - observed)
  const tolerance = baseline * clamp01(toleranceRatio)
  return { drop, anomalous: drop > tolerance }
}

export type FloorGuardResult = {
  ratio: number
  withinBounds: boolean
}

/**
 * Sanity-checks an operator-entered floor price against an operator-entered
 * market estimate. Neither number is fabricated here — callers must supply
 * real configured values (house-ad rate card, manual market note, etc).
 */
export function floorPriceGuard(
  floorPrice: number,
  marketEstimate: number,
  minRatio = 0.4,
  maxRatio = 1.5,
): FloorGuardResult {
  if (!Number.isFinite(floorPrice) || !Number.isFinite(marketEstimate) || marketEstimate <= 0) {
    return { ratio: 0, withinBounds: false }
  }
  const ratio = floorPrice / marketEstimate
  return { ratio, withinBounds: ratio >= minRatio && ratio <= maxRatio }
}

/** Share of configured placements that recorded any delivery (house ad or network) in the window. */
export function deliveryCoverage(placementsWithDelivery: number, totalPlacements: number): number {
  if (totalPlacements <= 0) return 0
  return clamp01(placementsWithDelivery / totalPlacements)
}
