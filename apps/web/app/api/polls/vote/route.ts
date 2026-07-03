import { NextResponse, type NextRequest } from 'next/server'
import { recordPollVote } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'

/**
 * POST /api/polls/vote — record a reader's poll vote. One vote per
 * fingerprint per poll. The fingerprint is an anonymous cookie set on the
 * client; logged-in readers are keyed by userId instead so they cannot
 * double-vote by clearing cookies.
 *
 * Body: { pollId, optionId, fingerprint }
 * Returns: { recorded: boolean, results: Record<optionId, count> }
 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pollId = String(body.pollId ?? '').trim()
  const optionId = String(body.optionId ?? '').trim()
  const fingerprint = String(body.fingerprint ?? '').trim()

  if (!pollId || !optionId || !fingerprint) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const session = await getSession().catch(() => null)
  const { recorded } = await recordPollVote({
    pollId,
    optionId,
    voterFingerprint: session?.userId ?? fingerprint,
    voterUserId: session?.userId,
  })

  return NextResponse.json({ recorded }, { status: recorded ? 201 : 200 })
}
