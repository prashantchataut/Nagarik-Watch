import { db } from '@/lib/db'
import { ok, fail } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * Public: serve active campaigns for a placement (highest priority first).
 * The client slot renders house ads when this returns none.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const placement = url.searchParams.get('placement') ?? ''
  const allowed = new Set(['leaderboard', 'infeed', 'sidebar', 'article_inline'])
  if (!allowed.has(placement)) return fail('अज्ञात विज्ञापन स्थान।', 400)

  const campaigns = await db.adCampaign.findMany({
    where: { placement, active: true },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 3,
    select: {
      id: true,
      name: true,
      placement: true,
      title: true,
      body: true,
      ctaLabel: true,
      link: true,
      image: true,
      accent: true,
    },
  })

  return ok({ ads: campaigns })
}
