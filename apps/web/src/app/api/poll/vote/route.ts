import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { fail, ok, parseBody, limitOr429 } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const voteSchema = z.object({
  pollId: z.string().min(1),
  optionId: z.string().min(1, 'विकल्प छान्नुहोस्।'),
  voterKey: z.string().trim().max(80).optional().or(z.literal('')),
})

/**
 * Vote in the poll of the day — one vote per person per poll.
 * Logged-in readers vote by account; anonymous visitors by their device key.
 */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'poll-vote', 20, 60 * 1000)
  if (limited) return limited

  const { data, error } = await parseBody(req, voteSchema)
  if (error) return error

  const poll = await db.poll.findUnique({ where: { id: data.pollId } })
  if (!poll || !poll.active) return fail('यो मतदान बन्द भइसकेको छ।', 404)

  let options: { id: string }[] = []
  try {
    options = JSON.parse(poll.options) as { id: string }[]
  } catch {
    options = []
  }
  if (!options.some((o) => o.id === data.optionId)) return fail('अमान्य विकल्प।', 422)

  const me = await currentUser()
  const voterKey = me?.kind === 'reader' ? me.id : data.voterKey
  if (!voterKey) return fail('मतदाता पहिचान आवश्यक छ।', 422)

  const existing = await db.pollVote.findUnique({
    where: { pollId_voterKey: { pollId: poll.id, voterKey } },
  })
  if (existing) return fail('तपाईंले यो मतदानमा पहिले नै मत दिनुभएको छ।', 409)

  await db.pollVote.create({
    data: {
      pollId: poll.id,
      optionId: data.optionId,
      voterKey,
      readerId: me?.kind === 'reader' ? me.id : null,
    },
  })

  const votes = await db.pollVote.groupBy({
    by: ['optionId'],
    where: { pollId: poll.id },
    _count: { _all: true },
  })
  const counts = new Map(votes.map((v) => [v.optionId, v._count._all]))

  let optionsFull: { id: string; label: string }[] = []
  try {
    optionsFull = JSON.parse(poll.options) as { id: string; label: string }[]
  } catch {
    optionsFull = []
  }

  return ok({
    poll: {
      id: poll.id,
      question: poll.question,
      options: optionsFull.map((o) => ({ ...o, votes: counts.get(o.id) ?? 0 })),
      totalVotes: votes.reduce((n, v) => n + v._count._all, 0),
      myVote: data.optionId,
    },
  })
}
