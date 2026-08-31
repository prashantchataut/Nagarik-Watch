import { db } from '@/lib/db'
import { fail, ok } from '@/lib/api'
import { currentUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Beacon: mirror a story open for logged-in readers (personalization across
 * devices + profile reading history). Idempotent per story/day.
 */
export async function POST(req: Request) {
  let body: { key?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  const key = (body.key ?? '').trim()
  if (!key || key.length > 120) return fail('कथा कुञ्जी अमान्य छ।', 422)

  const me = await currentUser().catch(() => null)
  if (!me || me.kind !== 'reader') return ok({ mirrored: false })

  const day = new Date().toISOString().slice(0, 10)
  await db.readLog
    .upsert({
      where: { subject_storyKey_day: { subject: `r:${me.id}`, storyKey: key, day } },
      create: { subject: `r:${me.id}`, readerId: me.id, storyKey: key, day },
      update: {},
    })
    .catch(() => null)

  return ok({ mirrored: true })
}
