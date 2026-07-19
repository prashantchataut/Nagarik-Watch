import { NextResponse, type NextRequest } from 'next/server'
import { getPaymentAdapter } from '@/lib/payments/adapter'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const result = await getPaymentAdapter().webhook(request)
    return NextResponse.json({ ok: true, ...result })
  } catch (error) {
    console.error('[payments] Stripe webhook rejected', {
      error: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      { error: 'Webhook verification or processing failed.' },
      { status: 400 },
    )
  }
}
