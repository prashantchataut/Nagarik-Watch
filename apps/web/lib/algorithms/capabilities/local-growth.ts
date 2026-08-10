import type { CapabilitySpec } from '../types'
import { num, clamp01, okLocal } from '../handlers/utils'
import { surfaceFor } from './surface'

function churnRisk(
  daysSinceLastVisit: number,
  sessions30d: number,
  priorSessions30d: number,
): number {
  const recencyRisk = clamp01(daysSinceLastVisit / 30)
  const declineRisk =
    priorSessions30d > 0 ? clamp01(1 - sessions30d / priorSessions30d) : sessions30d === 0 ? 1 : 0
  return clamp01(recencyRisk * 0.6 + declineRisk * 0.4)
}

function predictedLtv(
  avgSessionMinutes: number,
  sessionsPerMonth: number,
  monthsRetained: number,
): number {
  const monthlyValue = avgSessionMinutes * 0.02 * sessionsPerMonth
  return Math.max(0, monthlyValue * monthsRetained)
}

export const LOCAL_GROWTH_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'churn-prediction',
    surface: surfaceFor('churn-prediction'),
    mode: 'local',
    run: (input) => {
      const daysSinceLastVisit = num(input, 'daysSinceLastVisit', 3)
      const sessions30d = num(input, 'sessions30d', 6)
      const priorSessions30d = num(input, 'priorSessions30d', 8)
      const score = churnRisk(daysSinceLastVisit, sessions30d, priorSessions30d)
      return okLocal(`churnRisk=${score.toFixed(3)} daysSince=${daysSinceLastVisit}`, { score })
    },
  },
  {
    id: 'ltv-prediction',
    surface: surfaceFor('ltv-prediction'),
    mode: 'local',
    run: (input) => {
      const avgSessionMinutes = num(input, 'avgSessionMinutes', 4)
      const sessionsPerMonth = num(input, 'sessionsPerMonth', 10)
      const monthsRetained = num(input, 'monthsRetained', 6)
      const score = predictedLtv(avgSessionMinutes, sessionsPerMonth, monthsRetained)
      return okLocal(`ltvEstimate=${score.toFixed(2)} sessionsPerMonth=${sessionsPerMonth}`, {
        score,
      })
    },
  },
]
