import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { SITE_URL } from '@/lib/site'

export const dynamic = 'force-dynamic'

const RATE_LIMIT = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip)
  if (!entry || entry.resetAt < now) {
    RATE_LIMIT.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 3) return false
  entry.count++
  return true
}

// In-memory pending-confirmation list. When a provider (Resend/Listmonk) is
// configured, this is replaced by a real provider call. Double opt-in: the
// subscriber gets a confirmation email with a token link; clicking it moves
// them to confirmed.
//
// Shared with the confirm route (app/api/newsletter/confirm/route.ts) via a
// module-level singleton accessor so both routes read/write the same maps
// within a single long-lived server process (dev / single-instance preview).
// For multi-instance production, swap `getSubscriberStore()` for a Redis or
// Postgres-backed implementation — the call sites stay identical.
import { addPendingSubscriber, isConfirmedSubscriber, removePendingSubscriber } from '../store'

/**
 * POST /api/newsletter/subscribe — double-opt-in newsletter subscription.
 *
 * Flow:
 *   1. Reader submits email.
 *   2. We store { email, token } in pendingSubscribers.
 *   3. If NEWSLETTER_API_KEY + NEWSLETTER_API_BASE are set, we call the
 *      provider to send a confirmation email. Otherwise we log the token so
 *      the founder can confirm manually during dev.
 *   4. GET /api/newsletter/confirm?token=… moves the email to confirmed.
 *      (That route lives in app/api/newsletter/confirm/route.ts — Next.js
 *      resolves /api/newsletter/confirm to its own file, not the GET export
 *      here, so confirm logic is split out accordingly.)
 *
 * Body: { email }
 */
export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!rateLimit(ip)) {
    return NextResponse.json({ error: 'धेरै प्रयास।' }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return NextResponse.json({ error: 'मान्य इमेल भर्नुहोस्।' }, { status: 400 })
  }

  if (await isConfirmedSubscriber(email)) {
    return NextResponse.json({ ok: true, message: 'Already subscribed.' })
  }

  const token = crypto.randomUUID()
  await addPendingSubscriber(email, token)

  const providerKey = process.env.NEWSLETTER_API_KEY
  const providerBase = process.env.NEWSLETTER_API_BASE
  const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${token}`

  if (process.env.NODE_ENV === 'production' && (!providerKey || !providerBase)) {
    await removePendingSubscriber(token)
    return NextResponse.json({ error: 'Newsletter provider is not configured.' }, { status: 503 })
  }

  if (providerKey && providerBase) {
    try {
      await fetch(`${providerBase}/messages`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${providerKey}`,
        },
        body: JSON.stringify({
          from: 'Nagarik Watch <newsletter@nagarikwatch.com>',
          to: email,
          subject: 'नागरिक वाच — सदस्यता पुष्टि गर्नुहोस्',
          text: `नमस्ते,\n\nतपाईंले नागरिक वाचको न्युजलेटर सदस्यताका लागि अनुरोध गर्नुभएको छ। पुष्टि गर्न यो लिङ्कमा क्लिक गर्नुहोस्:\n\n${confirmUrl}\n\nधन्यवाद,\nनागरिक वाच टोली`,
        }),
      })
    } catch {
      await removePendingSubscriber(token)
      return NextResponse.json({ error: 'Newsletter provider failed.' }, { status: 502 })
    }
  }

  return NextResponse.json(
    { ok: true, message: 'पुष्टि इमेल पठाइयो। आफ्नो इनबक्स जाँच्नुहोस्।' },
    { status: 202 },
  )
}
