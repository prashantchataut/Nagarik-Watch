import { describe, expect, it } from 'vitest'
import { canShowWeeklyFeedback, completedReadingDays, currentReadingStreak } from './retention'
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

describe('reader retention timing', () => {
  it('builds completion days and a streak without counting unfinished reads', () => {
    const now = new Date('2026-07-18T12:00:00')
    const days = completedReadingDays(
      [
        read('2026-07-16T08:00:00'),
        read('2026-07-17T08:00:00'),
        read('2026-07-18T08:00:00'),
        read('2026-07-18T09:00:00', false),
      ],
      now,
      4,
    )
    expect(days.map((day) => day.completed)).toEqual([0, 1, 1, 1])
    expect(currentReadingStreak(days)).toBe(3)
  })

  it('caps completion feedback at once per week', () => {
    const now = Date.parse('2026-07-18T12:00:00Z')
    expect(canShowWeeklyFeedback(null, now)).toBe(true)
    expect(canShowWeeklyFeedback('2026-07-12T12:00:00Z', now)).toBe(false)
    expect(canShowWeeklyFeedback('2026-07-11T11:59:59Z', now)).toBe(true)
  })
})
