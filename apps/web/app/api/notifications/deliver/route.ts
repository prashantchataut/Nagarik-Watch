import { NextResponse, type NextRequest } from 'next/server'
import { listNotificationEvents } from '@/lib/notifications/store'
import { deliverPushEvent } from '@/lib/notifications/subscriptions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function authorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || secret.length < 24) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

async function run(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const events = await listNotificationEvents(20, 2)
  const results = []
  for (const event of events) results.push({ eventId: event.id, ...(await deliverPushEvent(event)) })
  return NextResponse.json({ ok: true, events: results })
}

export const GET = run
export const POST = run
