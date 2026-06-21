import type { StoryCardData } from '@nagarikwatch/db'

export type RankingSignals = {
  editorialPriority?: number
  viewsPerHour?: number
  sharesPerHour?: number
  commentsPerHour?: number
  topicSimilarity?: number
  categorySimilarity?: number
  provinceRelevance?: number
  userPreference?: number
  diversityBoost?: number
  fatiguePenalty?: number
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
  sharesPerHour: 0,
  commentsPerHour: 0,
  topicSimilarity: 0,
  categorySimilarity: 0,
  provinceRelevance: 0,
  userPreference: 0,
  diversityBoost: 0,
  fatiguePenalty: 0,
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

export function weightedScore(
  story: StoryCardData,
  signals: RankingSignals = {},
  now = new Date(),
) {
  const merged = { ...DEFAULT_SIGNALS, ...signals }
  if (merged.doNotRecommend) return Number.NEGATIVE_INFINITY

  const engagementScore =
    Math.log1p(merged.viewsPerHour) * 4 +
    Math.log1p(merged.sharesPerHour) * 8 +
    Math.log1p(merged.commentsPerHour) * 3

  const score =
    merged.editorialPriority * 18 +
    timeDecayScore(story.publishedAt, now) +
    engagementScore +
    merged.topicSimilarity * 12 +
    merged.categorySimilarity * 10 +
    merged.provinceRelevance * 8 +
    merged.userPreference * 10 +
    merged.diversityBoost * 6 -
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

export function relatedByContent(
  story: StoryCardData,
  candidates: StoryCardData[],
  limit = 6,
): StoryCardData[] {
  return rankStories(
    candidates.filter((candidate) => candidate.slug !== story.slug),
    (candidate) => ({
      categorySimilarity: candidate.category.slug === story.category.slug ? 1 : 0,
      topicSimilarity: candidate.titleNe
        .split(' ')
        .some((term) => term.length > 3 && story.titleNe.includes(term))
        ? 0.6
        : 0,
    }),
  )
    .slice(0, limit)
    .map(({ rankScore: _rankScore, rankSignals: _rankSignals, ...ranked }) => ranked)
}

export function wilsonScore(upvotes: number, downvotes: number, confidence = 1.96): number {
  const n = upvotes + downvotes
  if (n === 0) return 0
  const phat = upvotes / n
  const z = confidence
  return (
    (phat + (z * z) / (2 * n) - z * Math.sqrt((phat * (1 - phat) + (z * z) / (4 * n)) / n)) /
    (1 + (z * z) / n)
  )
}

export const ALGORITHM_ROADMAP = [
  'weighted-scoring-ranker',
  'time-decay-ranking',
  'trending-detection',
  'velocity-ranking',
  'burst-detection',
  'multi-armed-bandit-placeholder',
  'bayesian-ranking-placeholder',
  'wilson-score-ranking',
  'content-based-filtering',
  'collaborative-filtering-placeholder',
  'matrix-factorization-placeholder',
  'embedding-similarity-placeholder',
  'session-based-recommendation',
  'hybrid-recommender',
] as const
