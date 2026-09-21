/**
 * Legacy alias for the push fan-out. The single implementation lives in
 * `@/lib/notifications/delivery-route` so both cron paths share one contract.
 */
import { runNotificationDelivery } from '@/lib/notifications/delivery-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = runNotificationDelivery
export const POST = runNotificationDelivery
