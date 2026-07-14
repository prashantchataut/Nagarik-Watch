/**
 * Trending, velocity, and burst detection — pure functions that turn a stream
 * of per-article engagement samples into a ranked trending list. Nothing here
 * touches the network or a store: callers pass samples in, get scores out.
 *
 * Concepts:
 *   - Velocity: engagement rate over a short window (e.g. views/minute).
 *   - Burst: a sudden spike relative to the article's own baseline.
 *   - Trending: velocity weighted by recency, scoped per category/province so
 *     a KPL cricket story does not drown out a national-politics surge.
 *
 * The detectors are designed to run on a rolling sample buffer kept by the
 * ingestion layer (packages/ingest). Until that buffer is wired, the web app
 * falls back to the editorial + freshness ranker in apps/web/lib/ranking.ts.
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
  /** Longer window for the baseline (minutes). */
  baselineWindowMinutes?: number
  /** Minimum baseline before burst ratio is meaningful (anti-noise). */
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

/** Sum a sample's weighted engagement (views dominate, shares/comments amplify). */
function weightOf(s: EngagementSample): number {
  return s.views + s.shares * 6 + s.comments * 3
}

type ResolvedWindows = {
  shortWindowMinutes: number
  baselineWindowMinutes: number
}

/** Aggregate samples per article, splitting into short-window vs baseline pools. */
function aggregate(samples: EngagementSample[], now: Date, opts: ResolvedWindows) {
  const shortMs = opts.shortWindowMinutes * 60_000
  const baseMs = opts.baselineWindowMinutes * 60_000
  const perArticle = new Map<
    string,
    { short: number; baseline: number; lastAt: number; samples: EngagementSample[] }
  >()

  for (const s of samples) {
    const t = Date.parse(s.at)
    if (!Number.isFinite(t)) continue
    const age = now.getTime() - t
    if (age > baseMs) continue
    const bucket = perArticle.get(s.articleId) ?? { short: 0, baseline: 0, lastAt: 0, samples: [] }
    bucket.samples.push(s)
    bucket.lastAt = Math.max(bucket.lastAt, t)
    if (age <= shortMs) bucket.short += weightOf(s)
    bucket.baseline += weightOf(s)
    perArticle.set(s.articleId, bucket)
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
  const cutoff = now.getTime() - windowMinutes * 60_000
  const sum = samples
    .filter((s) => s.articleId === articleId && Date.parse(s.at) >= cutoff)
    .reduce((acc, s) => acc + weightOf(s), 0)
  return sum / Math.max(1, windowMinutes)
}

/** Burst ratio = short-window rate divided by the article's own baseline rate.
 *  Returns 0 when there is not enough baseline signal to judge a burst. */
export function burstRatio(
  shortWindow: number,
  baseline: number,
  baselineWindow: number,
  minBaseline = DEFAULTS.minBaseline,
): number {
  if (baseline < minBaseline) return 0
  const baselinePerWindow = (baseline / Math.max(1, baselineWindow)) * DEFAULTS.shortWindowMinutes
  if (baselinePerWindow === 0) return 0
  return shortWindow / baselinePerWindow
}

/** Recency weight: exponential decay so a 1h-old surge outranks a 12h-old one. */
function recencyWeight(publishedAt: string, halfLifeHours: number, now: Date): number {
  const ageHours = (now.getTime() - Date.parse(publishedAt)) / 3_600_000
  if (!Number.isFinite(ageHours) || ageHours < 0) return 1
  return Math.pow(0.5, ageHours / halfLifeHours)
}

/** Rank stories by a blended trending score = velocity × burst × recency.
 *  Scope with category/province filters to get per-section trending. */
export function detectTrending<T extends StoryCardData>(
  stories: T[],
  samples: EngagementSample[],
  options: TrendingOptions = {},
): TrendingStory<T>[] {
  const opts = { ...DEFAULTS, ...options }
  const now = opts.now ?? new Date()
  const perArticle = aggregate(samples, now, opts)

  const shortMinutes = opts.shortWindowMinutes
  const baseMinutes = opts.baselineWindowMinutes

  return stories
    .map((story) => {
      const agg = perArticle.get(story.id)
      const velocity = agg ? agg.short / Math.max(1, shortMinutes) : 0
      const baseline = agg?.baseline ?? 0
      const burst = burstRatio(agg?.short ?? 0, baseline, baseMinutes, opts.minBaseline)
      const recency = recencyWeight(story.publishedAt, opts.recencyHalfLifeHours, now)
      const trendingScore = velocity * (1 + Math.min(burst, 10)) * recency
      return { ...story, velocity, burstRatio: burst, trendingScore, baseline } as TrendingStory<T>
    })
    .filter((s) => Number.isFinite(s.trendingScore))
    .sort((a, b) => b.trendingScore - a.trendingScore || b.publishedAt.localeCompare(a.publishedAt))
}

/** Filter samples to a single scope so trending can be computed per-category or
 *  per-province without re-aggregating the whole stream. */
export function scopeSamples(
  samples: EngagementSample[],
  scope: { categorySlug?: string; provinceSlug?: string },
): EngagementSample[] {
  return samples.filter((s) => {
    if (scope.categorySlug && s.categorySlug !== scope.categorySlug) return false
    if (scope.provinceSlug && s.provinceSlug !== scope.provinceSlug) return false
    return true
  })
}
