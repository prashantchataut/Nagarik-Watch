import { describe, expect, it } from 'vitest'
import { computeStreak, streakRisk } from './streaks'
import type { ReadingHistoryRecord } from './state'

function read(readAt: string, completed = true): ReadingHistoryRecord {
  return {
    articleId: readAt,
    slug: readAt,
    categorySlug: 'news',
    title: 'Story',
    href: '/news/story',
    readAt,
    firstReadAt: readAt,
    scrollDepth: completed ? 100 : 40,
    completed,
    sessions: 1,
    dwellSeconds: 60,
  }
}

describe('computeStreak', () => {
  it('returns zeros for empty or all-unfinished history', () => {
    expect(computeStreak([])).toEqual({ current: 0, longest: 0, lastCompletedDate: null, totalDays: 0 })
    expect(computeStreak([read('2026-07-18T08:00:00', false)])).toEqual({
      current: 0,
      longest: 0,
      lastCompletedDate: null,
      totalDays: 0,
    })
  })

  it('counts a consecutive run ending today', () => {
    const now = new Date('2026-07-18T20:00:00')
    const summary = computeStreak(
      [
        read('2026-07-16T08:00:00'),
        read('2026-07-17T08:00:00'),
        read('2026-07-18T08:00:00'),
      ],
      now,
    )
    expect(summary.current).toBe(3)
    expect(summary.longest).toBe(3)
    expect(summary.lastCompletedDate).toBe('2026-07-18')
    expect(summary.totalDays).toBe(3)
  })

  it('still counts a run ending yesterday (grace before it breaks)', () => {
    const now = new Date('2026-07-18T06:00:00')
    const summary = computeStreak([read('2026-07-16T08:00:00'), read('2026-07-17T08:00:00')], now)
    expect(summary.current).toBe(2)
  })

  it('resets current streak once a day is skipped, but keeps longest', () => {
    const now = new Date('2026-07-18T20:00:00')
    const summary = computeStreak(
      [
        read('2026-07-01T08:00:00'),
        read('2026-07-02T08:00:00'),
        read('2026-07-03T08:00:00'),
        read('2026-07-04T08:00:00'),
        // gap
        read('2026-07-18T08:00:00'),
      ],
      now,
    )
    expect(summary.current).toBe(1)
    expect(summary.longest).toBe(4)
  })

  it('does not double-count multiple completed reads on the same day', () => {
    const now = new Date('2026-07-18T20:00:00')
    const summary = computeStreak(
      [read('2026-07-18T08:00:00'), read('2026-07-18T09:00:00'), read('2026-07-18T10:00:00')],
      now,
    )
    expect(summary.current).toBe(1)
    expect(summary.totalDays).toBe(1)
  })
})

describe('streakRisk', () => {
  it('is not at risk when there is no streak', () => {
    expect(streakRisk({ current: 0, longest: 0, lastCompletedDate: null, totalDays: 0 })).toEqual({
      atRisk: false,
      hoursRemaining: 0,
    })
  })

  it('is not at risk once today already has a completed read', () => {
    const now = new Date('2026-07-18T15:00:00')
    const summary = { current: 3, longest: 3, lastCompletedDate: '2026-07-18', totalDays: 3 }
    expect(streakRisk(summary, now)).toEqual({ atRisk: false, hoursRemaining: 0 })
  })

  it('is at risk with hours remaining until local midnight when today has no read yet', () => {
    const now = new Date('2026-07-18T20:00:00')
    const summary = { current: 3, longest: 3, lastCompletedDate: '2026-07-17', totalDays: 3 }
    const risk = streakRisk(summary, now)
    expect(risk.atRisk).toBe(true)
    expect(risk.hoursRemaining).toBeCloseTo(4, 0)
  })
})
