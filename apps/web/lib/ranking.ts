import type { StoryCardData } from '@nagarikwatch/db'
import { wilsonScore } from '@nagarikwatch/db'

export { wilsonScore }

export type RankingSignals = {
  editorialPriority?: number
  viewsPerHour?: number
  viewsLast10Min?: number
  baselineViewsPer10Min?: number
  impressions?: number
  clicks?: number
  conversions?: number
  sharesPerHour?: number
  commentsPerHour?: number
  shareVelocity?: number
  commentVelocity?: number
  bookmarkVelocity?: number
  readingCompletion?: number
  dwellTimeSeconds?: number
  topicSimilarity?: number
  categorySimilarity?: number
  provinceRelevance?: number
  authorAffinity?: number
  userPreference?: number
  diversityBoost?: number
  fatiguePenalty?: number
  qualityTrustScore?: number
  ltvScore?: number
  premium?: boolean
  sponsored?: boolean
  doNotRecommend?: boolean
}

export type RankedStory<T extends StoryCardData = StoryCardData> = T & {
  rankScore: number
  rankSignals: Required<Omit<RankingSignals, 'sponsored' | 'doNotRecommend'>> & {
    sponsored: boolean
    doNotRecommend: boolean
  }
}

const DEFAULT_SIGNALS: RankedStory['rankSignals'] = {
  editorialPriority: 0,
  viewsPerHour: 0,
  viewsLast10Min: 0,
  baselineViewsPer10Min: 0,
  impressions: 0,
  clicks: 0,
  conversions: 0,
  sharesPerHour: 0,
  commentsPerHour: 0,
  shareVelocity: 0,
  commentVelocity: 0,
  bookmarkVelocity: 0,
  readingCompletion: 0,
  dwellTimeSeconds: 0,
  topicSimilarity: 0,
  categorySimilarity: 0,
  provinceRelevance: 0,
  authorAffinity: 0,
  userPreference: 0,
  diversityBoost: 0,
  fatiguePenalty: 0,
  qualityTrustScore: 0,
  ltvScore: 0,
  premium: false,
  sponsored: false,
  doNotRecommend: false,
}

function hoursSince(dateIso: string, now: Date): number {
  const then = Date.parse(dateIso)
  if (!Number.isFinite(then)) return 999
  return Math.max(0, (now.getTime() - then) / 3_600_000)
}

export function timeDecayScore(publishedAt: string, now = new Date()): number {
  const ageHours = hoursSince(publishedAt, now)
  return 100 / Math.pow(1 + ageHours / 18, 1.35)
}

export function bayesianAverage({
  clicks = 0,
  impressions = 0,
  priorMean = 0.08,
  priorWeight = 50,
}: {
  clicks?: number
  impressions?: number
  priorMean?: number
  priorWeight?: number
}): number {
  const safeImpressions = Math.max(0, impressions)
  const safeClicks = Math.min(Math.max(0, clicks), safeImpressions)
  return (priorMean * priorWeight + safeClicks) / (priorWeight + safeImpressions)
}

export function velocityScore({
  viewsLast10Min = 0,
  baselineViewsPer10Min = 1,
}: Pick<RankingSignals, 'viewsLast10Min' | 'baselineViewsPer10Min'>): number {
  const baseline = Math.max(1, baselineViewsPer10Min ?? 1)
  return Math.log1p(Math.max(0, viewsLast10Min ?? 0) / baseline)
}

export function burstScore({
  viewsLast10Min = 0,
  baselineViewsPer10Min = 1,
}: Pick<RankingSignals, 'viewsLast10Min' | 'baselineViewsPer10Min'>): number {
  const baseline = Math.max(1, baselineViewsPer10Min ?? 1)
  const ratio = Math.max(0, viewsLast10Min ?? 0) / baseline
  return ratio >= 5 ? Math.min(3, Math.log(ratio)) : 0
}

export function banditExplorationScore({
  impressions = 0,
  clicks = 0,
  totalImpressions = 1,
}: {
  impressions?: number
  clicks?: number
  totalImpressions?: number
}): number {
  const n = Math.max(1, impressions)
  const total = Math.max(n + 1, totalImpressions)
  const mean = clicks / n
  return mean + Math.sqrt((2 * Math.log(total)) / n)
}

export function ltvEngagementScore({
  dwellTimeSeconds = 0,
  readingCompletion = 0,
  bookmarkVelocity = 0,
  shareVelocity = 0,
  conversions = 0,
}: Pick<
  RankingSignals,
  'dwellTimeSeconds' | 'readingCompletion' | 'bookmarkVelocity' | 'shareVelocity' | 'conversions'
>): number {
  return (
    Math.min(1, (dwellTimeSeconds ?? 0) / 180) * 0.3 +
    Math.min(1, readingCompletion ?? 0) * 0.3 +
    Math.min(1, (bookmarkVelocity ?? 0) / 8) * 0.15 +
    Math.min(1, (shareVelocity ?? 0) / 8) * 0.15 +
    Math.min(1, (conversions ?? 0) / 3) * 0.1
  )
}

export function weightedScore(
  story: StoryCardData,
  signals: RankingSignals = {},
  now = new Date(),
) {
  const merged = { ...DEFAULT_SIGNALS, ...signals }
  if (merged.doNotRecommend) return Number.NEGATIVE_INFINITY

  const bayesianCtr = bayesianAverage({
    clicks: merged.clicks,
    impressions: merged.impressions,
  })
  const velocity = velocityScore(merged)
  const burst = burstScore(merged)
  const bandit = banditExplorationScore({
    impressions: merged.impressions,
    clicks: merged.clicks,
    totalImpressions: Math.max(1, merged.impressions + merged.viewsPerHour * 24),
  })
  const ltv = merged.ltvScore || ltvEngagementScore(merged)

  const engagementScore =
    Math.log1p(merged.viewsPerHour) * 4 +
    bayesianCtr * 80 +
    velocity * 14 +
    burst * 18 +
    bandit * 7 +
    ltv * 16 +
    Math.log1p(merged.sharesPerHour) * 8 +
    Math.log1p(merged.commentsPerHour) * 3 +
    Math.log1p(merged.shareVelocity) * 6 +
    Math.log1p(merged.commentVelocity) * 4 +
    Math.log1p(merged.bookmarkVelocity) * 7 +
    merged.readingCompletion * 8 +
    Math.log1p(merged.dwellTimeSeconds) * 1.2

  const score =
    merged.editorialPriority * 18 +
    timeDecayScore(story.publishedAt, now) +
    engagementScore +
    merged.topicSimilarity * 12 +
    merged.categorySimilarity * 10 +
    merged.provinceRelevance * 8 +
    merged.authorAffinity * 7 +
    merged.userPreference * 10 +
    merged.diversityBoost * 6 +
    merged.qualityTrustScore * 9 -
    merged.fatiguePenalty * 16 -
    (merged.sponsored ? 20 : 0)

  return Number.isFinite(score) ? score : 0
}

export function rankStories<T extends StoryCardData>(
  stories: T[],
  signalFor: (story: T, index: number) => RankingSignals = () => ({}),
  now = new Date(),
): RankedStory<T>[] {
  return stories
    .map((story, index) => {
      const rankSignals = { ...DEFAULT_SIGNALS, ...signalFor(story, index) }
      return {
        ...story,
        rankScore: weightedScore(story, rankSignals, now),
        rankSignals,
      }
    })
    .filter((story) => Number.isFinite(story.rankScore))
    .sort((a, b) => b.rankScore - a.rankScore || b.publishedAt.localeCompare(a.publishedAt))
}

function textTerms(story: StoryCardData): Set<string> {
  return new Set(
    `${story.titleNe} ${story.titleEn ?? ''} ${story.deckNe ?? ''} ${story.deckEn ?? ''}`
      .toLowerCase()
      .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
      .map((term) => term.trim())
      .filter((term) => term.length > 3),
  )
}

export function relatedByContent(
  story: StoryCardData,
  candidates: StoryCardData[],
  limit = 6,
): StoryCardData[] {
  const sourceTerms = textTerms(story)
  return rankStories(
    candidates.filter((candidate) => candidate.slug !== story.slug),
    (candidate, index) => {
      const candidateTerms = textTerms(candidate)
      let overlap = 0
      for (const term of candidateTerms) if (sourceTerms.has(term)) overlap += 1
      const topicSimilarity = Math.min(
        1,
        overlap / Math.max(1, Math.min(sourceTerms.size, candidateTerms.size)),
      )
      const flags = candidate as StoryCardData &
        Pick<RankingSignals, 'sponsored' | 'doNotRecommend'>
      return {
        editorialPriority: Math.max(0, 1.5 - index / 10),
        categorySimilarity: candidate.category.slug === story.category.slug ? 1 : 0,
        topicSimilarity,
        qualityTrustScore: 0.8,
        sponsored: Boolean(flags.sponsored),
        doNotRecommend: Boolean(flags.doNotRecommend),
      }
    },
  )
    .slice(0, limit)
    .map(({ rankScore: _rankScore, rankSignals: _rankSignals, ...ranked }) => ranked)
}

export const ALGORITHM_ROADMAP = [
  'weighted-scoring-ranker',
  'time-decay-ranking',
  'trending-detection',
  'velocity-ranking',
  'burst-detection',
  'multi-armed-bandit',
  'bayesian-ranking',
  'wilson-score-ranking',
  'content-based-filtering',
  'session-based-recommendation',
  'hybrid-recommender',
] as const


export const ACTIVE_ALGORITHM_REGISTRY = [
  { id: 'weighted-scoring-ranker', label: 'Weighted Scoring Ranker', surface: 'homepage/category/trending' },
  { id: 'time-decay-ranking', label: 'Time Decay Algorithm', surface: 'latest and breaking news' },
  { id: 'trending-detection', label: 'Trending Detection', surface: 'trending pages and admin live panel' },
  { id: 'velocity-ranking', label: 'Velocity Ranking', surface: 'ranking engine' },
  { id: 'burst-detection', label: 'Burst Detection', surface: 'breaking/election/disaster spikes' },
  { id: 'multi-armed-bandit', label: 'Multi-Armed Bandit', surface: 'headline/layout experiments' },
  { id: 'bayesian-ranking', label: 'Bayesian Ranking', surface: 'low-sample bias correction' },
  { id: 'wilson-score-ranking', label: 'Wilson Score Ranking', surface: 'comments and community scores' },
  { id: 'content-based-filtering', label: 'Content-Based Filtering', surface: 'related stories' },
  { id: 'session-based-recommendation', label: 'Session-Based Recommendation', surface: 'saved/recommended modules' },
  { id: 'ltv-engagement-score', label: 'LTV / Engagement Score', surface: 'admin live panel and recommendations' },
] as const
