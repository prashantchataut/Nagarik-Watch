import { db } from '@/lib/db'
import { ok } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Public: most-read story keys over the last 7 days ("धेरै पढिएको"). */
export async function GET() {
  const since = new Date()
  since.setUTCDate(since.getUTCDate() - 7)
  const days = new Set<string>()
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setUTCDate(d.getUTCDate() - i)
    days.add(d.toISOString().slice(0, 10))
  }

  const rows = await db.pageview.groupBy({
    by: ['storyKey'],
    where: { day: { in: [...days] } },
    _sum: { count: true },
    orderBy: { _sum: { count: 'desc' } },
    take: 8,
  })

  return ok({
    trending: rows.map((r) => ({ storyKey: r.storyKey, views: r._sum.count ?? 0 })),
  })
}
