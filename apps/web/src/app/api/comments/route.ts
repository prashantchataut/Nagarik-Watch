import { db } from '@/lib/db'
import { ok, parseBody, requireReader, limitOr429 } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

/** Public: visible comments for one story, keyed "desk/slug". */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const key = url.searchParams.get('key') ?? ''
  if (!key || key.length > 200) return ok({ comments: [], total: 0 })

  const rows = await db.comment.findMany({
    where: { storyKey: key, status: 'visible' },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return ok({
    comments: rows.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      body: c.body,
      createdAt: c.createdAt.toISOString(),
    })),
    total: rows.length,
  })
}

const postSchema = z.object({
  key: z.string().trim().min(1, 'कुनै समाचार छानिएको छैन।').max(200),
  body: z
    .string()
    .trim()
    .min(3, 'प्रतिक्रिया कम्तीमा ३ अक्षरको हुनुपर्छ।')
    .max(1000, 'प्रतिक्रिया १००० अक्षरभित्र राख्नुहोस्।'),
})

/** Reader: post a comment (moderated after publication; editors can hide). */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'comment', 5, 10 * 60 * 1000)
  if (limited) return limited

  const guard = await requireReader()
  if ('error' in guard) return guard.error

  const { data, error } = await parseBody(req, postSchema)
  if (error) return error

  const comment = await db.comment.create({
    data: {
      storyKey: data.key,
      readerId: guard.reader.id,
      authorName: guard.reader.name,
      body: data.body,
      status: 'visible',
    },
  })
  return ok({
    comment: {
      id: comment.id,
      authorName: comment.authorName,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
    },
  })
}
