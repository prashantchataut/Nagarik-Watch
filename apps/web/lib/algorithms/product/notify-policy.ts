/**
 * Shared notification policy math: quiet hours, batching pressure, cooldown,
 * fatigue headroom, and send-time scoring. Used by both the existing
 * heuristic handlers and the new local notification capabilities so the
 * policy logic is defined exactly once.
 */

export function isQuietHour(hour: number, quietStart = 22, quietEnd = 6): boolean {
  const h = ((hour % 24) + 24) % 24
  if (quietStart === quietEnd) return false
  if (quietStart < quietEnd) return h >= quietStart && h < quietEnd
  return h >= quietStart || h < quietEnd
}

export function batchPressure(pending: number, windowMinutes: number): number {
  if (windowMinutes <= 0) return pending > 0 ? 1 : 0
  return Math.max(0, Math.min(1, pending / Math.max(1, windowMinutes / 5)))
}

export function cooldownRemainingMinutes(minutesSinceLast: number, cooldownMinutes: number): number {
  return Math.max(0, cooldownMinutes - minutesSinceLast)
}

export function fatigueHeadroom(sentToday: number, maxPerDay: number): number {
  return Math.max(0, Math.min(1, 1 - sentToday / Math.max(1, maxPerDay)))
}

/** 0..1 score for how well `hour` matches historical per-hour engagement. */
export function sendTimeScore(hour: number, engagementByHour: number[]): number {
  if (engagementByHour.length !== 24) return 0.5
  const max = Math.max(...engagementByHour, 1)
  const h = ((hour % 24) + 24) % 24
  return Math.max(0, Math.min(1, (engagementByHour[h] ?? 0) / max))
}

export function bestSendHour(engagementByHour: number[]): number {
  if (engagementByHour.length !== 24) return 9
  let best = 0
  for (let h = 1; h < 24; h++) {
    if ((engagementByHour[h] ?? 0) > (engagementByHour[best] ?? 0)) best = h
  }
  return best
}
