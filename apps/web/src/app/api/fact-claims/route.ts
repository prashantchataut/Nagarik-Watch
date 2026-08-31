import { db } from '@/lib/db'
import { ok, fail, requireEditor, limitOr429, parseBody } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const claimSchema = z.object({
  claim: z.string().min(12, 'दाबी कम्तीमा १२ अक्षरको हुनुपर्छ।').max(600, 'दाबी ६०० अक्षरभित्र राख्नुहोस्।'),
  sourceUrl: z.string().max(400).optional().or(z.literal('')),
  email: z.string().max(200).optional().or(z.literal('')),
})

/** Public: submit a claim for the fact-check desk to verify. */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'claim', 5, 10 * 60_000)
  if (limited) return limited

  const { data, error } = await parseBody(req, claimSchema)
  if (error) return error

  await db.factClaim.create({
    data: {
      claim: data.claim.trim(),
      sourceUrl: data.sourceUrl?.trim() || null,
      email: data.email?.trim() || null,
    },
  })
  return ok({ received: true })
}

/** Editor: triage list of submitted claims. */
export async function GET() {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  const claims = await db.factClaim.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  return ok({ claims })
}

/** Editor: advance a claim status. */
export async function PATCH(req: Request) {
  const guard = await requireEditor()
  if ('error' in guard) return guard.error

  let body: { id?: string; status?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return fail('अमान्य अनुरोध।')
  }
  const id = body.id ?? ''
  const status = body.status ?? ''
  if (!id || !['new', 'reviewing', 'published'].includes(status)) {
    return fail('अमान्य निर्णय।', 422)
  }
  try {
    await db.factClaim.update({ where: { id }, data: { status } })
    return ok({ updated: true })
  } catch {
    return fail('दाबी भेटिएन।', 404)
  }
}
