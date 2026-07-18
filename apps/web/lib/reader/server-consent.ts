import type { NextRequest } from 'next/server'

type ConsentCookie = {
  analytics?: unknown
  version?: unknown
}

export function hasServerAnalyticsConsent(request: NextRequest): boolean {
  const value = request.cookies.get('nw_consent')?.value
  if (!value) return false

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as ConsentCookie
    return parsed.analytics === true && typeof parsed.version === 'number'
  } catch {
    return false
  }
}
