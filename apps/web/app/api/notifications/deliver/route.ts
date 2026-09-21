import { runNotificationDelivery } from '@/lib/notifications/delivery-route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = runNotificationDelivery
export const POST = runNotificationDelivery
