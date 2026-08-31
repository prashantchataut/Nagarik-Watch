import { db } from '@/lib/db'
import { ok, fail, requireReader, requireEditor, limitOr429 } from '@/lib/api'

export const dynamic = 'force-dynamic'

export const PLANS: Record<string, { labelNe: string; priceNpr: number; months: number; noteNe: string }> = {
  monthly: { labelNe: 'मासिक', priceNpr: 300, months: 1, noteNe: 'हरेक महिना नवीकरण; जहिले पनि रद्द गर्न सकिन्छ।' },
  yearly: { labelNe: 'वार्षिक', priceNpr: 2500, months: 12, noteNe: 'दुई महिना निःशुल्क; एक तिर्ने।' },
  patron: { labelNe: 'संरक्षक', priceNpr: 5000, months: 12, noteNe: 'संरक्षक समुदाय — नाम आभार पृष्ठमा।' },
}

/** Public: plan menu. */
export async function GET(req: Request) {
  const url = new URL(req.url)
  if (url.searchParams.get('list') === 'all') {
    const guard = await requireEditor()
    if ('error' in guard) return guard.error
    const [subs, readers] = await Promise.all([
      db.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: { reader: { select: { email: true, name: true } } },
      }),
      db.reader.count(),
    ])
    return ok({
      subscriptions: subs.map((s) => ({
        id: s.id,
        plan: s.plan,
        status: s.status,
        method: s.method,
        priceNpr: s.priceNpr,
        startedAt: s.startedAt,
        renewsAt: s.renewsAt,
        readerEmail: s.reader.email,
        readerName: s.reader.name,
      })),
      totalReaders: readers,
      activeCount: subs.filter((s) => s.status === 'active').length,
    })
  }
  return ok({ plans: PLANS })
}

/** Reader: start a subscription. method=demo is the sandbox checkout;
 *  esewa/khalti are placeholders for gateway wiring (documented in the guide). */
export async function POST(req: Request) {
  const guard = await requireReader()
  if ('error' in guard) return guard.error

  const limited = limitOr429(req, 'subscribe', 6, 60_000)
  if (limited) return limited

  let body: { plan?: string; method?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  const plan = body.plan ?? ''
  const method = body.method ?? 'demo'
  const meta = PLANS[plan]
  if (!meta) return fail('अज्ञात योजना।', 422)
  if (!['demo', 'esewa', 'khalti', 'bank'].includes(method)) return fail('अज्ञात भुक्तानी विधि।', 422)

  const existing = await db.subscription.findFirst({
    where: { readerId: guard.reader.id, status: 'active' },
  })
  if (existing) return fail('तपाईं पहिले नै सक्रिय सदस्य हुनुहुन्छ।', 409)

  const renewsAt = new Date()
  renewsAt.setUTCMonth(renewsAt.getUTCMonth() + meta.months)

  await db.subscription.create({
    data: {
      readerId: guard.reader.id,
      plan,
      status: 'active',
      method,
      priceNpr: meta.priceNpr,
      renewsAt,
    },
  })
  return ok({ plan, priceNpr: meta.priceNpr, renewsAt: renewsAt.toISOString() })
}

/** Reader: cancel own subscription. */
export async function DELETE() {
  const guard = await requireReader()
  if ('error' in guard) return guard.error

  const active = await db.subscription.findFirst({
    where: { readerId: guard.reader.id, status: 'active' },
  })
  if (!active) return fail('सक्रिय सदस्यता भेटिएन।', 404)

  await db.subscription.update({
    where: { id: active.id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })
  return ok({ cancelled: true })
}
