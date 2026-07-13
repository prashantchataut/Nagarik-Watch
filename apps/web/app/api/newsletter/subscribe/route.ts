import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { SITE_URL } from '@/lib/site'
import { enforceRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

// Double opt-in state is durable in Postgres in production and uses a local
// process store only during development without DATABASE_URL.
import { addPendingSubscriber, isConfirmedSubscriber, removePendingSubscriber } from '../store'

/**
 * POST /api/newsletter/subscribe — double-opt-in newsletter subscription.
 *
 * Flow:
 *   1. Reader submits email.
 *   2. We store { email, token } in the subscriber store.
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

  const limited = await enforceRateLimit(request, 'newsletter', 3, 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
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
