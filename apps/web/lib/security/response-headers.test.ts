import { describe, expect, it } from 'vitest'
import { baselineSecurityHeaders, contentSecurityPolicy } from './response-headers'
import { lintSecurityHeaders } from './header-lint'

function asRecord(env: Record<string, string | undefined>) {
  return Object.fromEntries(
    baselineSecurityHeaders(env).map((header) => [header.key.toLowerCase(), header.value]),
  )
}

describe('baselineSecurityHeaders', () => {
  it('satisfies the launch gate header lint it is reported through', () => {
    expect(lintSecurityHeaders(asRecord({ NODE_ENV: 'production' })).missing).toEqual([])
  })

  it('sends HSTS in production only, so localhost is never pinned to https', () => {
    expect(asRecord({ NODE_ENV: 'production' })['strict-transport-security']).toContain(
      'max-age=63072000',
    )
    expect(asRecord({ NODE_ENV: 'development' })['strict-transport-security']).toBeUndefined()
  })
})

describe('contentSecurityPolicy', () => {
  it('blocks plugin content and base-tag hijacking on every deployment', () => {
    const csp = contentSecurityPolicy({})
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
    expect(csp).toContain("frame-ancestors 'self'")
    expect(csp).toContain("form-action 'self'")
  })

  it('keeps ad-network origins out of script-src when the site serves house ads', () => {
    const csp = contentSecurityPolicy({ NEXT_PUBLIC_ADS_MODE: 'house' })
    expect(csp).not.toContain('googlesyndication.com')
    expect(csp).not.toContain('doubleclick.net')
  })

  it('keeps ad-network origins out while ads are off, which is the default mode', () => {
    expect(contentSecurityPolicy({})).not.toContain('googlesyndication.com')
  })

  it('admits AdSense only once network mode plus client and slot are configured', () => {
    const partial = contentSecurityPolicy({
      NEXT_PUBLIC_ADS_MODE: 'network',
      NEXT_PUBLIC_AD_NETWORK: 'adsense',
      NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-123',
    })
    expect(partial).not.toContain('pagead2.googlesyndication.com')

    const ready = contentSecurityPolicy({
      NEXT_PUBLIC_ADS_MODE: 'network',
      NEXT_PUBLIC_AD_NETWORK: 'adsense',
      NEXT_PUBLIC_ADSENSE_CLIENT: 'ca-pub-123',
      NEXT_PUBLIC_ADSENSE_SLOT: '9988776655',
    })
    expect(ready).toContain('https://pagead2.googlesyndication.com')
    expect(ready).toContain('https://tpc.googlesyndication.com')
  })

  it('admits GAM under either network-code variable lib/ads.ts accepts', () => {
    for (const key of ['NEXT_PUBLIC_GAM_NETWORK_CODE', 'NEXT_PUBLIC_AD_NETWORK_CODE'] as const) {
      const csp = contentSecurityPolicy({
        NEXT_PUBLIC_ADS_MODE: 'network',
        NEXT_PUBLIC_AD_NETWORK: 'gam',
        [key]: '123456',
      })
      expect(csp, key).toContain('https://securepubads.g.doubleclick.net')
    }
  })

  it('allows the self-hosted Plausible origin rather than hardcoding plausible.io', () => {
    const csp = contentSecurityPolicy({
      NEXT_PUBLIC_PLAUSIBLE_SRC: 'https://stats.nagarikwatch.com/js/script.js',
    })
    expect(csp).toContain('https://stats.nagarikwatch.com')
  })

  it('always allows Turnstile, which gates contact, tips and poll votes', () => {
    const csp = contentSecurityPolicy({})
    expect(csp).toContain('https://challenges.cloudflare.com')
  })

  it('upgrades insecure requests in production only', () => {
    expect(contentSecurityPolicy({ NODE_ENV: 'production' })).toContain('upgrade-insecure-requests')
    expect(contentSecurityPolicy({ NODE_ENV: 'development' })).not.toContain(
      'upgrade-insecure-requests',
    )
  })

  it('allows the configured object-storage origin for media', () => {
    const csp = contentSecurityPolicy({
      STORAGE_PUBLIC_BASE_URL: 'https://media.nagarikwatch.com/',
    })
    expect(csp).toContain('https://media.nagarikwatch.com')
  })

  it('ignores a malformed storage URL instead of emitting a broken source', () => {
    const csp = contentSecurityPolicy({ STORAGE_PUBLIC_BASE_URL: 'not a url ://' })
    expect(csp).not.toContain('not a url')
  })
})
