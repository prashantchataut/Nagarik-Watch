import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { asLocale } from '@/lib/i18n/locales'
import {
  disablePushSubscription,
  savePushSubscription,
  type PushSubscriptionInput,
} from '@/lib/notifications/subscriptions'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request))
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  const limited = await enforceRateLimit(request, 'push-subscription', 12, 60_000)
  if (limited) return limited
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  const fingerprint = String(body.fingerprint ?? '').trim()
  const session = await getSession().catch(() => null)
  if ((!session && !fingerprint) || fingerprint.length > 160)
    return NextResponse.json({ error: 'Reader identity required.' }, { status: 400 })
  try {
    const stored = await savePushSubscription({
      fingerprint,
      userId: session?.userId,
      locale: asLocale(String(body.locale ?? 'ne')),
      subscription: body.subscription as PushSubscriptionInput,
    })
    return NextResponse.json({ ok: true, id: stored.id })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid subscription.' },
      { status: 400 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  if (!isTrustedWriteRequest(request))
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }
  const endpoint = String(body.endpoint ?? '').trim()
  const fingerprint = String(body.fingerprint ?? '').trim()
  const session = await getSession().catch(() => null)
  if (!endpoint || (!session && !fingerprint))
    return NextResponse.json({ error: 'Subscription identity required.' }, { status: 400 })
  await disablePushSubscription(endpoint, fingerprint, session?.userId)
  return NextResponse.json({ ok: true })
}
