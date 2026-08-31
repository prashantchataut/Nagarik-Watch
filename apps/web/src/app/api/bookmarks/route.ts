import { db } from '@/lib/db'
import { ok, parseBody, requireReader, limitOr429 } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const MAX_BOOKMARKS = 500

/** Reader: my server-synced saved stories. */
export async function GET() {
  const guard = await requireReader()
  if ('error' in guard) return guard.error

  const rows = await db.bookmark.findMany({
    where: { readerId: guard.reader.id },
    orderBy: { createdAt: 'desc' },
    select: { storyKey: true },
  })
  return ok({ keys: rows.map((r) => r.storyKey) })
}

const putSchema = z.object({
  keys: z.array(z.string().trim().min(1).max(200)).max(MAX_BOOKMARKS),
})

/**
 * Reader: full-list sync (the client merges localStorage + server on login,
 * then pushes the union — simple, conflict-free and idempotent).
 */
export async function PUT(req: Request) {
  const limited = limitOr429(req, 'bookmark-sync', 60, 60 * 1000)
  if (limited) return limited

  const guard = await requireReader()
  if ('error' in guard) return guard.error

  const { data, error } = await parseBody(req, putSchema)
  if (error) return error

  const keys = [...new Set(data.keys)]
  const existing = await db.bookmark.findMany({
    where: { readerId: guard.reader.id },
    select: { storyKey: true },
  })
  const existingKeys = new Set(existing.map((e) => e.storyKey))

  const toCreate = keys.filter((k) => !existingKeys.has(k))
  const toDelete = [...existingKeys].filter((k) => !keys.includes(k))

  await db.$transaction([
    ...toDelete.map((storyKey) =>
      db.bookmark.deleteMany({ where: { readerId: guard.reader.id, storyKey } }),
    ),
    ...(toCreate.length
      ? [db.bookmark.createMany({ data: toCreate.map((storyKey) => ({ readerId: guard.reader.id, storyKey })) })]
      : []),
  ])

  return ok({ keys })
}
