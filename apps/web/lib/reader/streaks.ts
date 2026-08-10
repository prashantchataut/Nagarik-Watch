import type { ReadingHistoryRecord } from './state'

const DAY_MS = 86_400_000

export type StreakSummary = {
  /** Consecutive completed-reading days ending today or yesterday. 0 once broken. */
  current: number
  /** Longest consecutive run found anywhere in the supplied history. */
  longest: number
  /** Local date key (YYYY-MM-DD) of the most recent completed read, if any. */
  lastCompletedDate: string | null
  /** Total distinct days with at least one completed read. */
  totalDays: number
}

export type StreakRisk = {
  /** True when the reader has an active streak that will break if they don't read again today. */
  atRisk: boolean
  /** Hours remaining (local time) before the current streak lapses. 0 when not at risk or no streak. */
  hoursRemaining: number
}

function localDateKey(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function dayKeyToUtcMs(key: string): number {
  const [year, month, day] = key.split('-').map(Number)
  return Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1)
}

/** Distinct local-date keys with at least one completed read, newest first. */
function completedDayKeys(history: ReadingHistoryRecord[]): string[] {
  const days = new Set<string>()
  for (const item of history) {
    if (!item.completed) continue
    const parsed = new Date(item.readAt)
    if (Number.isNaN(parsed.getTime())) continue
    days.add(localDateKey(parsed))
  }
  return [...days].sort((a, b) => b.localeCompare(a))
}

/**
 * Reading streaks computed only from real completed reads in
 * `ReadingHistoryRecord[]` (device history) / `nw_reading` (account history,
 * once merged into the same shape by the caller). No fabricated days.
 */
export function computeStreak(history: ReadingHistoryRecord[], now = new Date()): StreakSummary {
  const dayKeys = completedDayKeys(history)
  if (dayKeys.length === 0) {
    return { current: 0, longest: 0, lastCompletedDate: null, totalDays: 0 }
  }

  const todayKey = localDateKey(now)
  const yesterdayKey = localDateKey(new Date(now.getTime() - DAY_MS))

  let current = 0
  if (dayKeys[0] === todayKey || dayKeys[0] === yesterdayKey) {
    current = 1
    for (let i = 1; i < dayKeys.length; i += 1) {
      const gapDays = Math.round(
        (dayKeyToUtcMs(dayKeys[i - 1]!) - dayKeyToUtcMs(dayKeys[i]!)) / DAY_MS,
      )
      if (gapDays === 1) current += 1
      else break
    }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < dayKeys.length; i += 1) {
    const gapDays = Math.round(
      (dayKeyToUtcMs(dayKeys[i - 1]!) - dayKeyToUtcMs(dayKeys[i]!)) / DAY_MS,
    )
    run = gapDays === 1 ? run + 1 : 1
    longest = Math.max(longest, run)
  }

  return {
    current,
    longest: Math.max(longest, current),
    lastCompletedDate: dayKeys[0]!,
    totalDays: dayKeys.length,
  }
}

/**
 * A streak is "at risk" once the reader has an active streak but hasn't
 * completed a read yet today — it lapses at local midnight. Used for an
 * honest nudge, never a fabricated countdown.
 */
export function streakRisk(summary: StreakSummary, now = new Date()): StreakRisk {
  if (summary.current <= 0 || !summary.lastCompletedDate) {
    return { atRisk: false, hoursRemaining: 0 }
  }
  const todayKey = localDateKey(now)
  if (summary.lastCompletedDate === todayKey) {
    return { atRisk: false, hoursRemaining: 0 }
  }
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0)
  const hoursRemaining = Math.max(0, (midnight.getTime() - now.getTime()) / 3_600_000)
  return { atRisk: true, hoursRemaining: Math.round(hoursRemaining * 10) / 10 }
}
