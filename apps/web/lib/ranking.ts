import type { StoryCardData } from '@nagarikwatch/db'
import { wilsonScore } from '@nagarikwatch/db'
import { stemToken } from './nlp/stemmer'
import { editorialTrustScore } from './editorial/trust-score'

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

/**
 * Transparent virality heuristic, not a predictive model. Share velocity is
 * weighted more heavily than comments and the output saturates in [0, 1).
 */
export function viralityScore({
  shareVelocity = 0,
  commentVelocity = 0,
}: Pick<RankingSignals, 'shareVelocity' | 'commentVelocity'>): number {
  const signal = Math.max(0, shareVelocity ?? 0) * 0.7 + Math.max(0, commentVelocity ?? 0) * 0.3
  return 1 - Math.exp(-signal / 10)
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
  const ranked = stories
    .map((story, index) => {
      const rankSignals = { ...DEFAULT_SIGNALS, ...signalFor(story, index) }
      return {
        ...story,
        rankScore: weightedScore(story, rankSignals, now),
        rankSignals,
      }
    })
    .filter((story) => Number.isFinite(story.rankScore) && !story.rankSignals.doNotRecommend)
    .sort((a, b) => b.rankScore - a.rankScore || b.publishedAt.localeCompare(a.publishedAt))

  return applyHomepageSlotDiversity(ranked)
}

/**
 * Greedy same-category spacing, order-preserving otherwise.
 *
 * Takes the list as given and only moves an item forward when the run of
 * consecutive stories from one desk would exceed `maxSameCategoryStreak`.
 * Anything with a `category.slug` works, so the homepage can use it to pick a
 * rail without dragging in ranking signals it does not compute.
 */
export function spaceOutCategories<T extends { category: { slug: string } }>(
  items: T[],
  maxSameCategoryStreak = 2,
): T[] {
  if (items.length <= 2) return items
  const remaining = [...items]
  const ordered: T[] = []
  let streakCategory = ''
  let streak = 0

  while (remaining.length > 0) {
    let pickIndex = 0
    if (streak >= maxSameCategoryStreak) {
      const alt = remaining.findIndex((item) => item.category.slug !== streakCategory)
      if (alt >= 0) pickIndex = alt
    }
    const [picked] = remaining.splice(pickIndex, 1)
    if (!picked) break
    if (picked.category.slug === streakCategory) streak += 1
    else {
      streakCategory = picked.category.slug
      streak = 1
    }
    ordered.push(picked)
  }
  return ordered
}

/**
 * Soft diversity pass: penalize long same-category streaks so hubs do not
 * stack five politics stories in a row. Editorial CMS homepage order is
 * unchanged — this applies to algorithmic hub ranking only.
 */
export function applyHomepageSlotDiversity<T extends RankedStory>(
  ranked: T[],
  maxSameCategoryStreak = 2,
): T[] {
  if (ranked.length <= 2) return ranked
  let streakCategory = ''
  let streak = 0

  return spaceOutCategories(ranked, maxSameCategoryStreak).map((story) => {
    if (story.category.slug === streakCategory) streak += 1
    else {
      streakCategory = story.category.slug
      streak = 1
    }
    const diversityBoost = streak <= maxSameCategoryStreak ? 1 : Math.max(0, 1 - streak / 5)
    return { ...story, rankSignals: { ...story.rankSignals, diversityBoost } }
  })
}

/**
 * Stemmed content terms for similarity.
 *
 * The previous version lowercased, split, and kept tokens longer than three
 * characters. That discarded short Nepali content words (कर, वन, ऋण) while
 * keeping long function words, and — because nothing was stemmed — treated
 * बजेटमा and बजेटको as unrelated. Both sides run through the same stemmer the
 * search index uses, so "related" and "search" agree on what a word is.
 */
function textTerms(story: StoryCardData): Set<string> {
  const text = `${story.titleNe} ${story.titleEn ?? ''} ${story.deckNe ?? ''} ${story.deckEn ?? ''}`
  const terms = new Set<string>()
  for (const raw of text.toLowerCase().split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)) {
    const token = raw.trim()
    if (token.length < 2) continue
    const stem = stemToken(token)
    if (stem.length >= 2) terms.add(stem)
  }
  return terms
}

/**
 * Inverse document frequency over the candidate pool.
 *
 * Without it every shared word counts the same, so नेपाल — which appears in a
 * large share of Nepali headlines — carries as much similarity as भूकम्प. That
 * is the difference between "related stories" and "other stories".
 */
function inverseDocumentFrequency(termSets: Array<Set<string>>): Map<string, number> {
  const documentFrequency = new Map<string, number>()
  for (const terms of termSets) {
    for (const term of terms) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1)
    }
  }
  const total = Math.max(1, termSets.length)
  const idf = new Map<string, number>()
  for (const [term, frequency] of documentFrequency) {
    idf.set(term, Math.log(1 + total / frequency))
  }
  return idf
}

/** IDF-weighted overlap, normalised so long stories cannot win on length alone. */
function weightedSimilarity(
  source: Set<string>,
  candidate: Set<string>,
  idf: Map<string, number>,
): number {
  let shared = 0
  for (const term of candidate) {
    if (source.has(term)) shared += idf.get(term) ?? 0
  }
  if (shared === 0) return 0
  let sourceMass = 0
  for (const term of source) sourceMass += idf.get(term) ?? 0
  let candidateMass = 0
  for (const term of candidate) candidateMass += idf.get(term) ?? 0
  const denominator = Math.sqrt(Math.max(1e-9, sourceMass * candidateMass))
  return Math.min(1, shared / denominator)
}

/** Share of the source story's tags the candidate also carries. */
function tagOverlap(source: StoryCardData, candidate: StoryCardData): number {
  const sourceTags = new Set((source.tags ?? []).map((tag) => tag.slug))
  if (sourceTags.size === 0) return 0
  const candidateTags = candidate.tags ?? []
  if (candidateTags.length === 0) return 0
  let shared = 0
  for (const tag of candidateTags) if (sourceTags.has(tag.slug)) shared += 1
  return Math.min(1, shared / sourceTags.size)
}

export function relatedByContent(
  story: StoryCardData,
  candidates: StoryCardData[],
  limit = 6,
): StoryCardData[] {
  const pool = candidates.filter((candidate) => candidate.slug !== story.slug)
  const sourceTerms = textTerms(story)
  const candidateTerms = new Map(pool.map((candidate) => [candidate.slug, textTerms(candidate)]))
  const idf = inverseDocumentFrequency([sourceTerms, ...candidateTerms.values()])

  return rankStories(pool, (candidate, index) => {
    const terms = candidateTerms.get(candidate.slug) ?? new Set<string>()
    const lexical = weightedSimilarity(sourceTerms, terms, idf)
    // The newsroom's own topic tags are a stronger statement about what a story
    // is about than any term overlap, and were previously ignored entirely.
    const tags = tagOverlap(story, candidate)
    const topicSimilarity = Math.min(
      1,
      Math.max(lexical, tags * 0.9) + Math.min(lexical, tags) * 0.3,
    )
    const flags = candidate as StoryCardData & Pick<RankingSignals, 'sponsored' | 'doNotRecommend'>
    return {
      editorialPriority: Math.max(0, 1.5 - index / 10),
      categorySimilarity: candidate.category.slug === story.category.slug ? 1 : 0,
      topicSimilarity,
      // Was a flat 0.8 for every candidate, which cancels out and makes the
      // term inert. Scored per story from its own editorial metadata.
      qualityTrustScore: editorialTrustScore(candidate).score,
      sponsored: Boolean(flags.sponsored),
      doNotRecommend: Boolean(flags.doNotRecommend),
    }
  })
    .slice(0, limit)
    .map(({ rankScore: _rankScore, rankSignals: _rankSignals, ...ranked }) => ranked)
}

export {
  ACTIVE_ALGORITHM_REGISTRY,
  ALGORITHM_CATALOG,
  ALGORITHM_ROADMAP,
  algorithmCatalogStats,
  rankAlgorithmsForShipping,
} from './algorithms/catalog'
