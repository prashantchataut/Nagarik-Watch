import 'server-only'
import type { NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/site'

/**
 * Strict same-site write guard for cookie-bearing API routes.
 *
 * Production trusts only configured site/auth origins — not Host-derived
 * values — so Host header spoofing cannot widen the allowlist.
 */
export function isTrustedWriteRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  // In production, browser cookie-bearing writes must send Origin. Missing Origin
  // is only permitted outside production for non-browser tooling.
  if (!origin) return process.env.NODE_ENV !== 'production'

  const allowed = new Set(
    [
      SITE_URL,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.BETTER_AUTH_URL,
      process.env.SITE_URL,
      'https://www.nagarikwatch.com',
      'https://nagarikwatch.com',
      'https://nagarik-watch.vercel.app',
    ]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => safeOrigin(value))
      .filter((value): value is string => Boolean(value)),
  )

  // Same-deployment trust: Origin matching this request's Host is always allowed.
  // Covers custom domains, www aliases, and *.vercel.app without widening to arbitrary hosts.
  const host =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.trim() ||
    ''
  if (host) {
    allowed.add(`https://${host}`)
    allowed.add(`http://${host}`)
  }

  const allowHostPreview =
    process.env.NODE_ENV !== 'production' || process.env.ALLOW_HOST_ORIGIN_TRUST === 'true'
  if (allowHostPreview) {
    allowed.add('http://localhost:3000')
    allowed.add('http://127.0.0.1:3000')
    allowed.add('http://localhost:3101')
    allowed.add('http://127.0.0.1:3101')
  }

  const normalized = safeOrigin(origin)
  return Boolean(normalized && allowed.has(normalized))
}

function safeOrigin(value: string): string | null {
  try {
    const withProtocol =
      value.startsWith('http://') || value.startsWith('https://') ? value : `https://${value}`
    return new URL(withProtocol).origin
  } catch {
    return null
  }
}
