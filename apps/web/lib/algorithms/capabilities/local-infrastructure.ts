import type { CapabilitySpec } from '../types'
import { num, str, clamp01, okLocal, okAdapter } from '../handlers/utils'
import { zScoreAnomaly, utilizationScore, autoscaleHeadroom, rolloutRiskScore } from '../product/ops-health'
import { surfaceFor } from './surface'

export const LOCAL_INFRASTRUCTURE_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'multi-cdn-failover',
    surface: surfaceFor('multi-cdn-failover'),
    mode: 'adapter-disabled',
    run: (input) => {
      const primaryErrorRate = num(input, 'primaryErrorRate', 0.01)
      const shouldFailover = primaryErrorRate > 0.05
      return okAdapter('adapter-disabled', `failoverDecision=${shouldFailover} primaryErrorRate=${primaryErrorRate} (single CDN configured)`, {
        score: primaryErrorRate,
      })
    },
  },
  {
    id: 'anycast-dns',
    surface: surfaceFor('anycast-dns'),
    mode: 'adapter-disabled',
    run: (input) => {
      const resolutionMs = num(input, 'resolutionMs', 24)
      const budgetMs = num(input, 'budgetMs', 30)
      const score = resolutionMs <= budgetMs ? 1 : clamp01(budgetMs / resolutionMs)
      return okAdapter('adapter-disabled', `dnsResolutionWithinBudget=${resolutionMs <= budgetMs} (single-region DNS, no anycast vendor)`, {
        score,
      })
    },
  },
  {
    id: 'edge-personalization',
    surface: surfaceFor('edge-personalization'),
    mode: 'local',
    run: (input) => {
      const locale = str(input, 'locale', 'ne')
      const featureFlagsMatched = num(input, 'featureFlagsMatched', 3)
      const featureFlagsTotal = num(input, 'featureFlagsTotal', 4)
      const score = featureFlagsTotal > 0 ? clamp01(featureFlagsMatched / featureFlagsTotal) : 1
      return okLocal(`edgeFlagsMatched=${featureFlagsMatched}/${featureFlagsTotal} locale=${locale}`, { score })
    },
  },
  {
    id: 'predictive-autoscaling',
    surface: surfaceFor('predictive-autoscaling'),
    mode: 'local',
    run: (input) => {
      const current = num(input, 'active', 8)
      const max = num(input, 'max', 20)
      const forecast = num(input, 'forecast', 14)
      const headroom = autoscaleHeadroom(current, max, forecast)
      return okLocal(`autoscaleHeadroom=${headroom.toFixed(3)} forecast=${forecast}/${max}`, { score: headroom })
    },
  },
  {
    id: 'canary-blue-green',
    surface: surfaceFor('canary-blue-green'),
    mode: 'local',
    run: (input) => {
      const errorRateDelta = num(input, 'errorRateDelta', 0.002)
      const trafficPercent = num(input, 'trafficPercent', 10)
      const risk = rolloutRiskScore(errorRateDelta, trafficPercent)
      return okLocal(`rolloutRisk=${risk.toFixed(3)} traffic=${trafficPercent}%`, { score: risk })
    },
  },
  {
    id: 'connection-pool-optimization',
    surface: surfaceFor('connection-pool-optimization'),
    mode: 'local',
    run: (input) => {
      const active = num(input, 'active', 8)
      const max = num(input, 'max', 20)
      const score = utilizationScore(active, max)
      return okLocal(`poolUtilization=${score.toFixed(3)} active=${active}/${max}`, { score })
    },
  },
  {
    id: 'log-anomaly-detection',
    surface: surfaceFor('log-anomaly-detection'),
    mode: 'local',
    run: (input) => {
      const values = (input.values as number[]) ?? []
      const z = zScoreAnomaly(values)
      return okLocal(`logAnomalyZ=${z.toFixed(3)} samples=${values.length}`, { score: z })
    },
  },
  {
    id: 'rum-synthetic-fusion',
    surface: surfaceFor('rum-synthetic-fusion'),
    mode: 'adapter-ready',
    run: (input) => {
      const rumP75 = num(input, 'rumP75Ms', 2400)
      const syntheticP75 = num(input, 'syntheticP75Ms', 2100)
      const delta = Math.abs(rumP75 - syntheticP75)
      const agreement = clamp01(1 - delta / Math.max(rumP75, syntheticP75, 1))
      return okAdapter('adapter-ready', `rumSyntheticAgreement=${agreement.toFixed(3)} delta=${delta}ms (local fusion; vendor RUM ready)`, {
        score: agreement,
      })
    },
  },
  {
    id: 'performance-budgets-ci',
    surface: surfaceFor('performance-budgets-ci'),
    mode: 'local',
    run: (input) => {
      const lcpMs = num(input, 'lcpMs', 2100)
      const lcpBudgetMs = num(input, 'lcpBudgetMs', 2500)
      const bundleBytes = num(input, 'bytes', 180_000)
      const bundleBudgetBytes = num(input, 'budgetBytes', 250_000)
      const withinBudget = lcpMs <= lcpBudgetMs && bundleBytes <= bundleBudgetBytes
      const score = (lcpMs <= lcpBudgetMs ? 0.5 : 0) + (bundleBytes <= bundleBudgetBytes ? 0.5 : 0)
      return okLocal(`ciBudgetsOk=${withinBudget} lcp=${lcpMs}ms bundle=${bundleBytes}B`, { score })
    },
  },
]
