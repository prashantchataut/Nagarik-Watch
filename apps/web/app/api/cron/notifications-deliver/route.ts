import { NextResponse, type NextRequest } from 'next/server'
import { runNotificationDelivery } from '@/lib/notifications/deliver-run'
import { isCronAuthorized } from '@/lib/ops/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Drains queued notification events to web-push subscribers. `health-snapshot`
 * expects a `notifications-deliver` heartbeat; before this route existed under
 * `/api/cron/*` the job was reachable but scheduled nowhere, so ops health
 * reported it permanently stale.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  }
  return NextResponse.json(await runNotificationDelivery())
}

export const GET = run
export const POST = run
