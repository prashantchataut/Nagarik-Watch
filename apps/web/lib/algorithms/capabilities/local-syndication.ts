import type { CapabilitySpec } from '../types'
import { num, str, clamp01, jaccard, okLocal, okAdapter } from '../handlers/utils'
import { surfaceFor } from './surface'

function checklistScore(checks: boolean[]): number {
  if (checks.length === 0) return 0
  return checks.filter(Boolean).length / checks.length
}

export const LOCAL_SYNDICATION_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'apple-news-format',
    surface: surfaceFor('apple-news-format'),
    mode: 'adapter-disabled',
    run: (input) => {
      const hasIdentifier = Boolean(input.hasIdentifier ?? true)
      const hasTitle = Boolean(input.hasTitle ?? true)
      const hasComponents = Boolean(input.hasComponents ?? true)
      const score = checklistScore([hasIdentifier, hasTitle, hasComponents])
      return okAdapter('adapter-disabled', `anfStructureValid=${score === 1} (no Apple News API vendor configured)`, {
        score,
      })
    },
  },
  {
    id: 'dwell-syndication-format',
    surface: surfaceFor('dwell-syndication-format'),
    mode: 'local',
    run: (input) => {
      const hasHeadline = Boolean(input.hasHeadline ?? true)
      const hasAuthor = Boolean(input.hasAuthor ?? true)
      const hasBody = Boolean(input.hasBody ?? true)
      const hasCanonicalLink = Boolean(input.hasCanonicalLink ?? true)
      const score = checklistScore([hasHeadline, hasAuthor, hasBody, hasCanonicalLink])
      return okLocal(`dwellFormatComplete=${score === 1}`, { score })
    },
  },
  {
    id: 'google-news-discover-feed',
    surface: surfaceFor('google-news-discover-feed'),
    mode: 'local',
    run: (input) => {
      const sitemapAgeHours = num(input, 'sitemapAgeHours', 2)
      const hasNewsArticleSchema = Boolean(input.hasNewsArticleSchema ?? true)
      const hasLargeImage = Boolean(input.hasLargeImage ?? true)
      const score = clamp01((sitemapAgeHours <= 12 ? 1 : 0.3) * 0.4 + (hasNewsArticleSchema ? 0.3 : 0) + (hasLargeImage ? 0.3 : 0))
      return okLocal(`googleNewsEligibility=${score.toFixed(3)} sitemapAge=${sitemapAgeHours}h`, { score })
    },
  },
  {
    id: 'partner-discovery-matching',
    surface: surfaceFor('partner-discovery-matching'),
    mode: 'local',
    run: (input) => {
      const ourTags = new Set((input.tags as string[]) ?? ['politics', 'kathmandu', 'flood'])
      const partnerInterests = new Set((input.partnerInterests as string[]) ?? ['politics', 'south-asia', 'disaster'])
      const score = jaccard(ourTags, partnerInterests)
      return okLocal(`partnerMatch=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'multi-platform-feed-compliance',
    surface: surfaceFor('multi-platform-feed-compliance'),
    mode: 'local',
    run: (input) => {
      const platformChecks = (input.platformCompliance as Record<string, boolean>) ?? {
        rss: true,
        json: true,
        atom: true,
      }
      const checks = Object.values(platformChecks)
      const score = checklistScore(checks)
      return okLocal(`platformComplianceRatio=${score.toFixed(3)} platforms=${checks.length}`, { score })
    },
  },
  {
    id: 'commerce-feed-enrichment',
    surface: surfaceFor('commerce-feed-enrichment'),
    mode: 'local',
    run: (input) => {
      const hasPrice = Boolean(input.hasPrice ?? true)
      const hasAvailability = Boolean(input.hasAvailability ?? true)
      const hasImage = Boolean(input.hasImage ?? true)
      const hasSku = Boolean(input.hasSku ?? true)
      const score = checklistScore([hasPrice, hasAvailability, hasImage, hasSku])
      return okLocal(`commerceFeedComplete=${score === 1}`, { score })
    },
  },
  {
    id: 'syndication-revenue-reconciliation',
    surface: surfaceFor('syndication-revenue-reconciliation'),
    mode: 'local',
    run: (input) => {
      const expectedRevenue = num(input, 'expectedRevenue', 500)
      const reportedRevenue = num(input, 'reportedRevenue', 480)
      const variance = expectedRevenue > 0 ? Math.abs(expectedRevenue - reportedRevenue) / expectedRevenue : 0
      return okLocal(`revenueVariance=${variance.toFixed(3)} expected=${expectedRevenue} reported=${reportedRevenue}`, {
        score: variance,
      })
    },
  },
  {
    id: 'embargo-windowing',
    surface: surfaceFor('embargo-windowing'),
    mode: 'local',
    run: (input) => {
      const hour = num(input, 'hour', 14)
      const windowStartHour = num(input, 'windowStartHour', 6)
      const windowEndHour = num(input, 'windowEndHour', 22)
      const withinWindow = hour >= windowStartHour && hour < windowEndHour
      return okLocal(`withinReleaseWindow=${withinWindow} hour=${hour} window=${windowStartHour}-${windowEndHour}`, {
        score: withinWindow ? 1 : 0,
      })
    },
  },
  {
    id: 'syndicated-copy-canonical',
    surface: surfaceFor('syndicated-copy-canonical'),
    mode: 'local',
    run: (input) => {
      const canonicalUrl = str(input, 'canonicalUrl', '')
      const originSourceUrl = str(input, 'originSourceUrl', canonicalUrl)
      const ok = Boolean(canonicalUrl) && canonicalUrl === originSourceUrl
      return okLocal(`syndicatedCanonicalMatchesOrigin=${ok}`, { score: ok ? 1 : 0 })
    },
  },
  {
    id: 'local-aggregator-onboarding',
    surface: surfaceFor('local-aggregator-onboarding'),
    mode: 'local',
    run: (input) => {
      const hasFeedUrl = Boolean(input.hasFeedUrl ?? true)
      const hasAuthToken = Boolean(input.hasAuthToken ?? true)
      const hasContractSigned = Boolean(input.hasContractSigned ?? false)
      const score = checklistScore([hasFeedUrl, hasAuthToken, hasContractSigned])
      return okLocal(`onboardingChecklist=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'partner-health-scoring',
    surface: surfaceFor('partner-health-scoring'),
    mode: 'local',
    run: (input) => {
      const uptimeRatio = num(input, 'uptimeRatio', 0.98)
      const errorRate = num(input, 'partnerErrorRate', 0.02)
      const latencyMs = num(input, 'partnerLatencyMs', 300)
      const score = clamp01(uptimeRatio * 0.5 + (1 - clamp01(errorRate * 10)) * 0.3 + clamp01(1 - latencyMs / 1000) * 0.2)
      return okLocal(`partnerHealth=${score.toFixed(3)} uptime=${uptimeRatio}`, { score })
    },
  },
  {
    id: 'white-label-wire-feed',
    surface: surfaceFor('white-label-wire-feed'),
    mode: 'local',
    run: (input) => {
      const brandingStripped = Boolean(input.brandingStripped ?? true)
      const hasLicenseTag = Boolean(input.hasLicenseTag ?? true)
      const score = checklistScore([brandingStripped, hasLicenseTag])
      return okLocal(`whiteLabelReady=${score === 1}`, { score })
    },
  },
]
