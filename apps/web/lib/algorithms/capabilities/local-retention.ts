/**
 * Local retention-domain capabilities: PWA install timing, offline caching,
 * reading streak continuation, theme scheduling, accessibility audit, push
 * priming, exit-intent, onboarding, feedback timing, loyalty tiers, session
 * replay sampling, micro-interaction feedback, adaptive layout, save-data
 * detection, and continue-reading restore.
 */
import type { CapabilitySpec } from '../types'
import { num, str, clamp01, okLocal, okAdapter, fail } from '../handlers/utils'
import { surfaceFor } from './surface'

function streakWithGrace(days: number[], graceDays = 1): number {
  if (days.length === 0) return 0
  const sorted = [...new Set(days)].sort((a, b) => b - a)
  let streak = 1
  let graceUsed = 0
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i - 1]! - sorted[i]!
    if (gap === 1) streak += 1
    else if (gap <= 1 + graceDays && graceUsed < graceDays) {
      streak += 1
      graceUsed += 1
    } else break
  }
  return streak
}

export const LOCAL_RETENTION_CAPABILITIES: CapabilitySpec[] = [
  {
    id: 'pwa-install-prompt-timing',
    surface: surfaceFor('pwa-install-prompt-timing'),
    mode: 'local',
    run: (input) => {
      const sessionCount = num(input, 'sessionCount', 3)
      const dismissedRecently = Boolean(input.dismissedRecently)
      const score = dismissedRecently ? 0 : clamp01(sessionCount / 5)
      return okLocal(`installPromptReadiness=${score.toFixed(3)} sessions=${sessionCount}`, {
        score,
      })
    },
  },
  {
    id: 'offline-first-articles',
    surface: surfaceFor('offline-first-articles'),
    mode: 'local',
    run: (input) => {
      const cachedArticles = num(input, 'cachedArticles', 12)
      const targetCache = num(input, 'targetCache', 20)
      const score = clamp01(cachedArticles / Math.max(1, targetCache))
      return okLocal(
        `offlineCacheCoverage=${score.toFixed(3)} cached=${cachedArticles}/${targetCache}`,
        { score },
      )
    },
  },
  {
    id: 'reading-streaks',
    surface: surfaceFor('reading-streaks'),
    mode: 'local',
    run: (input) => {
      const days = (input.dayNumbers as number[]) ?? []
      if (days.length === 0) return fail('local', 'dayNumbers array is required')
      const streak = streakWithGrace(days, num(input, 'graceDays', 1))
      return okLocal(`streakWithGrace=${streak}`, { score: streak })
    },
  },
  {
    id: 'sunrise-theme',
    surface: surfaceFor('sunrise-theme'),
    mode: 'local',
    run: (input) => {
      const hour = num(input, 'hour', 14)
      const isDay = hour >= 6 && hour < 18
      return okLocal(`theme=${isDay ? 'light' : 'dark'} hour=${hour}`, { score: isDay ? 1 : 0 })
    },
  },
  {
    id: 'automated-accessibility-audit',
    surface: surfaceFor('automated-accessibility-audit'),
    mode: 'local',
    run: (input) => {
      const altTextPresent = Boolean(input.altTextPresent ?? true)
      const contrastRatio = num(input, 'contrastRatio', 4.6)
      const ariaLabelsPresent = Boolean(input.ariaLabelsPresent ?? true)
      const checks = [altTextPresent, contrastRatio >= 4.5, ariaLabelsPresent]
      const score = checks.filter(Boolean).length / checks.length
      return okLocal(
        `a11yChecksPassed=${checks.filter(Boolean).length}/${checks.length} contrast=${contrastRatio}`,
        {
          score,
        },
      )
    },
  },
  {
    id: 'push-permission-priming',
    surface: surfaceFor('push-permission-priming'),
    mode: 'adapter-ready',
    run: (input) => {
      const sessionsBeforeAsk = num(input, 'sessionsBeforeAsk', 3)
      const engagementScore = num(input, 'engagementScore', 0.6)
      const readiness = clamp01(sessionsBeforeAsk / 5) * 0.5 + engagementScore * 0.5
      return okAdapter(
        'adapter-ready',
        `pushPrimingReadiness=${readiness.toFixed(3)} (local gate; provider ready)`,
        {
          score: readiness,
        },
      )
    },
  },
  {
    id: 'exit-intent-save',
    surface: surfaceFor('exit-intent-save'),
    mode: 'local',
    run: (input) => {
      const scrollDepth = num(input, 'scrollDepth', 45)
      const dwellSeconds = num(input, 'dwellSeconds', 40)
      const score = clamp01((scrollDepth / 100) * 0.6 + Math.min(1, dwellSeconds / 90) * 0.4)
      return okLocal(`exitIntentSaveRelevance=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'personalized-onboarding',
    surface: surfaceFor('personalized-onboarding'),
    mode: 'local',
    run: (input) => {
      const selectedTopics = (input.selectedTopics as string[]) ?? ['politics', 'business']
      const availableTopics = (input.availableTopics as string[]) ?? [
        'politics',
        'sports',
        'business',
        'disaster',
      ]
      const score = availableTopics.length > 0 ? selectedTopics.length / availableTopics.length : 0
      return okLocal(
        `onboardingTopicCoverage=${score.toFixed(3)} selected=${selectedTopics.length}`,
        {
          score: clamp01(score),
        },
      )
    },
  },
  {
    id: 'feedback-timing',
    surface: surfaceFor('feedback-timing'),
    mode: 'local',
    run: (input) => {
      const completedReads = num(input, 'completedReads', 3)
      const daysSinceLastAsk = num(input, 'daysSinceLastAsk', 30)
      const score = clamp01(completedReads / 5) * clamp01(daysSinceLastAsk / 14)
      return okLocal(`feedbackAskReadiness=${score.toFixed(3)}`, { score })
    },
  },
  {
    id: 'reader-loyalty-tiers',
    surface: surfaceFor('reader-loyalty-tiers'),
    mode: 'local',
    run: (input) => {
      // Keep thresholds aligned with lib/reader/loyalty.ts (product surface).
      const lifetimeReads = num(input, 'lifetimeReads', 40)
      const tier = lifetimeReads >= 200 ? 'gold' : lifetimeReads >= 50 ? 'silver' : 'bronze'
      const score = lifetimeReads >= 200 ? 1 : lifetimeReads >= 50 ? 0.6 : 0.3
      return okLocal(`loyaltyTier=${tier} lifetimeReads=${lifetimeReads}`, {
        score,
        outputs: { tier },
      })
    },
  },
  {
    id: 'session-replay-sampling',
    surface: surfaceFor('session-replay-sampling'),
    mode: 'adapter-disabled',
    run: (input) => {
      const hadError = Boolean(input.hadError)
      const isAnomalous = Boolean(input.isAnomalous)
      const baseSampleRate = num(input, 'baseSampleRate', 0.02)
      const rate = hadError || isAnomalous ? 1 : baseSampleRate
      return okAdapter(
        'adapter-disabled',
        `replaySampleRate=${rate.toFixed(3)} (no replay vendor configured)`,
        {
          score: rate,
        },
      )
    },
  },
  {
    id: 'micro-interaction-feedback',
    surface: surfaceFor('micro-interaction-feedback'),
    mode: 'local',
    run: (input) => {
      const responseMs = num(input, 'responseMs', 80)
      const budgetMs = num(input, 'budgetMs', 100)
      const score = responseMs <= budgetMs ? 1 : clamp01(budgetMs / responseMs)
      return okLocal(
        `microInteractionWithinBudget=${responseMs <= budgetMs} responseMs=${responseMs}`,
        { score },
      )
    },
  },
  {
    id: 'adaptive-font-layout',
    surface: surfaceFor('adaptive-font-layout'),
    mode: 'local',
    run: (input) => {
      const viewportWidth = num(input, 'viewportWidth', 390)
      const preferredFontScale = num(input, 'preferredFontScale', 1)
      const recommendedScale =
        viewportWidth < 400 ? Math.max(1, preferredFontScale) : preferredFontScale
      const score = clamp01(recommendedScale / 1.5)
      return okLocal(
        `recommendedFontScale=${recommendedScale.toFixed(2)} viewport=${viewportWidth}`,
        { score },
      )
    },
  },
  {
    id: 'save-data-detection',
    surface: surfaceFor('save-data-detection'),
    mode: 'local',
    run: (input) => {
      const saveDataHeader = Boolean(input.saveDataHeader)
      const effectiveType = str(input, 'effectiveType', '4g')
      const lowBandwidth = saveDataHeader || effectiveType === '2g' || effectiveType === 'slow-2g'
      const assetTier = lowBandwidth ? 'low' : 'standard'
      return okLocal(
        `assetTier=${assetTier} saveData=${saveDataHeader} effectiveType=${effectiveType}`,
        {
          score: lowBandwidth ? 1 : 0,
          outputs: { assetTier },
        },
      )
    },
  },
  {
    id: 'continue-reading-restore',
    surface: surfaceFor('continue-reading-restore'),
    mode: 'local',
    run: (input) => {
      const scrollDepth = num(input, 'scrollDepth', 55)
      const hoursAgo = num(input, 'hoursAgo', 4)
      const shouldRestore = scrollDepth >= 10 && scrollDepth <= 95 && hoursAgo <= 72
      const score = shouldRestore ? clamp01(1 - hoursAgo / 72) : 0
      return okLocal(
        `shouldRestore=${shouldRestore} scrollDepth=${scrollDepth} hoursAgo=${hoursAgo}`,
        { score },
      )
    },
  },
]
