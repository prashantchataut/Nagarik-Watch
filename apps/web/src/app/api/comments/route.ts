import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { fail, ok, parseBody, requireJournalist } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status: z.enum(['visible', 'hidden'], { message: 'अमान्य स्थिति।' }),
})

/** Editor: moderate a comment (hide / restore). */
export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireJournalist()
  if ('error' in guard) return guard.error
  if (guard.journalist.role !== 'editor') return fail('प्रतिक्रिया नियन्त्रण सम्पादकको अधिकार हो।', 403)

  const { id } = await ctx.params
  const { data, error } = await parseBody(req, patchSchema)
  if (error) return error

  const updated = await db.comment.updateMany({ where: { id }, data: { status: data.status } })
  if (!updated.count) return fail('प्रतिक्रिया भेटिएन।', 404)
  return ok({ status: data.status })
}

/** Reader deletes own comment; editors may delete any. */
export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params
  const me = await currentUser()

  const comment = await db.comment.findUnique({ where: { id } })
  if (!comment) return fail('प्रतिक्रिया भेटिएन।', 404)

  const isOwn = me?.kind === 'reader' && me.id === comment.readerId
  const isEditor = me?.kind === 'journalist' && me.role === 'editor'
  if (!isOwn && !isEditor) return fail('मेट्ने अनुमति छैन।', 403)

  await db.comment.delete({ where: { id } })
  return ok({ deleted: true })
}
