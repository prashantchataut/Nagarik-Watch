import { NextResponse } from 'next/server'
import { collectWebHealth } from '@/lib/ops/web-health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Readiness: this instance should receive traffic. */
export async function GET() {
  const snapshot = await collectWebHealth()
  return NextResponse.json(
    {
      status: snapshot.ready ? 'ok' : 'not-ready',
      probe: 'ready',
      ready: snapshot.ready,
      service: snapshot.service,
      contentMode: snapshot.contentMode,
      launchStatus: snapshot.launchStatus,
      checks: {
        database: snapshot.checks.database,
        migrations: snapshot.checks.migrations,
        payload: snapshot.checks.payload,
        configuration: snapshot.checks.configuration,
      },
      checkedAt: snapshot.checkedAt,
    },
    {
      status: snapshot.ready ? 200 : 503,
      headers: { 'cache-control': 'no-store, max-age=0' },
    },
  )
}
