import { db } from '@/lib/db'
import { ok, fail, limitOr429 } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Beacon: count one ad click-through (called only when consent allows). */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'ads-click', 30, 60_000)
  if (limited) return limited

  let id = ''
  try {
    const body = (await req.json()) as { id?: string }
    id = body.id ?? ''
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  if (!id) return fail('क्याम्पेन आईडी चाहियो।', 422)

  try {
    await db.adCampaign.update({ where: { id }, data: { clicks: { increment: 1 } } })
  } catch {
    return fail('क्याम्पेन भेटिएन।', 404)
  }
  return ok({})
}
