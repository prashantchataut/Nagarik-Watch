import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/membership', () => ({
  isPremiumSubscriber: vi.fn(async (session: unknown) => Boolean(session)),
}))

import {
  checkEntitlement,
  epaperEnabled,
  listReplicaPages,
  offlineCachePolicy,
  pageFlipBudget,
  reconcileCirculation,
  scorePageFlip,
} from './index'

const ORIGINAL_ENV = { ...process.env }

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('epaperEnabled', () => {
  it('is false by default and true only when explicitly enabled', () => {
    delete process.env.EPAPER_ENABLED
    expect(epaperEnabled()).toBe(false)
    process.env.EPAPER_ENABLED = 'true'
    expect(epaperEnabled()).toBe(true)
  })
})

describe('listReplicaPages', () => {
  it('returns disabled with no editions when EPAPER_ENABLED is unset', async () => {
    delete process.env.EPAPER_ENABLED
    const result = await listReplicaPages()
    expect(result).toEqual({ enabled: false, editions: [] })
  })

  it('returns enabled with an empty honest state when no config path resolves', async () => {
    process.env.EPAPER_ENABLED = 'true'
    delete process.env.EPAPER_CONFIG_PATH
    const result = await listReplicaPages()
    expect(result.enabled).toBe(true)
    expect(result.editions).toEqual([])
  })
})

describe('checkEntitlement', () => {
  it('always allows non-premium pages', async () => {
    const result = await checkEntitlement(null, { premium: false })
    expect(result).toEqual({ allowed: true, tier: 'free', reason: 'Page is not gated.' })
  })

  it('denies premium pages for anonymous readers', async () => {
    const result = await checkEntitlement(null, { premium: true })
    expect(result.allowed).toBe(false)
    expect(result.tier).toBe('free')
  })

  it('allows premium pages for a subscribed reader', async () => {
    const result = await checkEntitlement(
      { userId: 'u1', email: 'a@b.com', displayName: null, role: 'subscriber', locale: 'en' },
      { premium: true },
    )
    expect(result.allowed).toBe(true)
    expect(result.tier).toBe('digital')
  })
})

describe('offlineCachePolicy', () => {
  it('caps cached pages and disables further caching under save-data', () => {
    const result = offlineCachePolicy({ totalPages: 20, cachedPages: 20, quotaMb: 100, usedMb: 10, saveData: true })
    expect(result.maxCachedPages).toBe(5)
    expect(result.shouldCacheMore).toBe(false)
  })

  it('allows caching more pages when health is below 1 and save-data is off', () => {
    const result = offlineCachePolicy({ totalPages: 20, cachedPages: 2, quotaMb: 100, usedMb: 10, saveData: false })
    expect(result.shouldCacheMore).toBe(true)
    expect(result.maxCachedPages).toBe(20)
  })
})

describe('reconcileCirculation', () => {
  it('flags a large print/digital gap as out of tolerance', () => {
    const result = reconcileCirculation(1000, 100)
    expect(result.withinTolerance).toBe(false)
  })

  it('accepts a small gap as within tolerance', () => {
    const result = reconcileCirculation(100, 95)
    expect(result.withinTolerance).toBe(true)
  })
})

describe('pageFlipBudget / scorePageFlip', () => {
  it('gives low-tier devices the largest budget', () => {
    expect(pageFlipBudget('low').budgetMs).toBeGreaterThan(pageFlipBudget('high').budgetMs)
  })

  it('scores a flip within budget as 1', () => {
    expect(scorePageFlip('high', 10)).toBe(1)
  })
})
