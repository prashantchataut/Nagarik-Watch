import { db } from '@/lib/db'
import { ok } from '@/lib/api'

export const dynamic = 'force-dynamic'

/**
 * Public: view counts for story keys (Pageview sums + CMS Article.views).
 * GET ?keys=desk/slug,desk/slug  (max 40 keys)
 * Used by article headers, feed cards and the trending rail numbers.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const keysParam = url.searchParams.get('keys') ?? ''
  const keys = keysParam.split(',').map((k) => k.trim()).filter(Boolean).slice(0, 40)
  if (keys.length === 0) return ok({ views: {} })

  const rows = await db.pageview.groupBy({
    by: ['storyKey'],
    where: { storyKey: { in: keys } },
    _sum: { count: true },
  })
  const cms = await db.article.findMany({
    where: { slug: { in: keys.map((k) => k.split('/')[1] ?? '').filter(Boolean) } },
    select: { slug: true, views: true, desk: true },
  })
  const cmsMap = new Map(cms.map((a) => [`${a.desk}/${a.slug}`, a.views]))
  const out: Record<string, number> = {}
  for (const k of keys) {
    out[k] = (cmsMap.get(k) ?? 0) + (rows.find((r) => r.storyKey === k)?._sum.count ?? 0)
  }
  return ok({ views: out })
}
