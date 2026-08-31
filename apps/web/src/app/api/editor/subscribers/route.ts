import { db } from '@/lib/db'
import { ok, requireEditor } from '@/lib/api'

export const dynamic = 'force-dynamic'

/** Editor: साँझ ब्रिफिङ subscriber list (optionally as CSV download). */
export async function GET(req: Request) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const url = new URL(req.url)
  const rows = await db.newsletterSubscriber.findMany({
    orderBy: { createdAt: 'desc' },
    take: 1000,
  })

  if (url.searchParams.get('format') === 'csv') {
    const csv = [
      'email,subscribed_at',
      ...rows.map((r) => `${r.email},${r.createdAt.toISOString()}`),
    ].join('\n')
    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="nagarik-watch-subscribers.csv"',
      },
    })
  }

  return ok({
    subscribers: rows.map((r) => ({ email: r.email, createdAt: r.createdAt.toISOString() })),
  })
}
