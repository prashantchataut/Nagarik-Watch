import { db } from '@/lib/db'
import { ok, fail, limitOr429 } from '@/lib/api'
import { currentUser } from '@/lib/auth'
import { clientIp } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

const DEFAULT_FREE_LIMIT = 8

function subjectFor(req: Request, readerId: string | null, cookieAnon: string | null): string | null {
  if (readerId) return `r:${readerId}`
  const url = new URL(req.url)
  const anon = url.searchParams.get('anon') ?? cookieAnon
  return anon ? `a:${anon}` : null
}

/** Read the free-article limit (editor-tunable via SiteSetting). */
async function freeLimit(): Promise<number> {
  const setting = await db.siteSetting
    .findUnique({ where: { key: 'paywall_free_limit' } })
    .catch(() => null)
  const parsed = setting ? Number(setting.value) : NaN
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_FREE_LIMIT
}

/** Subject cookie so anonymous metering survives page reloads. */
function anonCookie(): string | null {
  // The client sends ?anon=<uuid> on GET; on POST we read it from the body.
  return null
}

/**
 * GET: current meter + subscription state for this reader/visitor.
 * Query: ?anon=<device key> (anonymous) or session cookie (logged in).
 */
export async function GET(req: Request) {
  const me = await currentUser().catch(() => null)
  const reader = me && me.kind === 'reader' ? me : null
  const subject = subjectFor(req, reader?.id ?? null, null)

  const limit = await freeLimit()
  if (!subject) {
    return ok({ freeLimit: limit, used: 0, subscribed: false, plan: null, reasonNe: null })
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  const monthStartDay = monthStart.toISOString().slice(0, 10)

  const [usedEvents, subscription] = await Promise.all([
    db.paywallEvent.findMany({
      where: { subject, day: { gte: monthStartDay } },
      select: { storyKey: true },
    }),
    reader
      ? db.subscription.findFirst({
          where: { readerId: reader.id, status: 'active' },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve(null),
  ])

  const used = new Set(usedEvents.map((e) => e.storyKey)).size
  const subscribed = subscription !== null
  const remaining = subscribed ? limit : Math.max(0, limit - used)

  let reasonNe: string | null = null
  if (!subscribed && used >= limit) {
    reasonNe = 'यस महिनाको निःशुल्क सीमा सकियो।'
  }

  return ok({
    freeLimit: limit,
    used,
    subscribed,
    plan: subscription?.plan ?? null,
    reasonNe,
  })
}

/**
 * POST: record one metered article open {storyKey, anon?}.
 * Idempotent per story/day; server-side enforcement source of truth.
 */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'paywall', 40, 60_000)
  if (limited) return limited

  let body: { storyKey?: string; anon?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  const storyKey = (body.storyKey ?? '').trim()
  if (!storyKey || storyKey.length > 120) return fail('कथा कुञ्जी अमान्य छ।', 422)

  const me = await currentUser().catch(() => null)
  const reader = me && me.kind === 'reader' ? me : null
  const subject = reader ? `r:${reader.id}` : body.anon ? `a:${body.anon}` : null
  if (!subject) return fail('पहिचान चाहियो।', 422)

  const day = new Date().toISOString().slice(0, 10)
  await db.paywallEvent
    .upsert({
      where: { subject_storyKey_day: { subject, storyKey, day } },
      create: { subject, storyKey, day },
      update: {},
    })
    .catch(() => null)

  const limit = await freeLimit()
  const monthStart = new Date()
  monthStart.setUTCDate(1)
  const monthStartDay = monthStart.toISOString().slice(0, 10)

  const [usedEvents, subscription] = await Promise.all([
    db.paywallEvent.findMany({
      where: { subject, day: { gte: monthStartDay } },
      select: { storyKey: true },
    }),
    reader
      ? db.subscription.findFirst({
          where: { readerId: reader.id, status: 'active' },
          orderBy: { createdAt: 'desc' },
        })
      : Promise.resolve(null),
  ])

  const used = new Set(usedEvents.map((e) => e.storyKey)).size
  const subscribed = subscription !== null
  const blocked = !subscribed && used > limit

  return ok({
    freeLimit: limit,
    used,
    subscribed,
    plan: subscription?.plan ?? null,
    blocked,
    reasonNe: blocked ? 'निःशुल्क सीमा नाघ्यो — सदस्यता चाहियो।' : null,
  })
}
