import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const started = Date.now()
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'categories', overrideAccess: true })
    return NextResponse.json(
      {
        status: 'ok',
        service: 'nagarik-watch-admin',
        database: 'reachable',
        commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || undefined,
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
      },
      { headers: { 'cache-control': 'no-store, max-age=0' } },
    )
  } catch (error) {
    console.error('[health] admin database check failed', error)
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'nagarik-watch-admin',
        database: 'unreachable',
        detail: 'Admin database check failed',
        latencyMs: Date.now() - started,
        checkedAt: new Date().toISOString(),
      },
      { status: 503, headers: { 'cache-control': 'no-store, max-age=0' } },
    )
  }
}
