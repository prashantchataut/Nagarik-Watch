import { NextResponse, type NextRequest } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { isPublicMembershipEnabled } from '@/lib/membership'
import { getPaymentAdapter } from '@/lib/payments/adapter'
import { enforceRateLimit } from '@/lib/rate-limit'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { SITE_URL } from '@/lib/site'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PRICE_ENV = {
  monthly: 'STRIPE_MONTHLY_PRICE_ID',
  yearly: 'STRIPE_YEARLY_PRICE_ID',
} as const

export async function POST(request: NextRequest) {
  if (!isPublicMembershipEnabled()) {
    return NextResponse.json({ error: 'Public membership checkout is not enabled.' }, { status: 404 })
  }
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'payment-checkout', 5, 60_000)
  if (limited) return limited

  const session = await getSession()
  if (!session) {
    const login = new URL('/auth/login', SITE_URL)
    login.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(login, 303)
  }

  const form = await request.formData().catch(() => null)
  const plan = form?.get('plan') === 'yearly' ? 'yearly' : 'monthly'
  const priceId = process.env[PRICE_ENV[plan]]?.trim()
  if (!priceId) {
    return NextResponse.json(
      { error: `${plan} membership checkout is not configured.` },
      { status: 503 },
    )
  }

  const locale = form?.get('locale') === 'en' ? 'en' : 'ne'
  const prefix = locale === 'en' ? '/en' : ''
  try {
    const result = await getPaymentAdapter().checkout({
      priceId,
      customerEmail: session.email,
      successUrl: `${SITE_URL}${prefix}/membership?checkout=success`,
      cancelUrl: `${SITE_URL}${prefix}/membership?checkout=cancelled`,
    })
    return NextResponse.redirect(result.checkoutUrl, 303)
  } catch (error) {
    console.error('[payments] checkout creation failed', {
      userId: session.userId,
      plan,
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Membership checkout is temporarily unavailable.' },
      { status: 503 },
    )
  }
}
