import { describe, expect, it } from 'vitest'
import { deliveryCoverage, fillRateAnomaly, floorPriceGuard } from './yield-local'

describe('fillRateAnomaly', () => {
  it('is not anomalous within tolerance', () => {
    const result = fillRateAnomaly(0.68, 0.7, 0.15)
    expect(result.anomalous).toBe(false)
  })

  it('flags a drop beyond tolerance', () => {
    const result = fillRateAnomaly(0.3, 0.7, 0.15)
    expect(result.drop).toBeCloseTo(0.4)
    expect(result.anomalous).toBe(true)
  })

  it('never flags an improvement', () => {
    const result = fillRateAnomaly(0.9, 0.7)
    expect(result.drop).toBe(0)
    expect(result.anomalous).toBe(false)
  })
})

describe('floorPriceGuard', () => {
  it('rejects a non-positive market estimate', () => {
    expect(floorPriceGuard(2, 0).withinBounds).toBe(false)
  })

  it('accepts a floor within the configured ratio band', () => {
    const result = floorPriceGuard(3, 5)
    expect(result.ratio).toBeCloseTo(0.6)
    expect(result.withinBounds).toBe(true)
  })

  it('rejects a floor set far above the market estimate', () => {
    expect(floorPriceGuard(10, 5).withinBounds).toBe(false)
  })
})

describe('deliveryCoverage', () => {
  it('is zero when there are no configured placements', () => {
    expect(deliveryCoverage(0, 0)).toBe(0)
  })

  it('computes the share of placements with delivery', () => {
    expect(deliveryCoverage(3, 4)).toBeCloseTo(0.75)
  })
})
