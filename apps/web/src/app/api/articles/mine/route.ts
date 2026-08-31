import { db } from '@/lib/db'
import { ok, requireJournalist } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Journalist: all of my own articles, every status, newest first. */
export async function GET() {
  const guard = await requireJournalist()
  if ('error' in guard) return guard.error

  const rows = await db.article.findMany({
    where: { authorId: guard.journalist.id },
    orderBy: { updatedAt: 'desc' },
    include: { author: { select: { name: true } } },
  })

  const mine = rows.map((a) => ({
    slug: a.slug,
    desk: a.desk,
    titleNe: a.titleNe,
    deckNe: a.deckNe,
    status: a.status,
    editorNote: a.editorNote,
    publishedAt: a.publishedAt?.toISOString() ?? null,
    updatedAt: a.updatedAt.toISOString(),
    views: a.views,
  }))
  return ok({ articles: mine })
}
