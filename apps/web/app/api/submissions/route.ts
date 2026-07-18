import { NextResponse, type NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { enforceRateLimit, clientIp } from '@/lib/rate-limit'
import { getSession } from '@/lib/auth/session'
import { createSubmission } from '@/lib/submissions'
import { getCaptchaState, verifyTurnstileToken } from '@/lib/security/turnstile'

export const dynamic = 'force-dynamic'

function hashIp(ip: string): string {
  const salt = process.env.SUBMISSION_IP_SALT ?? process.env.AUTH_SECRET ?? 'dev-submission-salt'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 24)
}

export async function POST(request: NextRequest) {
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'submission', 3, 60 * 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const headline = String(body.headline ?? '').trim()
  const description = String(body.description ?? '').trim()
  const consent = body.consent === true
  const email = String(body.email ?? '').trim()
  const phone = String(body.phone ?? '').trim()
  const anonymous = body.anonymous === true

  if (getCaptchaState().enabled) {
    const captcha = await verifyTurnstileToken(String(body.turnstileToken ?? ''), clientIp(request))
    if (!captcha.success) {
      return NextResponse.json({ error: 'Captcha verification failed.' }, { status: 400 })
    }
  }

  if (!headline || !description || !consent) {
    return NextResponse.json(
      { error: 'Headline, description and consent are required.' },
      { status: 400 },
    )
  }
  if (!anonymous && !email && !phone) {
    return NextResponse.json(
      { error: 'Please provide an email or phone, or choose anonymous submission.' },
      { status: 400 },
    )
  }
  if (description.length > 5000) {
    return NextResponse.json({ error: 'Submission is too long.' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)
  const submission = await createSubmission({
    type: String(body.type ?? 'tip'),
    headline,
    description,
    name: anonymous ? undefined : String(body.name ?? '').trim() || undefined,
    email: anonymous ? undefined : email || undefined,
    phone: anonymous ? undefined : phone || undefined,
    evidenceUrl: String(body.evidenceUrl ?? '').trim() || undefined,
    anonymous,
    consent,
    locale: body.locale === 'en' ? 'en' : 'ne',
    ipHash: hashIp(clientIp(request)),
    userId: session?.userId,
  })

  return NextResponse.json(
    {
      id: submission.id,
      status: submission.status,
      message: 'Submission received. Editors will verify it before any publication.',
    },
    { status: 201 },
  )
}
