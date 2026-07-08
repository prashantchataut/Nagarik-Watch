import 'server-only'
import type { NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/site'

/**
 * Strict same-site write guard for cookie-bearing API routes.
 *
 * It accepts same-origin requests and localhost preview requests. Browser
 * clients send Origin on unsafe methods; non-browser clients can be allowed by
 * server-to-server tokens later, but reader-facing writes should not accept
 * arbitrary cross-site POSTs.
 */
export function isTrustedWriteRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')
  if (!origin) return true

  const allowed = new Set(
    [SITE_URL, process.env.NEXT_PUBLIC_SITE_URL, process.env.BETTER_AUTH_URL]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => safeOrigin(value))
      .filter((value): value is string => Boolean(value)),
  )

  if (host) {
    allowed.add(`https://${host}`)
    allowed.add(`http://${host}`)
  }
  allowed.add('http://localhost:3000')
  allowed.add('http://127.0.0.1:3000')

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
