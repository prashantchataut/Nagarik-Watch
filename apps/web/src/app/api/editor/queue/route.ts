import { db } from '@/lib/db'
import { ok, requireEditor } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Editor: the review queue — submitted articles, open pitches, recent comments. */
export async function GET() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const [articles, pitches, comments, counts] = await Promise.all([
    db.article.findMany({
      where: { status: 'submitted' },
      orderBy: { updatedAt: 'asc' },
      include: { author: { select: { name: true, desk: true } } },
    }),
    db.deskPitch.findMany({
      where: { status: { in: ['submitted', 'in_review'] } },
      orderBy: { createdAt: 'asc' },
      include: { journalist: { select: { name: true, email: true } } },
    }),
    db.comment.findMany({
      where: { status: 'visible' },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: { reader: { select: { name: true } } },
    }),
    Promise.all([
      db.article.count({ where: { status: 'draft' } }),
      db.article.count({ where: { status: 'submitted' } }),
      db.article.count({ where: { status: 'published' } }),
      db.deskPitch.count({ where: { status: { in: ['submitted', 'in_review'] } } }),
      db.comment.count({ where: { status: 'visible' } }),
    ]),
  ])

  return ok({
    articles: articles.map((a) => ({
      slug: a.slug,
      desk: a.desk,
      titleNe: a.titleNe,
      deckNe: a.deckNe,
      bodyNe: a.bodyNe,
      hero: a.hero,
      authorName: a.author.name,
      updatedAt: a.updatedAt.toISOString(),
    })),
    pitches: pitches.map((p) => ({
      id: p.id,
      headline: p.headline,
      desk: p.desk,
      summary: p.summary,
      status: p.status,
      journalistName: p.journalist.name,
      createdAt: p.createdAt.toISOString(),
    })),
    comments: comments.map((c) => ({
      id: c.id,
      storyKey: c.storyKey,
      body: c.body,
      authorName: c.authorName,
      createdAt: c.createdAt.toISOString(),
    })),
    counts: {
      drafts: counts[0],
      submitted: counts[1],
      published: counts[2],
      openPitches: counts[3],
      comments: counts[4],
    },
  })
}
