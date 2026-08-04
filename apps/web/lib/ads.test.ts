import { afterEach, describe, expect, it } from 'vitest'
import { getAdMode, getGamNetworkCode, isNetworkAdsReady } from '@/lib/ads'

describe('ad environment wiring', () => {
  const env = { ...process.env }

  afterEach(() => {
    process.env = { ...env }
  })

  it('defaults ads mode to off', () => {
    delete process.env.NEXT_PUBLIC_ADS_MODE
    expect(getAdMode()).toBe('off')
  })

  it('requires adsense client and slot for network readiness', () => {
    process.env.NEXT_PUBLIC_ADS_MODE = 'network'
    process.env.NEXT_PUBLIC_AD_NETWORK = 'adsense'
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT = 'ca-pub-123'
    delete process.env.NEXT_PUBLIC_ADSENSE_SLOT
    expect(isNetworkAdsReady()).toBe(false)

    process.env.NEXT_PUBLIC_ADSENSE_SLOT = '998877'
    expect(isNetworkAdsReady()).toBe(true)
  })

  it('accepts GAM network code aliases', () => {
    process.env.NEXT_PUBLIC_ADS_MODE = 'network'
    process.env.NEXT_PUBLIC_AD_NETWORK = 'gam'
    delete process.env.NEXT_PUBLIC_GAM_NETWORK_CODE
    process.env.NEXT_PUBLIC_AD_NETWORK_CODE = '123456789'
    expect(getGamNetworkCode()).toBe('123456789')
    expect(isNetworkAdsReady()).toBe(true)
  })
})
