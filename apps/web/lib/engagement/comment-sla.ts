/**
 * Moderation SLA scoring for the pending-comment queue.
 *
 * The queue has always been ordered newest-first, which is the worst possible
 * order for a service commitment: the comment closest to breaching its target
 * sits at the bottom of the page, and a moderator working top-down breaches it
 * without ever seeing it. This scores each comment against a target based on
 * what kind of comment it is, and orders the queue by how close to breach it
 * sits.
 *
 * The targets are deliberately different. A flagged comment is one the triage
 * already believes may be abuse — leaving it visible while it waits is the
 * expensive failure. A first-time commenter waiting on approval is a person who
 * will assume they were silently rejected. A routine pending comment can wait a
 * working day.
 */
import type { CommentStatus } from './comment-triage'

/** Minutes a comment of each kind may wait before the desk has missed its target. */
export const COMMENT_SLA_TARGET_MINUTES = {
  flagged: 120,
  pending: 480,
  other: 1440,
} as const

/** Inside this share of the target, the desk should treat it as due now. */
const AT_RISK_FRACTION = 0.75

export type CommentSlaState = 'breached' | 'at-risk' | 'on-track'

export type CommentSlaAssessment = {
  state: CommentSlaState
  ageMinutes: number
  targetMinutes: number
  /** Negative once the target has passed. */
  minutesRemaining: number
  /** 0..1+; above 1 means breached. Sort key for the queue. */
  pressure: number
}

export type SlaComment = {
  status: CommentStatus
  createdAt: string
  /** Triage's abuse score, when the row carries one. */
  toxicityScore?: number
  spamScore?: number
}

function targetFor(comment: SlaComment): number {
  if (comment.status === 'flagged') return COMMENT_SLA_TARGET_MINUTES.flagged
  if (comment.status === 'pending') {
    // A pending comment triage already scored as risky is treated like a
    // flagged one: the difference between the two is a threshold, not a
    // difference in how long a reader should be exposed to it.
    const risk = Math.max(comment.toxicityScore ?? 0, comment.spamScore ?? 0)
    return risk >= 0.6 ? COMMENT_SLA_TARGET_MINUTES.flagged : COMMENT_SLA_TARGET_MINUTES.pending
  }
  return COMMENT_SLA_TARGET_MINUTES.other
}

export function assessCommentSla(comment: SlaComment, now = new Date()): CommentSlaAssessment {
  const created = Date.parse(comment.createdAt)
  const targetMinutes = targetFor(comment)
  if (!Number.isFinite(created)) {
    // An unparseable timestamp is a data fault, not an urgent comment. Saying
    // "on-track" for it would hide the row; saying "breached" would flood the
    // top of the queue with broken data. Treat it as neutral and visible.
    return {
      state: 'on-track',
      ageMinutes: 0,
      targetMinutes,
      minutesRemaining: targetMinutes,
      pressure: 0,
    }
  }
  const ageMinutes = Math.max(0, Math.round((now.getTime() - created) / 60_000))
  const pressure = ageMinutes / targetMinutes
  const state: CommentSlaState =
    pressure >= 1 ? 'breached' : pressure >= AT_RISK_FRACTION ? 'at-risk' : 'on-track'
  return {
    state,
    ageMinutes,
    targetMinutes,
    minutesRemaining: targetMinutes - ageMinutes,
    pressure,
  }
}

/**
 * Queue order: most pressure first, ties broken oldest-first.
 *
 * Resolved comments (approved / rejected) keep their own relative order below
 * everything still waiting — the queue's job is the work that is left.
 */
export function sortByModerationUrgency<T extends SlaComment>(
  comments: T[],
  now = new Date(),
): T[] {
  const open = (comment: SlaComment) => comment.status === 'pending' || comment.status === 'flagged'
  return [...comments].sort((a, b) => {
    if (open(a) !== open(b)) return open(a) ? -1 : 1
    if (!open(a)) return b.createdAt.localeCompare(a.createdAt)
    const pressureDelta = assessCommentSla(b, now).pressure - assessCommentSla(a, now).pressure
    if (Math.abs(pressureDelta) > 1e-9) return pressureDelta
    return a.createdAt.localeCompare(b.createdAt)
  })
}

/** Headline counts for the desk: how much of the queue is already late. */
export function commentSlaSummary(comments: SlaComment[], now = new Date()) {
  let breached = 0
  let atRisk = 0
  let open = 0
  let oldestOpenMinutes = 0
  for (const comment of comments) {
    if (comment.status !== 'pending' && comment.status !== 'flagged') continue
    open += 1
    const assessment = assessCommentSla(comment, now)
    if (assessment.state === 'breached') breached += 1
    else if (assessment.state === 'at-risk') atRisk += 1
    oldestOpenMinutes = Math.max(oldestOpenMinutes, assessment.ageMinutes)
  }
  return { open, breached, atRisk, oldestOpenMinutes }
}
