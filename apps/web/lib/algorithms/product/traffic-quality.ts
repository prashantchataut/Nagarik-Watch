/**
 * Shared bot/traffic-quality scoring used by bot-traffic-detection (#44),
 * bot-human-classification (#180), and behavioral-bot-score (#192) so all
 * three honestly compute from the same signal weighting instead of diverging.
 */

export type TrafficSignals = {
  requestsPerMinute?: number
  jsExecuted?: boolean
  mouseMovements?: number
  headlessUserAgent?: boolean
  knownDatacenterIp?: boolean
  sessionDurationSeconds?: number
  pagesPerSession?: number
}

export function botScore(signals: TrafficSignals): number {
  let score = 0
  const rpm = signals.requestsPerMinute ?? 4
  if (rpm > 60) score += 0.35
  else if (rpm > 20) score += 0.15

  if (signals.jsExecuted === false) score += 0.25
  if (signals.headlessUserAgent) score += 0.2
  if (signals.knownDatacenterIp) score += 0.15
  if ((signals.mouseMovements ?? 20) === 0) score += 0.1

  const duration = signals.sessionDurationSeconds ?? 90
  const pages = signals.pagesPerSession ?? 3
  if (duration < 2 && pages > 5) score += 0.15

  return Math.max(0, Math.min(1, score))
}

export function classifyTraffic(signals: TrafficSignals): 'human' | 'suspicious' | 'bot' {
  const score = botScore(signals)
  if (score >= 0.6) return 'bot'
  if (score >= 0.3) return 'suspicious'
  return 'human'
}
