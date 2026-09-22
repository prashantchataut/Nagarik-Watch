/** Declared here rather than in the `server-only` store so both sides can use it. */
export type CommentStatus = 'pending' | 'approved' | 'rejected' | 'flagged'

/**
 * What a burst of individually-polite comments should do to the queue.
 *
 * Text-level moderation reads one comment at a time, so it cannot see a flood:
 * ten clean comments in four minutes from an account with a bad history look
 * like ten fine comments. `trollRiskScore` sees the pattern, and this decides
 * what the newsroom does about it.
 *
 * The rule is deliberately conservative. A high troll score never rejects and
 * never hides — those are text-level verdicts, made on what was actually
 * written, and they win outright. All this does is move a comment out of the
 * undifferentiated pending queue into `flagged`, which the moderation desk
 * sorts first. A moderator still makes every call.
 */
export const TROLL_ESCALATION_THRESHOLD = 0.6

export type TrollSignal = { score: number; flags: string[] }

export type CommentTriage = {
  status: CommentStatus
  flags: string[]
  escalated: boolean
}

export function triageComment(
  textVerdictStatus: CommentStatus,
  textFlags: readonly string[],
  troll: TrollSignal | null,
): CommentTriage {
  const escalated = Boolean(troll && troll.score >= TROLL_ESCALATION_THRESHOLD)
  if (!escalated || !troll) {
    return { status: textVerdictStatus, flags: [...textFlags], escalated: false }
  }
  return {
    // Already rejected or hidden on the text? Leave it there — escalating a
    // rejection to "flagged" would quietly un-reject it.
    status: textVerdictStatus === 'pending' ? 'flagged' : textVerdictStatus,
    flags: [...textFlags, 'troll_risk', ...troll.flags],
    escalated: true,
  }
}
