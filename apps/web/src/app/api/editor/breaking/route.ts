import { db } from '@/lib/db'
import { ok, parseBody, requireEditor } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const putSchema = z.object({
  textNe: z.string().trim().min(5, 'तत्काल समाचारका लागि पाठ आवश्यक छ।').max(240),
  link: z
    .string()
    .trim()
    .max(300)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^#?\/?[\w\u0900-\u097F\-/.]+/.test(v), 'लिंक अमान्य छ।'),
})

/** Editor: set the breaking-news banner (replaces the current one). */
export async function PUT(req: Request) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const { data, error } = await parseBody(req, putSchema)
  if (error) return error

  await db.breakingNews.updateMany({ where: { active: true }, data: { active: false } })
  const banner = await db.breakingNews.create({
    data: { textNe: data.textNe, link: data.link || null, active: true },
  })
  return ok({
    breaking: { id: banner.id, textNe: banner.textNe, link: banner.link, active: true },
  })
}

/** Editor: clear the breaking-news banner. */
export async function DELETE() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error
  await db.breakingNews.updateMany({ where: { active: true }, data: { active: false } })
  return ok({ cleared: true })
}
