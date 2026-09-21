import { NextResponse, type NextRequest } from 'next/server'
import { collectWebHealth, type WebHealthSnapshot } from '@/lib/ops/web-health'
import { isCronAuthorized } from '@/lib/ops/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Liveness/health probe.
 *
 * The full snapshot (per-check detail strings, provider names, migration lists)
 * is operator information: it is only returned to a caller that presents the
 * cron/ops bearer token. Anonymous callers get a minimal, non-identifying
 * summary, because a public endpoint that narrates the deployment's
 * configuration is free reconnaissance for an attacker.
 */
export async function GET(request: NextRequest) {
  const snapshot = await collectWebHealth()
  const status = snapshot.status === 'degraded' ? 503 : 200
  const headers = { 'cache-control': 'no-store, max-age=0' }

  if (isCronAuthorized(request)) {
    return NextResponse.json(snapshot, { status, headers })
  }

  const publicSummary: Pick<WebHealthSnapshot, 'status' | 'ready' | 'service' | 'checkedAt'> = {
    status: snapshot.status,
    ready: snapshot.ready,
    service: snapshot.service,
    checkedAt: snapshot.checkedAt,
  }
  return NextResponse.json(publicSummary, { status, headers })
}
