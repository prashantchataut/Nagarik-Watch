import { db } from '@/lib/db'
import { currentUser } from '@/lib/auth'
import { ok } from '@/lib/api'

export const dynamic = 'force-dynamic'

interface PollOption {
  id: string
  label: string
}

/**
 * Public: the active poll with live server-side counts.
 * `myVote` is resolved for logged-in readers (by reader id) and anonymous
 * visitors (by the client-generated voterKey query param).
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const voterKey = url.searchParams.get('voterKey') ?? ''

  const poll = await db.poll.findFirst({ where: { active: true }, orderBy: { createdAt: 'desc' } })
  if (!poll) return ok({ poll: null })

  let options: PollOption[] = []
  try {
    options = JSON.parse(poll.options) as PollOption[]
  } catch {
    options = []
  }

  const votes = await db.pollVote.groupBy({
    by: ['optionId'],
    where: { pollId: poll.id },
    _count: { _all: true },
  })
  const counts = new Map(votes.map((v) => [v.optionId, v._count._all]))
  const totalVotes = votes.reduce((n, v) => n + v._count._all, 0)

  let myVote: string | null = null
  const me = await currentUser()
  if (me?.kind === 'reader') {
    const mine = await db.pollVote.findUnique({
      where: { pollId_voterKey: { pollId: poll.id, voterKey: me.id } },
      select: { optionId: true },
    })
    myVote = mine?.optionId ?? null
  } else if (voterKey) {
    const mine = await db.pollVote.findUnique({
      where: { pollId_voterKey: { pollId: poll.id, voterKey } },
      select: { optionId: true },
    })
    myVote = mine?.optionId ?? null
  }

  return ok({
    poll: {
      id: poll.id,
      question: poll.question,
      options: options.map((o) => ({ ...o, votes: counts.get(o.id) ?? 0 })),
      totalVotes,
      myVote,
    },
  })
}
