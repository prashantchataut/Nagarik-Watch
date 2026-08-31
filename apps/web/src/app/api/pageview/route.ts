import { db } from '@/lib/db'
import { limitOr429, ok, parseBody } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const viewSchema = z.object({
  key: z.string().trim().min(1).max(200),
})

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Public: pageview beacon — increments the daily counter for a storyKey
 * (works for archive stories and CMS articles alike) and the article's
 * denormalized view counter when the key points at a CMS article.
 */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'pageview', 120, 60 * 1000)
  if (limited) return limited

  const { data, error } = await parseBody(req, viewSchema)
  if (error) return error

  const day = today()
  const existing = await db.pageview.findUnique({
    where: { storyKey_day: { storyKey: data.key, day } },
    select: { id: true },
  })

  if (existing) {
    await db.pageview.update({ where: { id: existing.id }, data: { count: { increment: 1 } } })
  } else {
    await db.pageview.create({ data: { storyKey: data.key, day, count: 1 } })
  }

  const slug = data.key.split('/')[1] ?? ''
  if (slug) {
    await db.article.updateMany({ where: { slug }, data: { views: { increment: 1 } } })
  }

  return ok({ counted: true })
}
