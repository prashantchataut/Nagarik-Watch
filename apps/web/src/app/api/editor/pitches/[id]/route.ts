import { db } from '@/lib/db'
import { fail, ok, parseBody, requireEditor } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

const patchSchema = z.object({
  status: z.enum(['in_review', 'accepted', 'declined'], {
    message: 'अमान्य स्थिति।',
  }),
  editorNote: z.string().trim().max(600).optional(),
})

/** Editor: review a pitch — move to in_review, accept or decline with a note. */
export async function PATCH(req: Request, ctx: Ctx) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const { id } = await ctx.params
  const pitch = await db.deskPitch.findUnique({ where: { id } })
  if (!pitch) return fail('पिच भेटिएन।', 404)

  const { data, error } = await parseBody(req, patchSchema)
  if (error) return error

  await db.deskPitch.update({
    where: { id },
    data: { status: data.status, editorNote: data.editorNote ?? pitch.editorNote },
  })
  return ok({ status: data.status })
}
