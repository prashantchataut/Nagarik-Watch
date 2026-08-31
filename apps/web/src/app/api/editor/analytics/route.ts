import { db } from '@/lib/db'
import { ok, requireEditor } from '@/lib/api'
import { stories } from '@/lib/news/data'

export const dynamic = 'force-dynamic'

function dayString(offsetDays: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

/** Editor: newsroom analytics — traffic, pipeline, audience, top stories. */
export async function GET() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const today = dayString(0)
  const week = Array.from({ length: 7 }, (_, i) => dayString(6 - i))

  const [
    todayViews,
    weekRows,
    topKeys,
    articleCounts,
    pitchCounts,
    readers,
    subscribers,
    journalists,
    commentsVisible,
    commentsHidden,
    recentSubscribers,
  ] = await Promise.all([
    db.pageview.aggregate({ where: { day: today }, _sum: { count: true } }),
    db.pageview.findMany({ where: { day: { in: week } } }),
    db.pageview.groupBy({
      by: ['storyKey'],
      where: { day: { in: week } },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: 8,
    }),
    db.article.groupBy({ by: ['status'], _count: { _all: true } }),
    db.deskPitch.groupBy({ by: ['status'], _count: { _all: true } }),
    db.reader.count(),
    db.newsletterSubscriber.count(),
    db.journalist.count(),
    db.comment.count({ where: { status: 'visible' } }),
    db.comment.count({ where: { status: 'hidden' } }),
    db.newsletterSubscriber.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
  ])

  const daily = week.map((day) => ({
    day,
    views: weekRows.filter((r) => r.day === day).reduce((n, r) => n + r.count, 0),
  }))

  const staticBySlug = new Map(stories.map((s) => [s.slug, s]))
  const dbSlugs = new Set(
    (
      await db.article.findMany({
        where: { status: 'published' },
        select: { slug: true, titleNe: true, desk: true },
      })
    ).map((a) => a.slug),
  )
  const dbArticles = await db.article.findMany({
    where: { status: 'published' },
    select: { slug: true, titleNe: true, desk: true },
  })
  const dbBySlug = new Map(dbArticles.map((a) => [a.slug, a]))

  const top = topKeys
    .map((k) => {
      const views = k._sum.count ?? 0
      const slug = k.storyKey.split('/')[1] ?? ''
      const story = staticBySlug.get(slug)
      const article = dbBySlug.get(slug)
      const title = story?.titleNe ?? article?.titleNe ?? null
      const desk = story?.desk ?? article?.desk ?? k.storyKey.split('/')[0] ?? ''
      return { storyKey: k.storyKey, views, title, desk }
    })
    .filter((t) => t.title !== null)

  const statusCount = (rows: { status: string; _count: { _all: number } }[], status: string) =>
    rows.find((r) => r.status === status)?._count._all ?? 0

  return ok({
    traffic: {
      today: todayViews._sum.count ?? 0,
      week: daily.reduce((n, d) => n + d.views, 0),
      daily,
    },
    topStories: top,
    pipeline: {
      drafts: statusCount(articleCounts, 'draft'),
      submitted: statusCount(articleCounts, 'submitted'),
      published: statusCount(articleCounts, 'published'),
      declined: statusCount(articleCounts, 'declined'),
      openPitches:
        (pitchCounts.find((p) => p.status === 'submitted')?._count._all ?? 0) +
        (pitchCounts.find((p) => p.status === 'in_review')?._count._all ?? 0),
      acceptedPitches: statusCount(pitchCounts, 'accepted'),
    },
    audience: {
      readers,
      subscribers,
      journalists,
      commentsVisible,
      commentsHidden,
    },
    recentSubscribers: recentSubscribers.map((s) => ({
      email: s.email,
      createdAt: s.createdAt.toISOString(),
    })),
    dbPublishedSlugs: [...dbSlugs],
  })
}
