/**
 * Consecutive green-window length from recorded cron run timestamps.
 * A gap larger than 1.5× the job interval breaks the streak.
 */
export function cronGreenWindowHours(
  runAtIso: readonly string[],
  intervalMinutes: number,
  now: Date = new Date(),
): number {
  if (runAtIso.length === 0) return 0
  const times = runAtIso
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)
  if (times.length === 0) return 0

  const maxGapMs = Math.max(1, intervalMinutes) * 1.5 * 60_000
  let oldest = times[0] ?? now.getTime()
  for (let index = 1; index < times.length; index += 1) {
    const current = times[index]
    const newer = times[index - 1]
    if (current === undefined || newer === undefined) break
    if (newer - current > maxGapMs) break
    oldest = current
  }
  const newest = times[0]
  if (newest === undefined) return 0
  if (now.getTime() - newest > maxGapMs) return 0
  return Math.max(0, (now.getTime() - oldest) / 3_600_000)
}
