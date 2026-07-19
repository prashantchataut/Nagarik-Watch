import type { CapabilitySpec } from '../types'
import { num, clamp01, okLocal, fail } from '../handlers/utils'
import { zScoreAnomaly } from '../product/ops-health'
import { classifyTraffic, botScore } from '../product/traffic-quality'
import { surfaceFor } from './surface'

function betaMean(alphaPrior: number, betaPrior: number, successes: number, trials: number): number {
  const a = alphaPrior + successes
  const b = betaPrior + Math.max(0, trials - successes)
  return a / (a + b)
}

export const LOCAL_EXPERIMENTATION_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'sequential-ab-testing',
    surface: surfaceFor('sequential-ab-testing'),
    mode: 'local',
    run: (input) => {
      const conversionsA = num(input, 'conversionsA', 36)
      const exposuresA = num(input, 'exposuresA', 400)
      const conversionsB = num(input, 'conversionsB', 48)
      const exposuresB = num(input, 'exposuresB', 400)
      const rateA = exposuresA > 0 ? conversionsA / exposuresA : 0
      const rateB = exposuresB > 0 ? conversionsB / exposuresB : 0
      const pooled = (conversionsA + conversionsB) / Math.max(1, exposuresA + exposuresB)
      const se = Math.sqrt(pooled * (1 - pooled) * (1 / Math.max(1, exposuresA) + 1 / Math.max(1, exposuresB))) || 1
      const z = (rateB - rateA) / se
      const decisive = Math.abs(z) >= 1.96
      return okLocal(`sprtZ=${z.toFixed(3)} decisive=${decisive} rateA=${rateA.toFixed(3)} rateB=${rateB.toFixed(3)}`, {
        score: Math.abs(z),
      })
    },
  },
  {
    id: 'bayesian-experimentation',
    surface: surfaceFor('bayesian-experimentation'),
    mode: 'local',
    run: (input) => {
      const conversionsA = num(input, 'conversionsA', 36)
      const exposuresA = num(input, 'exposuresA', 400)
      const conversionsB = num(input, 'conversionsB', 48)
      const exposuresB = num(input, 'exposuresB', 400)
      const meanA = betaMean(1, 1, conversionsA, exposuresA)
      const meanB = betaMean(1, 1, conversionsB, exposuresB)
      const probBBeatsA = clamp01(0.5 + (meanB - meanA) * 5)
      return okLocal(`posteriorMeanA=${meanA.toFixed(4)} posteriorMeanB=${meanB.toFixed(4)} probBWins~${probBBeatsA.toFixed(3)}`, {
        score: probBBeatsA,
      })
    },
  },
  {
    id: 'progressive-feature-rollout',
    surface: surfaceFor('progressive-feature-rollout'),
    mode: 'local',
    run: (input) => {
      const currentPercent = num(input, 'rolloutPercent', 20)
      const errorRateDelta = num(input, 'errorRateDelta', 0.001)
      const canIncrease = errorRateDelta < 0.005
      const nextPercent = canIncrease ? Math.min(100, currentPercent * 2) : currentPercent
      return okLocal(`currentPercent=${currentPercent} nextPercent=${nextPercent} canIncrease=${canIncrease}`, {
        score: nextPercent,
      })
    },
  },
  {
    id: 'cohort-retention-forecasting',
    surface: surfaceFor('cohort-retention-forecasting'),
    mode: 'local',
    run: (input) => {
      const cohortRetention = (input.cohortRetention as number[]) ?? []
      if (cohortRetention.length < 2) return fail('local', 'cohortRetention needs at least 2 periods')
      const ratios: number[] = []
      for (let i = 1; i < cohortRetention.length; i++) {
        const prev = cohortRetention[i - 1]!
        if (prev > 0) ratios.push(cohortRetention[i]! / prev)
      }
      const avgDecay = ratios.length > 0 ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 1
      const forecastNext = (cohortRetention[cohortRetention.length - 1] ?? 0) * avgDecay
      return okLocal(`avgPeriodDecay=${avgDecay.toFixed(3)} forecastNextPeriod=${forecastNext.toFixed(3)}`, {
        score: forecastNext,
      })
    },
  },
  {
    id: 'funnel-anomaly-detection',
    surface: surfaceFor('funnel-anomaly-detection'),
    mode: 'local',
    run: (input) => {
      const stepConversionRates = (input.stepConversionRates as number[]) ?? [0.8, 0.6, 0.5, 0.1]
      const z = zScoreAnomaly(stepConversionRates)
      return okLocal(`funnelAnomalyZ=${z.toFixed(3)} steps=${stepConversionRates.length}`, { score: z })
    },
  },
  {
    id: 'clickmap-heatmap',
    surface: surfaceFor('clickmap-heatmap'),
    mode: 'local',
    run: (input) => {
      const hotZoneClicks = num(input, 'hotZoneClicks', 140)
      const totalClicks = num(input, 'totalClicks', 200)
      const score = totalClicks > 0 ? clamp01(hotZoneClicks / totalClicks) : 0
      return okLocal(`hotZoneClickDensity=${score.toFixed(3)} hotZone=${hotZoneClicks}/${totalClicks}`, { score })
    },
  },
  {
    id: 'session-quality-scoring',
    surface: surfaceFor('session-quality-scoring'),
    mode: 'local',
    run: (input) => {
      const durationSeconds = num(input, 'sessionDurationSeconds', 95)
      const pages = num(input, 'pagesPerSession', 3)
      const bounced = Boolean(input.bounced)
      const score = bounced ? 0 : clamp01(Math.min(1, durationSeconds / 180) * 0.6 + Math.min(1, pages / 5) * 0.4)
      return okLocal(`sessionQuality=${score.toFixed(3)} duration=${durationSeconds}s pages=${pages}`, { score })
    },
  },
  {
    id: 'traffic-source-clustering',
    surface: surfaceFor('traffic-source-clustering'),
    mode: 'local',
    run: (input) => {
      const sources = (input.sources as string[]) ?? ['google', 'facebook', 'direct', 'google', 'newsletter']
      const groups = new Map<string, number>()
      for (const source of sources) groups.set(source, (groups.get(source) ?? 0) + 1)
      const dominant = [...groups.entries()].sort((a, b) => b[1] - a[1])[0]
      return okLocal(`clusters=${groups.size} dominant=${dominant?.[0] ?? 'none'} (${dominant?.[1] ?? 0})`, {
        score: groups.size,
        outputs: { clusters: [...groups.entries()] },
      })
    },
  },
  {
    id: 'bot-human-classification',
    surface: surfaceFor('bot-human-classification'),
    mode: 'local',
    run: (input) => {
      const signals = {
        requestsPerMinute: num(input, 'requestsPerMinute', 6),
        jsExecuted: Boolean(input.jsExecuted ?? true),
        mouseMovements: num(input, 'mouseMovements', 24),
        headlessUserAgent: Boolean(input.headlessUserAgent),
        knownDatacenterIp: Boolean(input.knownDatacenterIp),
        sessionDurationSeconds: num(input, 'sessionDurationSeconds', 95),
        pagesPerSession: num(input, 'pagesPerSession', 3),
      }
      const classification = classifyTraffic(signals)
      return okLocal(`trafficClass=${classification} botScore=${botScore(signals).toFixed(3)}`, {
        score: botScore(signals),
        outputs: { classification },
      })
    },
  },
]
