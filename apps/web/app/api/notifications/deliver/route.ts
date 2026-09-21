import { NextResponse, type NextRequest } from 'next/server'
import { runNotificationDelivery } from '@/lib/notifications/deliver-run'
import { isCronAuthorized } from '@/lib/ops/cron-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Legacy path for the notification push drain. The canonical cron path is
 * `/api/cron/notifications-deliver`, which is what `ops-crons.yml` calls;
 * this stays so any externally configured schedule keeps working.
 */
async function run(request: NextRequest) {
  if (!isCronAuthorized(request))
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  return NextResponse.json(await runNotificationDelivery())
}

export const GET = run
export const POST = run
