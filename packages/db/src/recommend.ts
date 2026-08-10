/**
 * Deterministic newsroom recommendation engine.
 *
 * This is deliberately a transparent hybrid ranker, not an "AI" system. It
 * combines reader interest, immediate session intent, freshness, explicit
 * follows, and a small editorial urgency signal, then applies publication,
 * fatigue, sponsorship, category, author, and source guardrails.
 */
import type { Article, Bookmark, Follow, ReadingHistory, StoryCardData } from './types'
import { coReadRecommend, type InteractionMatrix } from './cf'

export const RECOMMENDER_VERSION = 'nw-hybrid-v3'

export type RecommendableStory = Pick<
  StoryCardData,
  'id' | 'slug' | 'category' | 'titleNe' | 'titleEn' | 'publishedAt' | 'isBreaking' | 'authors'
> & {
  tags?: Array<string | { slug: string }>
  province?: string
  doNotRecommend?: boolean
  sponsored?: boolean
  /** Stable publisher/wire key used only for source-diversity limits. */
  sourceKey?: string
}

export type ReaderProfile = {
  userId?: string
  follows?: Follow[]
  history?: ReadingHistory[]
  bookmarks?: Bookmark[]
}

export type RecommendOptions = {
  limit?: number
  excludeIds?: string[]
  maxPerCategory?: number
  maxPerAuthor?: number
  maxPerSource?: number
  fatigueWindowHours?: number
  /** Sponsored stories are excluded from editorial recommendations by default. */
  includeSponsored?: boolean
  /** Permit small publisher/server clock drift, but reject materially future-dated items. */
  allowedFutureSkewMinutes?: number
  weights?: Partial<
    Record<
      'content' | 'session' | 'sequence' | 'collaborative' | 'freshness' | 'follow' | 'editorial',
      number
    >
  >
  /** Experimental only: requires a consented interaction matrix and sufficient reader volume. */
  collaborative?: {
    enabled: boolean
    interactions: InteractionMatrix
    minReaders?: number
  }
  now?: Date
}

const DEFAULT_WEIGHTS = {
  content: 1,
  session: 0.6,
  sequence: 0.35,
  collaborative: 0.4,
  freshness: 0.8,
  // Explicit follows must outrank same-age freshness so strategy labels stay honest.
  follow: 0.95,
  editorial: 0.5,
} as const

function tokenize(text: string | undefined): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
    .map((term) => term.trim())
    .filter((term) => term.length > 1)
}

export function storyTerms(story: RecommendableStory): Map<string, number> {
  const terms = new Map<string, number>()
  const bump = (term: string, weight = 1) => terms.set(term, (terms.get(term) ?? 0) + weight)

  for (const term of tokenize(story.titleNe)) bump(term, 3)
  for (const term of tokenize(story.titleEn)) bump(term, 3)
  for (const term of tokenize(story.category.nameNe)) bump(term, 2)
  for (const term of tokenize(story.category.nameEn)) bump(term, 2)
  bump(`cat:${story.category.slug}`, 5)
  for (const tag of story.tags ?? []) {
    const slug = typeof tag === 'string' ? tag : tag.slug
    bump(`tag:${slug}`, 4)
  }
  if (story.province) bump(`prov:${story.province}`, 3)
  for (const author of story.authors) bump(`author:${author.slug}`, 4)
  return terms
}

export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let aSq = 0
  let bSq = 0
  for (const value of a.values()) aSq += value * value
  for (const value of b.values()) bSq += value * value
  if (aSq === 0 || bSq === 0) return 0

  const smaller = a.size <= b.size ? a : b
  const larger = a.size <= b.size ? b : a
  for (const [key, value] of smaller) {
    const other = larger.get(key)
    if (other !== undefined) dot += value * other
  }
  return dot / (Math.sqrt(aSq) * Math.sqrt(bSq))
}

export function buildInterestVector(
  profile: ReaderProfile,
  storiesById: Map<string, RecommendableStory>,
  now = new Date(),
  windowHours = 72,
): Map<string, number> {
  const vector = new Map<string, number>()
  const bump = (terms: Map<string, number>, weight: number) => {
    for (const [key, value] of terms) vector.set(key, (vector.get(key) ?? 0) + value * weight)
  }
  const bumpHistoryMetadata = (item: ReadingHistory, weight: number) => {
    if (item.categorySlug)
      vector.set(
        `cat:${item.categorySlug}`,
        (vector.get(`cat:${item.categorySlug}`) ?? 0) + 5 * weight,
      )
    for (const tag of item.tagSlugs ?? [])
      vector.set(`tag:${tag}`, (vector.get(`tag:${tag}`) ?? 0) + 4 * weight)
    for (const author of item.authorSlugs ?? [])
      vector.set(`author:${author}`, (vector.get(`author:${author}`) ?? 0) + 4 * weight)
  }

  const history = [...(profile.history ?? [])].sort((a, b) => b.readAt.localeCompare(a.readAt))
  history.forEach((item, index) => {
    const story = storiesById.get(item.articleId)
    const readAt = Date.parse(item.readAt)
    if (!Number.isFinite(readAt)) return
    const ageHours = Math.max(0, (now.getTime() - readAt) / 3_600_000)
    const recency = Math.max(0, 1 - ageHours / windowHours)
    const position = 1 / (1 + index)
    const completion = item.completed ? 1 : 0.55
    const weight = recency * position * completion * 2
    if (story) bump(storyTerms(story), weight)
    else bumpHistoryMetadata(item, weight)
  })

  for (const bookmark of profile.bookmarks ?? []) {
    const story = storiesById.get(bookmark.articleId)
    if (story) bump(storyTerms(story), 1.5)
  }

  for (const follow of profile.follows ?? []) {
    const prefix =
      follow.kind === 'topic'
        ? 'tag'
        : follow.kind === 'province'
          ? 'prov'
          : follow.kind === 'category'
            ? 'cat'
            : 'author'
    const key = `${prefix}:${follow.targetSlug}`
    vector.set(key, (vector.get(key) ?? 0) + 4)
  }

  return vector
}

export function contentBasedScore(
  candidate: RecommendableStory,
  interest: Map<string, number>,
): number {
  return cosineSimilarity(interest, storyTerms(candidate))
}

export function sessionBasedScore(
  candidate: RecommendableStory,
  recentStories: RecommendableStory[],
): number {
  if (recentStories.length === 0) return 0
  return recentStories.slice(0, 3).reduce((score, story, index) => {
    return score + cosineSimilarity(storyTerms(candidate), storyTerms(story)) / (1 + index)
  }, 0)
}

/**
 * Markov-ish next-category heuristic: estimate transitions out of the latest
 * category from this reader's recent sequence. This is deliberately not
 * described as a trained sequence model.
 */
export function nextCategoryScore(
  candidate: RecommendableStory,
  history: ReadingHistory[],
  storiesById: Map<string, RecommendableStory>,
): number {
  const ordered = [...history].sort((a, b) => a.readAt.localeCompare(b.readAt)).slice(-20)
  const categories = ordered
    .map((item) => item.categorySlug ?? storiesById.get(item.articleId)?.category.slug)
    .filter((category): category is string => Boolean(category))
  const current = categories.at(-1)
  if (!current || categories.length < 3) return 0

  const transitions = new Map<string, number>()
  let total = 0
  for (let index = 0; index < categories.length - 1; index += 1) {
    if (categories[index] !== current) continue
    const next = categories[index + 1]!
    const recencyWeight = (index + 1) / categories.length
    transitions.set(next, (transitions.get(next) ?? 0) + recencyWeight)
    total += recencyWeight
  }
  if (total === 0) return 0
  return (transitions.get(candidate.category.slug) ?? 0) / total
}

export function freshnessScore(publishedAt: string, now = new Date()): number {
  const timestamp = Date.parse(publishedAt)
  if (!Number.isFinite(timestamp)) return 0
  const ageHours = Math.max(0, (now.getTime() - timestamp) / 3_600_000)
  return Math.exp(-ageHours / 24)
}

export function coldStartScore(candidate: RecommendableStory, now = new Date()): number {
  return freshnessScore(candidate.publishedAt, now) + (candidate.isBreaking ? 0.3 : 0)
}

export type RecStrategy =
  | 'content'
  | 'session'
  | 'sequence'
  | 'collaborative'
  | 'freshness'
  | 'follow'
  | 'editorial'
  | 'cold-start'

export type ScoredRecommendation<T extends RecommendableStory = RecommendableStory> = T & {
  recScore: number
  recStrategy: RecStrategy
  recVersion: typeof RECOMMENDER_VERSION
}

type ScoreParts = Record<Exclude<RecStrategy, 'cold-start'>, number>

const STRATEGY_TIEBREAK: Record<Exclude<RecStrategy, 'cold-start'>, number> = {
  follow: 7,
  content: 6,
  collaborative: 5,
  sequence: 4,
  session: 3,
  editorial: 2,
  freshness: 1,
}

function dominantStrategy(parts: ScoreParts): Exclude<RecStrategy, 'cold-start'> {
  return (Object.entries(parts) as [Exclude<RecStrategy, 'cold-start'>, number][]).reduce(
    (best, current) => {
      if (current[1] > best[1] + 1e-9) return current
      if (
        Math.abs(current[1] - best[1]) <= 1e-9 &&
        STRATEGY_TIEBREAK[current[0]] > STRATEGY_TIEBREAK[best[0]]
      ) {
        return current
      }
      return best
    },
  )[0]
}

function isEligible(
  story: RecommendableStory,
  now: Date,
  includeSponsored: boolean,
  allowedFutureSkewMinutes: number,
): boolean {
  if (story.doNotRecommend) return false
  if (story.sponsored && !includeSponsored) return false
  const publishedAt = Date.parse(story.publishedAt)
  if (!Number.isFinite(publishedAt)) return false
  return publishedAt <= now.getTime() + allowedFutureSkewMinutes * 60_000
}

function explicitFollowScore(candidate: RecommendableStory, follows: Follow[]): number {
  let score = 0
  for (const follow of follows) {
    if (follow.kind === 'category' && candidate.category.slug === follow.targetSlug) score += 1
    if (follow.kind === 'province' && candidate.province === follow.targetSlug) score += 1
    if (follow.kind === 'topic' && candidate.tags?.includes(follow.targetSlug)) score += 1
    if (follow.kind === 'author' && candidate.authors.some((a) => a.slug === follow.targetSlug))
      score += 1
  }
  return Math.min(score, 2)
}

export function recommend<T extends RecommendableStory>(
  candidates: T[],
  profile: ReaderProfile,
  options: RecommendOptions = {},
): ScoredRecommendation<T>[] {
  const {
    limit = 6,
    excludeIds = [],
    maxPerCategory = 2,
    maxPerAuthor = 2,
    maxPerSource = 2,
    fatigueWindowHours = 48,
    includeSponsored = false,
    allowedFutureSkewMinutes = 5,
    weights: partialWeights,
    collaborative,
    now = new Date(),
  } = options
  const weights = { ...DEFAULT_WEIGHTS, ...partialWeights }
  const excluded = new Set(excludeIds)

  const storiesById = new Map<string, RecommendableStory>()
  for (const candidate of candidates) storiesById.set(candidate.id, candidate)

  const interest = buildInterestVector(profile, storiesById, now)
  const orderedHistory = [...(profile.history ?? [])].sort((a, b) =>
    b.readAt.localeCompare(a.readAt),
  )
  const recentStories = orderedHistory
    .slice(0, 5)
    .map((item) => storiesById.get(item.articleId))
    .filter((story): story is RecommendableStory => Boolean(story))

  const fatigueCutoff = now.getTime() - fatigueWindowHours * 3_600_000
  const recentlyRead = new Set(
    orderedHistory
      .filter((item) => {
        const timestamp = Date.parse(item.readAt)
        return Number.isFinite(timestamp) && timestamp >= fatigueCutoff
      })
      .map((item) => item.articleId),
  )
  const follows = profile.follows ?? []
  const hasProfileSignal = interest.size > 0 || recentStories.length > 0 || follows.length > 0
  const collaborativeScores = new Map<string, number>()
  const interactionReaders = collaborative ? Object.keys(collaborative.interactions).length : 0
  if (
    collaborative?.enabled &&
    profile.userId &&
    interactionReaders >= (collaborative.minReaders ?? 25)
  ) {
    for (const item of coReadRecommend(collaborative.interactions, profile.userId, {
      limit: candidates.length,
      candidateIds: candidates.map((candidate) => candidate.id),
    })) {
      collaborativeScores.set(item.itemId, item.score)
    }
  }

  const scored = candidates
    .filter(
      (candidate) =>
        !excluded.has(candidate.id) &&
        !recentlyRead.has(candidate.id) &&
        isEligible(candidate, now, includeSponsored, allowedFutureSkewMinutes),
    )
    .map((candidate) => {
      const parts: ScoreParts = {
        content: contentBasedScore(candidate, interest) * weights.content,
        session: sessionBasedScore(candidate, recentStories) * weights.session,
        sequence: nextCategoryScore(candidate, orderedHistory, storiesById) * weights.sequence,
        collaborative: (collaborativeScores.get(candidate.id) ?? 0) * weights.collaborative,
        freshness: freshnessScore(candidate.publishedAt, now) * weights.freshness,
        follow: explicitFollowScore(candidate, follows) * weights.follow,
        editorial: (candidate.isBreaking ? 0.2 : 0) * weights.editorial,
      }
      const recScore = Object.values(parts).reduce((sum, value) => sum + value, 0)
      const recStrategy: RecStrategy = hasProfileSignal ? dominantStrategy(parts) : 'cold-start'
      return {
        ...candidate,
        recScore,
        recStrategy,
        recVersion: RECOMMENDER_VERSION,
      } satisfies ScoredRecommendation<T>
    })
    .sort((a, b) => b.recScore - a.recScore || b.publishedAt.localeCompare(a.publishedAt))

  const output: ScoredRecommendation<T>[] = []
  const perCategory = new Map<string, number>()
  const perAuthor = new Map<string, number>()
  const perSource = new Map<string, number>()

  for (const item of scored) {
    if (output.length >= limit) break
    const categoryKey = item.category.slug
    const authorKey = item.authors[0]?.slug
    const sourceKey = item.sourceKey
    if ((perCategory.get(categoryKey) ?? 0) >= maxPerCategory) continue
    if (authorKey && (perAuthor.get(authorKey) ?? 0) >= maxPerAuthor) continue
    if (sourceKey && (perSource.get(sourceKey) ?? 0) >= maxPerSource) continue

    perCategory.set(categoryKey, (perCategory.get(categoryKey) ?? 0) + 1)
    if (authorKey) perAuthor.set(authorKey, (perAuthor.get(authorKey) ?? 0) + 1)
    if (sourceKey) perSource.set(sourceKey, (perSource.get(sourceKey) ?? 0) + 1)
    output.push(item)
  }

  return output
}

export function continueReading(
  profile: ReaderProfile,
  now = new Date(),
  windowHours = 72,
): string | null {
  const cutoff = now.getTime() - windowHours * 3_600_000
  const candidate = (profile.history ?? [])
    .filter((item) => {
      const timestamp = Date.parse(item.readAt)
      return !item.completed && Number.isFinite(timestamp) && timestamp >= cutoff
    })
    .sort((a, b) => b.readAt.localeCompare(a.readAt))[0]
  return candidate?.articleId ?? null
}

export function articleToRecommendable(article: Article): RecommendableStory {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category,
    titleNe: article.titleNe,
    titleEn: article.titleEn,
    publishedAt: article.publishedAt,
    isBreaking: article.isBreaking,
    authors: article.authors,
    tags: article.tags.map((tag) => tag.slug),
    province: article.province,
    doNotRecommend: article.doNotRecommend,
    sponsored: article.sponsored,
    sourceKey: article.source?.sourceName,
  }
}

export const RECOMMENDATION_ROADMAP = [
  'content-based-filtering',
  'session-based-recommendation',
  'next-category-sequence-heuristic',
  'cold-start-fallback',
  'hybrid-recommender-v3',
  'consent-aware-event-store-required',
  'collaborative-filtering-baseline-volume-gated',
  'embedding-similarity-not-implemented',
] as const
