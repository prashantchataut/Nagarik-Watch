import { NextResponse } from 'next/server'
import type { Locale } from '@nagarikwatch/db'
import { enforceRateLimit } from '@/lib/rate-limit'
import { searchStoriesRanked } from '@/lib/search-server'

const MAX_QUERY = 120
const MAX_RESULTS = 48

export async function GET(request: Request) {
  // Unauthenticated and the heaviest public read on the site: every hit runs a
  // full-corpus query. `search-events` (the telemetry sibling) was limited
  // while the query itself was not.
  const limited = await enforceRateLimit(request, 'search', 30, 60_000)
  if (limited) return limited

  const url = new URL(request.url)
  const q = (url.searchParams.get('q') ?? '').trim().slice(0, MAX_QUERY)
  const locale: Locale = url.searchParams.get('locale') === 'en' ? 'en' : 'ne'

  if (q.length < 2) return NextResponse.json({ items: [], total: 0 })

  // BM25 over the cached server index, so an inflected Nepali query reaches the
  // uninflected headline and the best match — not merely the newest — is first.
  const result = await searchStoriesRanked(q, locale, MAX_RESULTS)

  if (result.items.length === 0 && !result.ranked) {
    return NextResponse.json({ items: [], total: 0, unavailable: true }, { status: 503 })
  }

  return NextResponse.json(
    {
      items: result.items,
      total: result.total,
      ranked: result.ranked,
      corpusSize: result.corpusSize,
    },
    { headers: { 'Cache-Control': 'private, max-age=30' } },
  )
}
