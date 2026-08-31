import { db } from '@/lib/db'
import { ok } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Public: the active breaking-news banner, if any. */
export async function GET() {
  const banner = await db.breakingNews.findFirst({
    where: { active: true },
    orderBy: { createdAt: 'desc' },
  })
  return ok({
    breaking: banner
      ? { id: banner.id, textNe: banner.textNe, link: banner.link, at: banner.createdAt.toISOString() }
      : null,
  })
}
