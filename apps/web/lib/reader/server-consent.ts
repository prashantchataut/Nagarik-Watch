import type { NextRequest } from 'next/server'

type ConsentCookie = {
  analytics?: unknown
  advertising?: unknown
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

export function hasServerAdvertisingConsent(request: NextRequest): boolean {
  const parsed = readConsentCookie(request)
  if (!parsed) return false
  return parsed.advertising === true && typeof parsed.version === 'number'
}
