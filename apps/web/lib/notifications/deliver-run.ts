import 'server-only'
import { listNotificationEvents } from '@/lib/notifications/store'
import { deliverPushEvent } from '@/lib/notifications/subscriptions'
import { batchPressure, fatigueHeadroom, isQuietHour } from '@/lib/algorithms/product/notify-policy'
import { recordCronHeartbeat } from '@/lib/ops/cron-heartbeat'

export const NOTIFICATIONS_CRON_JOB = 'notifications-deliver'

/** Newsroom-local time. Serverless hosts run UTC, which is NPT − 5:45. */
const NEWSROOM_TIME_ZONE = 'Asia/Kathmandu'

export type DeliveryResult = {
  eventId: string
  configured: boolean
  eligible: number
  sent: number
  failed: number
}

export type DeliverRunReport = {
  ok: true
  skipped: boolean
  reason?: string
  hour: number
  timeZone: string
  pending: number
  batchPressure: number
  fatigueHeadroom: number
  events: DeliveryResult[]
}

/**
 * Hour of day in the newsroom's timezone. `new Date().getHours()` reads the
 * server clock, which on Vercel/Cloudflare is UTC: a 22:00–06:00 quiet window
 * evaluated there actually silences 03:45–11:45 NPT — the Nepali morning news
 * peak — while running wide open through the Kathmandu night.
 */
export function newsroomHour(now = new Date(), timeZone = NEWSROOM_TIME_ZONE): number {
  try {
    const parsed = Number.parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(now),
      10,
    )
    if (Number.isFinite(parsed)) return parsed
  } catch {}
  return now.getUTCHours()
}

/**
 * Drain pending notification events to push subscribers.
 *
 * Quiet hours are enforced per reader inside `deliverPushEvent`, in each
 * reader's own persisted IANA timezone, and that path deliberately lets
 * breaking news through. This batch-level window is only a throttle on
 * non-urgent volume, so during newsroom quiet hours we narrow the batch to
 * breaking events rather than skipping the run outright — the previous
 * all-or-nothing skip overrode the per-reader breaking exemption.
 */
export async function runNotificationDelivery(now = new Date()): Promise<DeliverRunReport> {
  await recordCronHeartbeat(NOTIFICATIONS_CRON_JOB).catch(() => undefined)

  const hour = newsroomHour(now)
  const quiet = isQuietHour(hour)
  const events = await listNotificationEvents(20, 2)
  const pressure = batchPressure(events.length, 30)
  const fatigue = fatigueHeadroom(events.length, 20)

  const inWindow = quiet ? events.filter((event) => event.isBreaking) : events
  const deliverable = pressure > 0.9 ? inWindow.slice(0, 5) : inWindow

  const results: DeliveryResult[] = []
  for (const event of deliverable) {
    results.push({ eventId: event.id, ...(await deliverPushEvent(event)) })
  }

  return {
    ok: true,
    skipped: quiet && deliverable.length === 0,
    reason: quiet ? 'quiet_hours_breaking_only' : undefined,
    hour,
    timeZone: NEWSROOM_TIME_ZONE,
    pending: events.length,
    batchPressure: pressure,
    fatigueHeadroom: fatigue,
    events: results,
  }
}
