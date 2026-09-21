import { describe, expect, it } from 'vitest'
import {
  COMMENT_SLA_TARGET_MINUTES,
  assessCommentSla,
  commentSlaSummary,
  sortByModerationUrgency,
} from './comment-sla'
import type { CommentStatus } from './comment-triage'

const NOW = new Date('2026-06-22T12:00:00Z')

function comment(
  id: string,
  status: CommentStatus,
  minutesAgo: number,
  risk?: { toxicityScore?: number; spamScore?: number },
) {
  return {
    id,
    status,
    createdAt: new Date(NOW.getTime() - minutesAgo * 60_000).toISOString(),
    ...risk,
  }
}

describe('assessCommentSla', () => {
  it('holds a flagged comment to the tighter target', () => {
    const assessment = assessCommentSla(comment('a', 'flagged', 130), NOW)
    expect(assessment.targetMinutes).toBe(COMMENT_SLA_TARGET_MINUTES.flagged)
    expect(assessment.state).toBe('breached')
    expect(assessment.minutesRemaining).toBeLessThan(0)
  })

  it('gives a routine pending comment the working-day target', () => {
    const assessment = assessCommentSla(comment('b', 'pending', 130), NOW)
    expect(assessment.targetMinutes).toBe(COMMENT_SLA_TARGET_MINUTES.pending)
    expect(assessment.state).toBe('on-track')
  })

  it('treats a pending comment triage already scored as risky like a flagged one', () => {
    const assessment = assessCommentSla(comment('c', 'pending', 130, { toxicityScore: 0.7 }), NOW)
    expect(assessment.targetMinutes).toBe(COMMENT_SLA_TARGET_MINUTES.flagged)
    expect(assessment.state).toBe('breached')
  })

  it('warns before the target rather than after it', () => {
    const assessment = assessCommentSla(comment('d', 'flagged', 100), NOW)
    expect(assessment.state).toBe('at-risk')
    expect(assessment.minutesRemaining).toBeGreaterThan(0)
  })

  it('does not report a broken timestamp as urgent', () => {
    const assessment = assessCommentSla({ status: 'pending', createdAt: 'not a date' }, NOW)
    expect(assessment.state).toBe('on-track')
    expect(assessment.pressure).toBe(0)
  })
})

describe('sortByModerationUrgency', () => {
  it('puts the comment closest to breach first, not the newest', () => {
    const queue = [
      comment('newest', 'pending', 5),
      comment('old-flagged', 'flagged', 115),
      comment('old-pending', 'pending', 400),
    ]
    expect(sortByModerationUrgency(queue, NOW).map((item) => item.id)).toEqual([
      'old-flagged',
      'old-pending',
      'newest',
    ])
  })

  it('keeps resolved comments below everything still waiting', () => {
    const queue = [
      comment('approved', 'approved', 1),
      comment('pending', 'pending', 600),
      comment('rejected', 'rejected', 2),
    ]
    const [first] = sortByModerationUrgency(queue, NOW)
    expect(first?.id).toBe('pending')
  })

  it('does not mutate the queue it was handed', () => {
    const queue = [comment('a', 'pending', 5), comment('b', 'flagged', 600)]
    const order = queue.map((item) => item.id)
    sortByModerationUrgency(queue, NOW)
    expect(queue.map((item) => item.id)).toEqual(order)
  })
})

describe('commentSlaSummary', () => {
  it('counts only the work that is left', () => {
    const summary = commentSlaSummary(
      [
        comment('a', 'flagged', 200),
        comment('b', 'pending', 400),
        comment('c', 'pending', 5),
        comment('d', 'approved', 5_000),
      ],
      NOW,
    )
    expect(summary).toEqual({ open: 3, breached: 1, atRisk: 1, oldestOpenMinutes: 400 })
  })
})
