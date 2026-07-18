import { NextResponse, type NextRequest } from 'next/server'
import { recordRankingEvent, type RankingEventType } from '@/lib/engagement/ranking-events'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { enforceRateLimit } from '@/lib/rate-limit'
import { hasServerAnalyticsConsent } from '@/lib/reader/server-consent'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED: RankingEventType[] = ['impression', 'click', 'share']

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  if (!hasServerAnalyticsConsent(request)) return new NextResponse(null, { status: 204 })

  const limited = await enforceRateLimit(request, 'ranking-events', 60, 60_000)
  if (limited) return limited

  let body: { articleSlug?: string; articleCategory?: string; type?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const type = body.type as RankingEventType
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }
  const articleSlug = String(body.articleSlug ?? '').trim()
  if (!articleSlug || articleSlug.length > 200) {
    return NextResponse.json({ error: 'Invalid article' }, { status: 400 })
  }

  await recordRankingEvent({
    articleSlug,
    articleCategory: String(body.articleCategory ?? '').trim().slice(0, 80),
    type,
  })

  return NextResponse.json({ ok: true })
}
