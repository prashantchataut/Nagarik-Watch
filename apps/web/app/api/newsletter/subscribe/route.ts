import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { SITE_URL } from '@/lib/site'
import { clientIp, enforceRateLimit } from '@/lib/rate-limit'
import { getEmailProviderState, sendEmail } from '@/lib/email-provider'
import { addPendingSubscriber, isConfirmedSubscriber, removePendingSubscriber } from '../store'
import { getCaptchaState, verifyTurnstileToken } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'

/** POST /api/newsletter/subscribe — durable double-opt-in subscription. */
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

  if (getCaptchaState().enabled) {
    const captcha = await verifyTurnstileToken(String(body.turnstileToken ?? ''), clientIp(request))
    if (!captcha.success) {
      return NextResponse.json({ error: 'Captcha verification failed.' }, { status: 400 })
    }
  }

  const email = String(body.email ?? '')
    .trim()
    .toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'मान्य इमेल भर्नुहोस्।' }, { status: 400 })
  }

  if (await isConfirmedSubscriber(email)) {
    return NextResponse.json({ ok: true, message: 'Already subscribed.' })
  }

  const provider = getEmailProviderState()
  if (process.env.NODE_ENV === 'production' && !provider.ready) {
    return NextResponse.json({ error: 'Newsletter provider is not configured.' }, { status: 503 })
  }

  const token = crypto.randomUUID()
  await addPendingSubscriber(email, token)
  const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${encodeURIComponent(token)}`

  if (provider.ready) {
    try {
      await sendEmail({
        to: email,
        subject: 'नागरिक वाच — सदस्यता पुष्टि गर्नुहोस्',
        text: `नमस्ते,\n\nतपाईंले नागरिक वाचको न्युजलेटर सदस्यताका लागि अनुरोध गर्नुभएको छ। पुष्टि गर्न यो लिङ्क खोल्नुहोस्:\n\n${confirmUrl}\n\nधन्यवाद,\nनागरिक वाच टोली`,
      })
    } catch (error) {
      await removePendingSubscriber(token)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Newsletter provider failed.' },
        { status: 502 },
      )
    }
  }

  return NextResponse.json(
    {
      ok: true,
      message: provider.ready
        ? 'पुष्टि इमेल पठाइयो। आफ्नो इनबक्स जाँच्नुहोस्।'
        : 'Development mode: subscription is pending until the confirmation link is opened.',
      ...(process.env.NODE_ENV !== 'production' && !provider.ready
        ? { developmentConfirmUrl: confirmUrl }
        : {}),
    },
    { status: 202 },
  )
}
