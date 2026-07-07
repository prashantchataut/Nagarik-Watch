import { NextResponse, type NextRequest } from 'next/server'
import { SITE_URL } from '@/lib/site'
import { confirmSubscriber, getPendingSubscriber, removePendingSubscriber } from '../store'

export const dynamic = 'force-dynamic'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000

/**
 * GET /api/newsletter/confirm?token=… — confirm a double-opt-in subscription.
 *
 * Next.js resolves `/api/newsletter/confirm` to this file (NOT to the GET
 * export of `subscribe/route.ts`), so the confirm handler must live here in
 * its own route file. The pending/confirmed sets are shared with the
 * subscribe route via `getSubscriberStore()`.
 *
 * Flow:
 *   1. Reader clicks the confirm link in the email (token in query string).
 *   2. We look up the pending entry, reject if missing or expired (>24h).
 *   3. Move the email to confirmed, delete the pending token.
 *   4. Redirect to the locale-aware confirmation page.
 */
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const pending = await getPendingSubscriber(token)

  if (!pending) {
    return NextResponse.json(
      { error: 'Invalid or expired token.' },
      { status: 400 },
    )
  }
  if (Date.now() - pending.createdAt > TOKEN_TTL_MS) {
    await removePendingSubscriber(token)
    return NextResponse.json(
      { error: 'Token expired. Please subscribe again.' },
      { status: 410 },
    )
  }

  await confirmSubscriber(token)

  return NextResponse.redirect(`${SITE_URL}/newsletter-confirmed`)
}
