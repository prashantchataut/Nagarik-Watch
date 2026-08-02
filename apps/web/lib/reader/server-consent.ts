import type { NextRequest } from 'next/server'

type ConsentCookie = {
  analytics?: unknown
  advertising?: unknown
  personalization?: unknown
  version?: unknown
}

function readConsentCookie(request: NextRequest): ConsentCookie | null {
  const value = request.cookies.get('nw_consent')?.value
  if (!value) return null
  try {
    return JSON.parse(decodeURIComponent(value)) as ConsentCookie
  } catch {
    return null
  }
}

export function hasServerAnalyticsConsent(request: NextRequest): boolean {
  const parsed = readConsentCookie(request)
  if (!parsed) return false
  return parsed.analytics === true && typeof parsed.version === 'number'
}

export function hasServerPersonalizationConsent(request: NextRequest): boolean {
  const parsed = readConsentCookie(request)
  if (!parsed) return false
  return parsed.personalization === true && typeof parsed.version === 'number'
}

/** Mirrors client `hasEngagementConsent`: analytics or personalization. */
export function hasServerEngagementConsent(request: NextRequest): boolean {
  return hasServerAnalyticsConsent(request) || hasServerPersonalizationConsent(request)
}

export function hasServerAdvertisingConsent(request: NextRequest): boolean {
  const parsed = readConsentCookie(request)
  if (!parsed) return false
  return parsed.advertising === true && typeof parsed.version === 'number'
}
