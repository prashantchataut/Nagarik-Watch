/**
 * Trending, velocity, and burst detection — pure functions that turn a stream
 * of per-article engagement samples into a ranked trending list. Nothing here
 * touches the network or a store: callers pass samples in, get scores out.
 *
 * Concepts:
 *   - Velocity: engagement rate over a short window (e.g. views/minute).
 *   - Burst: a sudden spike relative to the article's own preceding baseline.
 *   - Trending: velocity weighted by recency, scoped per category/province so
 *     a sports story does not drown out an unrelated section surge.
 *
 * The web adapter feeds these detectors from the operational engagement store.
 * Keeping the detector pure makes the ranking semantics testable independently
 * from Postgres, request traffic, and the frontend cache.
 */
import type { StoryCardData } from './types'

export type EngagementSample = {
  articleId: string
  categorySlug?: string
  provinceSlug?: string
  /** ISO timestamp of the event. */
  at: string
  views: number
  shares: number
  comments: number
  /** Explicit saves; optional for backward-compatible event producers. */
  bookmarks?: number
  /** Measured active dwell seconds when the sample comes from a reading session. */
  dwellSeconds?: number
}

export type TrendingStory<T extends StoryCardData = StoryCardData> = T & {
  velocity: number
  burstRatio: number
  trendingScore: number
  baseline: number
}

export type TrendingOptions = {
  /** Short window for "now" velocity (minutes). */
  shortWindowMinutes?: number
  /** Total lookback window. Baseline excludes the short window (minutes). */
  baselineWindowMinutes?: number
  /** Minimum preceding-baseline signal before burst ratio is meaningful. */
  minBaseline?: number
  /** Recency half-life applied to the published-at signal (hours). */
  recencyHalfLifeHours?: number
  now?: Date
}

const DEFAULTS = {
  shortWindowMinutes: 15,
  baselineWindowMinutes: 120,
  minBaseline: 2,
  recencyHalfLifeHours: 6,
}

function finiteNonNegative(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Number(value)) : 0
}

/** Sum a sample's weighted engagement (views dominate; dwell, shares, comments amplify). */
function weightOf(sample: EngagementSample): number {
  const dwellBoost = Math.min(6, finiteNonNegative(sample.dwellSeconds) / 30)
  return (
    finiteNonNegative(sample.views) +
    finiteNonNegative(sample.shares) * 6 +
    finiteNonNegative(sample.comments) * 3 +
    finiteNonNegative(sample.bookmarks) * 4 +
    dwellBoost
  )
}

type ResolvedWindows = {
  shortWindowMinutes: number
  baselineWindowMinutes: number
}

function positiveMinutes(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback
}

/** Aggregate samples per article into non-overlapping current and baseline pools. */
function aggregate(samples: EngagementSample[], now: Date, opts: ResolvedWindows) {
  const shortMs = opts.shortWindowMinutes * 60_000
  const baseMs = opts.baselineWindowMinutes * 60_000
  const nowMs = now.getTime()
  const perArticle = new Map<string, { short: number; baseline: number }>()

  for (const sample of samples) {
    const timestamp = Date.parse(sample.at)
    if (!Number.isFinite(timestamp)) continue
    const age = nowMs - timestamp
    // Ignore future-dated telemetry and anything outside the full lookback window.
    if (age < 0 || age > baseMs) continue

    const bucket = perArticle.get(sample.articleId) ?? { short: 0, baseline: 0 }
    const weight = weightOf(sample)
    if (age <= shortMs) bucket.short += weight
    else bucket.baseline += weight
    perArticle.set(sample.articleId, bucket)
  }
  return perArticle
}

/** Velocity = short-window engagement normalized to a per-minute rate. */
export function velocityPerMinute(
  samples: EngagementSample[],
  articleId: string,
  windowMinutes = DEFAULTS.shortWindowMinutes,
  now = new Date(),
): number {
  const resolvedWindow = positiveMinutes(windowMinutes, DEFAULTS.shortWindowMinutes)
  const nowMs = now.getTime()
  const cutoff = nowMs - resolvedWindow * 60_000
  const sum = samples
    .filter((sample) => {
      if (sample.articleId !== articleId) return false
      const timestamp = Date.parse(sample.at)
      return Number.isFinite(timestamp) && timestamp >= cutoff && timestamp <= nowMs
    })
    .reduce((acc, sample) => acc + weightOf(sample), 0)
  return sum / resolvedWindow
}

/**
 * Burst ratio = current short-window rate divided by the preceding baseline rate.
 * The baseline duration must describe only the preceding period; the current
 * short window must not be counted in both numerator and denominator.
 */
export function burstRatio(
  shortEngagement: number,
  baselineEngagement: number,
  baselineMinutes: number,
  shortWindowMinutes = DEFAULTS.shortWindowMinutes,
  minBaseline = DEFAULTS.minBaseline,
): number {
  const safeShort = finiteNonNegative(shortEngagement)
  const safeBaseline = finiteNonNegative(baselineEngagement)
  const safeMinBaseline = finiteNonNegative(minBaseline)
  if (safeBaseline < safeMinBaseline) return 0

  const resolvedBaselineMinutes = positiveMinutes(baselineMinutes, 1)
  const resolvedShortMinutes = positiveMinutes(shortWindowMinutes, DEFAULTS.shortWindowMinutes)
  const baselineRate = safeBaseline / resolvedBaselineMinutes
  if (baselineRate <= 0) return 0
  return safeShort / resolvedShortMinutes / baselineRate
}

/** Recency weight: exponential decay so a 1h-old surge outranks a 12h-old one. */
function recencyWeight(publishedAt: string, halfLifeHours: number, now: Date): number {
  const ageHours = (now.getTime() - Date.parse(publishedAt)) / 3_600_000
  if (!Number.isFinite(ageHours) || ageHours < 0) return 1
  return Math.pow(0.5, ageHours / Math.max(0.25, halfLifeHours))
}

/** Rank stories by a blended trending score = velocity × burst × recency. */
export function detectTrending<T extends StoryCardData>(
  stories: T[],
  samples: EngagementSample[],
  options: TrendingOptions = {},
): TrendingStory<T>[] {
  const shortMinutes = positiveMinutes(
    options.shortWindowMinutes ?? DEFAULTS.shortWindowMinutes,
    DEFAULTS.shortWindowMinutes,
  )
  const requestedBaselineMinutes = positiveMinutes(
    options.baselineWindowMinutes ?? DEFAULTS.baselineWindowMinutes,
    DEFAULTS.baselineWindowMinutes,
  )
  const baseMinutes = Math.max(shortMinutes, requestedBaselineMinutes)
  const precedingBaselineMinutes = Math.max(0, baseMinutes - shortMinutes)
  const minBaseline = finiteNonNegative(options.minBaseline ?? DEFAULTS.minBaseline)
  const recencyHalfLifeHours = positiveMinutes(
    options.recencyHalfLifeHours ?? DEFAULTS.recencyHalfLifeHours,
    DEFAULTS.recencyHalfLifeHours,
  )
  const now = options.now ?? new Date()
  const perArticle = aggregate(samples, now, {
    shortWindowMinutes: shortMinutes,
    baselineWindowMinutes: baseMinutes,
  })

  return stories
    .map((story) => {
      const aggregated = perArticle.get(story.id)
      const shortEngagement = aggregated?.short ?? 0
      const baseline = aggregated?.baseline ?? 0
      const velocity = shortEngagement / shortMinutes
      const burst =
        precedingBaselineMinutes > 0
          ? burstRatio(
              shortEngagement,
              baseline,
              precedingBaselineMinutes,
              shortMinutes,
              minBaseline,
            )
          : 0
      const recency = recencyWeight(story.publishedAt, recencyHalfLifeHours, now)
      const trendingScore = velocity * (1 + Math.min(burst, 10)) * recency
      return { ...story, velocity, burstRatio: burst, trendingScore, baseline } as TrendingStory<T>
    })
    .filter((story) => Number.isFinite(story.trendingScore))
    .sort(
      (left, right) =>
        right.trendingScore - left.trendingScore ||
        right.publishedAt.localeCompare(left.publishedAt),
    )
}

/** Filter samples to a single scope so trending can be computed per-category or province. */
export function scopeSamples(
  samples: EngagementSample[],
  scope: { categorySlug?: string; provinceSlug?: string },
): EngagementSample[] {
  return samples.filter((sample) => {
    if (scope.categorySlug && sample.categorySlug !== scope.categorySlug) return false
    if (scope.provinceSlug && sample.provinceSlug !== scope.provinceSlug) return false
    return true
  })
}
