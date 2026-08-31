import { db } from '@/lib/db'
import { ok, fail, requireEditor, limitOr429 } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Editor: list all campaigns with performance counters. */
export async function GET() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const campaigns = await db.adCampaign.findMany({
    orderBy: [{ placement: 'asc' }, { priority: 'desc' }, { createdAt: 'desc' }],
  })
  return ok({ campaigns })
}

const PLACEMENTS = new Set(['leaderboard', 'infeed', 'sidebar', 'article_inline'])

/** Editor: create a campaign. */
export async function POST(req: Request) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const limited = limitOr429(req, 'ads-create', 20, 60_000)
  if (limited) return limited

  let body: {
    name?: string
    placement?: string
    title?: string
    body?: string
    ctaLabel?: string
    link?: string
    image?: string
    accent?: string
    priority?: number
  }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }

  const name = body.name?.trim() ?? ''
  const placement = body.placement ?? ''
  const title = body.title?.trim() ?? ''
  if (!name) return fail('क्याम्पेनको नाम चाहियो।', 422)
  if (!PLACEMENTS.has(placement)) return fail('विज्ञापन स्थान अमान्य छ।', 422)
  if (!title) return fail('शीर्षक (नेपाली पाठ) चाहियो।', 422)
  if (body.link && !/^https?:\/\//.test(body.link)) return fail('लिङ्क https:// वा http:// ले सुरु हुनुपर्छ।', 422)

  const campaign = await db.adCampaign.create({
    data: {
      name,
      placement,
      title,
      body: body.body?.trim() || null,
      ctaLabel: body.ctaLabel?.trim() || null,
      link: body.link?.trim() || null,
      image: body.image?.trim() || null,
      accent: body.accent === 'ink' ? 'ink' : 'crimson',
      priority: Number.isFinite(body.priority) ? Math.max(-10, Math.min(10, Number(body.priority))) : 0,
    },
  })
  return ok({ campaign })
}

/** Editor: toggle active/priority or delete a campaign. */
export async function PATCH(req: Request) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  let body: { id?: string; active?: boolean; priority?: number; delete?: boolean }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  const id = body.id ?? ''
  if (!id) return fail('क्याम्पेन आईडी चाहियो।', 422)

  if (body.delete) {
    await db.adCampaign.delete({ where: { id } }).catch(() => null)
    return ok({ deleted: true })
  }

  const data: { active?: boolean; priority?: number } = {}
  if (typeof body.active === 'boolean') data.active = body.active
  if (Number.isFinite(body.priority)) data.priority = Math.max(-10, Math.min(10, Number(body.priority)))
  if (Object.keys(data).length === 0) return fail('परिवर्तन पठाइएन।', 422)

  try {
    const campaign = await db.adCampaign.update({ where: { id }, data })
    return ok({ campaign })
  } catch {
    return fail('क्याम्पेन भेटिएन।', 404)
  }
}
