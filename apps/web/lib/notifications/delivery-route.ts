import { NextResponse, type NextRequest } from 'next/server'
import { listNotificationEvents } from '@/lib/notifications/store'
import { deliverPushEvent } from '@/lib/notifications/subscriptions'
import { batchPressure, fatigueHeadroom, isQuietHour } from '@/lib/algorithms/product/notify-policy'
import { isCronAuthorized } from '@/lib/ops/cron-auth'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'

const NOTIFICATIONS_CRON_JOB = 'notifications-deliver'

type DeliveryRow = { eventId: string } & Awaited<ReturnType<typeof deliverPushEvent>>

/**
 * Push fan-out for the notification queue. One implementation serves both
 * `/api/notifications` and `/api/notifications/deliver` so the two cron paths
 * cannot drift apart (they were previously two byte-identical route files).
 */
export async function runNotificationDelivery(request: NextRequest) {
  if (!isCronAuthorized(request))
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })

  await recordCronHeartbeat(NOTIFICATIONS_CRON_JOB).catch(() => undefined)

  const hour = new Date().getHours()
  const quiet = isQuietHour(hour)
  const events = await listNotificationEvents(20, 2)
  const pressure = batchPressure(events.length, 30)
  const fatigue = fatigueHeadroom(events.length, 20)

  if (quiet) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'quiet_hours',
      hour,
      pending: events.length,
      batchPressure: pressure,
      fatigueHeadroom: fatigue,
      events: [],
    })
  }

  const deliverable = pressure > 0.9 ? events.slice(0, 5) : events
  const results: DeliveryRow[] = []
  for (const event of deliverable) {
    results.push({ eventId: event.id, ...(await deliverPushEvent(event)) })
  }
  return NextResponse.json({
    ok: true,
    skipped: false,
    batchPressure: pressure,
    fatigueHeadroom: fatigue,
    events: results,
  })
}
