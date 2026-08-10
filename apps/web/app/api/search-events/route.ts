import { NextResponse, type NextRequest } from 'next/server'
import { recordSearchEvent } from '@/lib/search-analytics'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { hasServerAnalyticsConsent } from '@/lib/reader/server-consent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (!hasServerAnalyticsConsent(request)) return new NextResponse(null, { status: 204 })
  const limited = await enforceRateLimit(request, 'search-events', 30, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const recorded = await recordSearchEvent({
    query: body.query,
    resultCount: body.resultCount,
    locale: body.locale,
  })
  return NextResponse.json({ ok: true, recorded })
}
