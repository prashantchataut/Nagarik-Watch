import type { CapabilitySpec } from '../types'
import { num, clamp01, okLocal, okAdapter } from '../handlers/utils'
import { surfaceFor } from './surface'

export const LOCAL_ADVERTISING_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'ads-txt-sellers-json',
    surface: surfaceFor('ads-txt-sellers-json'),
    mode: 'local',
    run: (input) => {
      const hasAdsTxt = Boolean(input.hasAdsTxt ?? true)
      const hasSellersJson = Boolean(input.hasSellersJson ?? true)
      const score = (hasAdsTxt ? 0.5 : 0) + (hasSellersJson ? 0.5 : 0)
      return okLocal(`adsTxt=${hasAdsTxt} sellersJson=${hasSellersJson}`, { score })
    },
  },
  {
    id: 'data-clean-room',
    surface: surfaceFor('data-clean-room'),
    mode: 'adapter-disabled',
    run: (input) => {
      const cohortSize = num(input, 'cohortSize', 0)
      const kAnonymityThreshold = num(input, 'kAnonymityThreshold', 50)
      const safe = cohortSize >= kAnonymityThreshold
      return okAdapter(
        'adapter-disabled',
        `kAnonymitySafe=${safe} cohortSize=${cohortSize} (no clean-room vendor configured)`,
        {
          score: safe ? 1 : clamp01(cohortSize / Math.max(1, kAnonymityThreshold)),
        },
      )
    },
  },
  {
    id: 'attention-metric-scoring',
    surface: surfaceFor('attention-metric-scoring'),
    mode: 'local',
    run: (input) => {
      const viewportSeconds = num(input, 'viewportSeconds', 3.5)
      const viewportShare = num(input, 'viewportShare', 0.6)
      const score = clamp01(Math.min(1, viewportSeconds / 5) * 0.6 + viewportShare * 0.4)
      return okLocal(`attentionScore=${score.toFixed(3)} viewport=${viewportSeconds}s`, { score })
    },
  },
  {
    id: 'true-cpm-reporting',
    surface: surfaceFor('true-cpm-reporting'),
    mode: 'adapter-ready',
    run: (input) => {
      const netRevenue = num(input, 'netRevenue', 82)
      const impressions = num(input, 'impressions', 5000)
      const trueCpm = impressions > 0 ? (netRevenue / impressions) * 1000 : 0
      return okAdapter(
        'adapter-ready',
        `trueCpm=${trueCpm.toFixed(2)} netRevenue=${netRevenue} (local calc; SSP fee feed ready)`,
        {
          score: trueCpm,
        },
      )
    },
  },
  {
    id: 'spo-transparency',
    surface: surfaceFor('spo-transparency'),
    mode: 'local',
    run: (input) => {
      const disclosedHops = num(input, 'disclosedHops', 2)
      const totalHops = num(input, 'totalHops', 3)
      const score = totalHops > 0 ? clamp01(disclosedHops / totalHops) : 1
      return okLocal(
        `supplyPathTransparency=${score.toFixed(3)} disclosed=${disclosedHops}/${totalHops}`,
        { score },
      )
    },
  },
  {
    id: 'mfa-self-screening',
    surface: surfaceFor('mfa-self-screening'),
    mode: 'local',
    run: (input) => {
      const adDensity = num(input, 'adDensity', 0.2)
      const contentToAdRatio = num(input, 'contentToAdRatio', 4)
      const looksLikeMfa = adDensity > 0.35 || contentToAdRatio < 2
      return okLocal(`madeForAdvertisingRisk=${looksLikeMfa} adDensity=${adDensity}`, {
        score: looksLikeMfa ? 1 : adDensity,
      })
    },
  },
  {
    id: 'header-bidding-timeout',
    surface: surfaceFor('header-bidding-timeout'),
    mode: 'local',
    run: (input) => {
      const bidResponseMs = num(input, 'bidResponseMs', 620)
      const timeoutMs = num(input, 'timeoutMs', 800)
      const score = bidResponseMs <= timeoutMs ? 1 : clamp01(timeoutMs / bidResponseMs)
      return okLocal(
        `bidWithinTimeout=${bidResponseMs <= timeoutMs} response=${bidResponseMs}ms budget=${timeoutMs}ms`,
        {
          score,
        },
      )
    },
  },
  {
    id: 'pmp-prioritization',
    surface: surfaceFor('pmp-prioritization'),
    mode: 'local',
    run: (input) => {
      const pmpCpm = num(input, 'pmpCpm', 6)
      const openExchangeCpm = num(input, 'openExchangeCpm', 4)
      const preferPmp = pmpCpm >= openExchangeCpm
      return okLocal(`preferPmp=${preferPmp} pmpCpm=${pmpCpm} openCpm=${openExchangeCpm}`, {
        score: preferPmp ? 1 : 0,
      })
    },
  },
  {
    id: 'publisher-provided-id',
    surface: surfaceFor('publisher-provided-id'),
    mode: 'local',
    run: (input) => {
      const consentedUsers = num(input, 'consentedUsers', 420)
      const totalUsers = num(input, 'totalUsers', 600)
      const score = totalUsers > 0 ? clamp01(consentedUsers / totalUsers) : 0
      return okLocal(`ppidCoverage=${score.toFixed(3)} consented=${consentedUsers}/${totalUsers}`, {
        score,
      })
    },
  },
  {
    id: 'contextual-sentiment-targeting',
    surface: surfaceFor('contextual-sentiment-targeting'),
    mode: 'local',
    run: (input) => {
      const pageSentiment = num(input, 'pageSentiment', 0)
      const brandSafetyThreshold = num(input, 'brandSafetyThreshold', -0.3)
      const safe = pageSentiment >= brandSafetyThreshold
      return okLocal(`brandSafeForTargeting=${safe} pageSentiment=${pageSentiment.toFixed(2)}`, {
        score: safe ? 1 : 0,
      })
    },
  },
  {
    id: 'cross-device-frequency-cap',
    surface: surfaceFor('cross-device-frequency-cap'),
    mode: 'local',
    run: (input) => {
      const impressionsAcrossDevices = num(input, 'impressionsAcrossDevices', 3)
      const cap = num(input, 'frequencyCap', 5)
      const score = clamp01(1 - impressionsAcrossDevices / Math.max(1, cap))
      return okLocal(
        `frequencyHeadroom=${score.toFixed(3)} seen=${impressionsAcrossDevices}/${cap}`,
        { score },
      )
    },
  },
  {
    id: 'viewability-ad-refresh',
    surface: surfaceFor('viewability-ad-refresh'),
    mode: 'local',
    run: (input) => {
      const viewableSeconds = num(input, 'viewableSeconds', 1.4)
      const mrcThresholdSeconds = num(input, 'mrcThresholdSeconds', 1)
      const eligibleForRefresh = viewableSeconds >= mrcThresholdSeconds
      return okLocal(`mrcViewableEligible=${eligibleForRefresh} viewable=${viewableSeconds}s`, {
        score: eligibleForRefresh ? 1 : viewableSeconds / mrcThresholdSeconds,
      })
    },
  },
  {
    id: 'ad-incrementality-holdout',
    surface: surfaceFor('ad-incrementality-holdout'),
    mode: 'local',
    run: (input) => {
      const treatmentConversionRate = num(input, 'treatmentConversionRate', 0.06)
      const controlConversionRate = num(input, 'controlConversionRate', 0.045)
      const lift =
        controlConversionRate > 0
          ? (treatmentConversionRate - controlConversionRate) / controlConversionRate
          : 0
      return okLocal(`incrementalLift=${lift.toFixed(3)}`, { score: lift })
    },
  },
  {
    id: 'media-mix-modeling',
    surface: surfaceFor('media-mix-modeling'),
    mode: 'local',
    run: (input) => {
      const channelSpend = (input.channelSpend as Record<string, number>) ?? {
        search: 200,
        social: 150,
        display: 100,
      }
      const channelConversions = (input.channelConversions as Record<string, number>) ?? {
        search: 40,
        social: 20,
        display: 8,
      }
      const totalSpend = Object.values(channelSpend).reduce((a, b) => a + b, 0)
      const contributions = Object.entries(channelConversions).map(([channel, conversions]) => {
        const spend = channelSpend[channel] ?? 0
        return { channel, costPerConversion: conversions > 0 ? spend / conversions : Infinity }
      })
      const best = contributions
        .filter((c) => Number.isFinite(c.costPerConversion))
        .sort((a, b) => a.costPerConversion - b.costPerConversion)[0]
      return okLocal(
        `bestChannel=${best?.channel ?? 'none'} costPerConversion=${best?.costPerConversion.toFixed(2) ?? 'n/a'} totalSpend=${totalSpend}`,
        {
          score: best ? 1 / best.costPerConversion : 0,
        },
      )
    },
  },
  {
    id: 'dynamic-floor-pricing',
    surface: surfaceFor('dynamic-floor-pricing'),
    mode: 'local',
    run: (input) => {
      const historicalWinRate = num(input, 'historicalWinRate', 0.4)
      const currentFloor = num(input, 'currentFloor', 3)
      const targetWinRate = num(input, 'targetWinRate', 0.5)
      const adjustment = historicalWinRate < targetWinRate ? -0.1 : 0.1
      const recommendedFloor = Math.max(0.5, currentFloor * (1 + adjustment))
      return okLocal(
        `recommendedFloor=${recommendedFloor.toFixed(2)} winRate=${historicalWinRate.toFixed(2)}`,
        {
          score: recommendedFloor,
        },
      )
    },
  },
  {
    id: 'native-ad-rendering',
    surface: surfaceFor('native-ad-rendering'),
    mode: 'local',
    run: (input) => {
      const hasTitle = Boolean(input.hasTitle ?? true)
      const hasImage = Boolean(input.hasImage ?? true)
      const hasCta = Boolean(input.hasCta ?? true)
      const fields = [hasTitle, hasImage, hasCta]
      const score = fields.filter(Boolean).length / fields.length
      return okLocal(
        `nativeTemplateComplete=${score === 1} fields=${fields.filter(Boolean).length}/${fields.length}`,
        {
          score,
        },
      )
    },
  },
  {
    id: 'video-ssai',
    surface: surfaceFor('video-ssai'),
    mode: 'local',
    run: (input) => {
      const expectedAdBreaks = num(input, 'expectedAdBreaks', 3)
      const stitchedAdBreaks = num(input, 'stitchedAdBreaks', 3)
      const score = expectedAdBreaks > 0 ? clamp01(stitchedAdBreaks / expectedAdBreaks) : 1
      return okLocal(
        `ssaiStitchRatio=${score.toFixed(3)} stitched=${stitchedAdBreaks}/${expectedAdBreaks}`,
        { score },
      )
    },
  },
  {
    id: 'reach-frequency-dedup',
    surface: surfaceFor('reach-frequency-dedup'),
    mode: 'local',
    run: (input) => {
      const uniqueReach = num(input, 'uniqueReach', 3200)
      const totalImpressions = num(input, 'totalImpressions', 5000)
      const dedupRate = totalImpressions > 0 ? clamp01(1 - uniqueReach / totalImpressions) : 0
      return okLocal(
        `dedupRate=${dedupRate.toFixed(3)} uniqueReach=${uniqueReach}/${totalImpressions}`,
        {
          score: dedupRate,
        },
      )
    },
  },
  {
    id: 'advertiser-dashboard-pipeline',
    surface: surfaceFor('advertiser-dashboard-pipeline'),
    mode: 'local',
    run: (input) => {
      const stagesComplete = num(input, 'stagesComplete', 3)
      const stagesTotal = num(input, 'stagesTotal', 4)
      const score = stagesTotal > 0 ? clamp01(stagesComplete / stagesTotal) : 0
      return okLocal(`pipelineComplete=${stagesComplete}/${stagesTotal}`, { score })
    },
  },
  {
    id: 'attention-yield-optimization',
    surface: surfaceFor('attention-yield-optimization'),
    mode: 'local',
    run: (input) => {
      const attentionScore = num(input, 'attentionScore', 0.6)
      const ecpm = num(input, 'ecpm', 4.2)
      const attentionYield = attentionScore * ecpm
      return okLocal(
        `attentionYield=${attentionYield.toFixed(3)} attention=${attentionScore} ecpm=${ecpm}`,
        {
          score: attentionYield,
        },
      )
    },
  },
]
