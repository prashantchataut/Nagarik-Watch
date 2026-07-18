import type { ReadingHistoryRecord } from './state'

const DAY_MS = 86_400_000

export type ReadingDay = {
  date: string
  completed: number
}

function localDateKey(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function completedReadingDays(
  history: ReadingHistoryRecord[],
  now = new Date(),
  days = 14,
): ReadingDay[] {
  const counts = new Map<string, number>()
  for (const item of history) {
    if (!item.completed) continue
    const key = localDateKey(new Date(item.readAt))
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now)
    date.setHours(12, 0, 0, 0)
    date.setDate(date.getDate() - (days - index - 1))
    const key = localDateKey(date)
    return { date: key, completed: counts.get(key) ?? 0 }
  })
}

export function currentReadingStreak(days: ReadingDay[]): number {
  let streak = 0
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if ((days[index]?.completed ?? 0) === 0) {
      if (index === days.length - 1) continue
      break
    }
    streak += 1
  }
  return streak
}

export function canShowWeeklyFeedback(lastShown: string | null, now = Date.now()) {
  if (!lastShown) return true
  const shownAt = Date.parse(lastShown)
  return !Number.isFinite(shownAt) || now - shownAt >= 7 * DAY_MS
}
