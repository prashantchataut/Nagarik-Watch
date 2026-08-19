import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Liveness: the Node process can answer. Does not probe Postgres or Payload. */
export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      probe: 'live',
      service: 'nagarik-watch-web',
      checkedAt: new Date().toISOString(),
    },
    { status: 200, headers: { 'cache-control': 'no-store, max-age=0' } },
  )
}
