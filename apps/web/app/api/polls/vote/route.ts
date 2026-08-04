import { NextResponse, type NextRequest } from 'next/server'
import { isTrustedWriteRequest } from '@/lib/security/origin'
import { recordPollVote } from '@/lib/engagement/store'
import { getSession } from '@/lib/auth/session'
import { getPollForVoting } from '@/lib/polls-admin'
import { clientIp, enforceRateLimit } from '@/lib/rate-limit'
import { getCaptchaState, verifyTurnstileToken } from '@/lib/security/turnstile'

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
  if (!isTrustedWriteRequest(request)) {
    return NextResponse.json({ error: 'Cross-site request rejected.' }, { status: 403 })
  }
  const limited = await enforceRateLimit(request, 'poll-vote', 20, 60 * 60_000)
  if (limited) return limited

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const pollId = String(body.pollId ?? '').trim()
  const optionId = String(body.optionId ?? '').trim()
  const fingerprint = String(body.fingerprint ?? '').trim()
  const turnstileToken = String(body.turnstileToken ?? '').trim()

  if (!pollId || !/^\d+$/.test(optionId) || !fingerprint || fingerprint.length > 160) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (getCaptchaState().enabled) {
    const captcha = await verifyTurnstileToken(turnstileToken, clientIp(request))
    if (!captcha.success) {
      return NextResponse.json({ error: 'Captcha verification failed.' }, { status: 400 })
    }
  }

  const poll = await getPollForVoting(pollId)
  if (!poll || !poll.options[Number(optionId)]) {
    return NextResponse.json({ error: 'Poll or option is not open for voting.' }, { status: 404 })
  }

  const session = await getSession().catch(() => null)
  const { recorded, results } = await recordPollVote({
    pollId,
    optionId,
    voterFingerprint: session?.userId ?? fingerprint,
    voterUserId: session?.userId,
  })

  return NextResponse.json({ recorded, results }, { status: recorded ? 201 : 200 })
}
