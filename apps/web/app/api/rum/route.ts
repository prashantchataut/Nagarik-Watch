import { NextResponse, type NextRequest } from 'next/server'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { hasServerAnalyticsConsent } from '@/lib/reader/server-consent'

export const dynamic = 'force-dynamic'

const ALLOWED_METRICS = new Set(['page-load', 'lcp', 'cls'])

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (!hasServerAnalyticsConsent(request)) return new NextResponse(null, { status: 204 })
  const limited = await enforceRateLimit(request, 'rum', 60, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 2_048) {
      return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
    }
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const name = String(body.name ?? '')
  const value = Number(body.value)
  const path = String(body.path ?? '')
  if (!ALLOWED_METRICS.has(name) || !Number.isFinite(value) || value < 0 || path.length > 500 || !path.startsWith('/')) {
    return NextResponse.json({ error: 'Invalid RUM metric.' }, { status: 400 })
  }

  // The beacon adapter deliberately emits no identifiers. Platform log drains
  // can consume this structured event until a durable analytics sink is added.
  console.info('[rum]', { name, value, path })
  return new NextResponse(null, { status: 202 })
}
