import { describe, expect, it } from 'vitest'
import type { NextRequest } from 'next/server'
import {
  hasServerAnalyticsConsent,
  hasServerEngagementConsent,
  hasServerPersonalizationConsent,
} from './server-consent'

function requestWithConsentCookie(value: string | null): NextRequest {
  return {
    cookies: {
      get: (name: string) => (name === 'nw_consent' && value != null ? { name, value } : undefined),
    },
  } as NextRequest
}

describe('server consent cookie', () => {
  it('rejects missing or invalid cookies', () => {
    expect(hasServerEngagementConsent(requestWithConsentCookie(null))).toBe(false)
    expect(hasServerEngagementConsent(requestWithConsentCookie('not-json'))).toBe(false)
    expect(
      hasServerEngagementConsent(
        requestWithConsentCookie(encodeURIComponent(JSON.stringify({ analytics: true }))),
      ),
    ).toBe(false)
  })

  it('accepts analytics or personalization when version is a number', () => {
    const analytics = encodeURIComponent(
      JSON.stringify({ analytics: true, personalization: false, version: 4 }),
    )
    const personalization = encodeURIComponent(
      JSON.stringify({ analytics: false, personalization: true, version: 4 }),
    )
    expect(hasServerAnalyticsConsent(requestWithConsentCookie(analytics))).toBe(true)
    expect(hasServerPersonalizationConsent(requestWithConsentCookie(personalization))).toBe(true)
    expect(hasServerEngagementConsent(requestWithConsentCookie(analytics))).toBe(true)
    expect(hasServerEngagementConsent(requestWithConsentCookie(personalization))).toBe(true)
  })

  it('does not treat advertising-only as engagement consent', () => {
    const advertisingOnly = encodeURIComponent(
      JSON.stringify({ advertising: true, analytics: false, personalization: false, version: 4 }),
    )
    expect(hasServerEngagementConsent(requestWithConsentCookie(advertisingOnly))).toBe(false)
  })
})
