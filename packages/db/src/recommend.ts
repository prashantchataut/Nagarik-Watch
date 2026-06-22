/**
 * Recommendation engine — pure, framework-agnostic, shared across web and any
 * future API worker. Built as composable strategies so a surface can mix
 * content-based scoring with session recency and apply diversity guardrails,
 * all without a database round-trip (callers pass the candidate set in).
 *
 * Strategies implemented (the rest of the Phase 7 roadmap — collaborative
 * filtering, matrix factorization, embeddings — are flagged as placeholders
 * below and in ALGORITHM_ROADMAP so they are discoverable without being
 * faked as live):
 *   - contentBased (TF-style term vectors over title + category + tags)
 *   - sessionBased (recency-weighted reuse of the session's read signals)
 *   - coldStart (fallback when there is no profile or session)
 *   - hybrid (weighted blend of the above, with diversity + fatigue)
 *
 * Everything here is deterministic and side-effect free, which makes the
 * strategies unit-testable in isolation (see recommend.test.ts).
 */
import type { Article, Bookmark, Follow, ReadingHistory, StoryCardData } from './types'

export type RecommendableStory = Pick<
  StoryCardData,
  'id' | 'slug' | 'category' | 'titleNe' | 'titleEn' | 'publishedAt' | 'isBreaking'
> & { tags?: string[]; province?: string; doNotRecommend?: boolean; sponsored?: boolean }

export type ReaderProfile = {
  userId?: string
  /** Slugs the reader follows (topics, authors, provinces, categories). */
  follows?: Follow[]
  /** Recently read articles, most-recent first. */
  history?: ReadingHistory[]
  /** Saved articles. */
  bookmarks?: Bookmark[]
}

export type RecommendOptions = {
  limit?: number
  /** Hard exclude these ids (e.g. the article the reader is currently on). */
  excludeIds?: string[]
  /** Hard exclude categories already saturated in the result (diversity guardrail). */
  maxPerCategory?: number
  /** Penalize articles the reader has already seen (fatigue). */
  fatigueWindowHours?: number
  /** Weight blend for the hybrid strategy. Defaults favour content + freshness. */
  weights?: Partial<Record<'content' | 'session' | 'freshness' | 'follow' | 'editorial', number>>
  now?: Date
}

const DEFAULT_WEIGHTS = {
  content: 1.0,
  session: 0.6,
  freshness: 0.8,
  follow: 0.7,
  editorial: 0.5,
} as const

/** Tokenize a headline into lowercased term fragments. Devanagari splits on
 *  punctuation and the danda (।); Latin splits on whitespace. Stops are not
 *  removed — the corpus is small enough that rare-term signal dominates. */
function tokenize(text: string | undefined): string[] {
  if (!text) return []
  return text
    .toLowerCase()
    .split(/[\s\u0964\u0965,.!?;:()"']+|\|/u)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
}

/** Build a sparse term-frequency map for a story's text features. */
export function storyTerms(story: RecommendableStory): Map<string, number> {
  const terms = new Map<string, number>()
  const bump = (t: string, weight = 1) => terms.set(t, (terms.get(t) ?? 0) + weight)
  for (const t of tokenize(story.titleNe)) bump(t, 3)
  for (const t of tokenize(story.titleEn)) bump(t, 3)
  for (const t of tokenize(story.category.nameNe)) bump(t, 2)
  for (const t of tokenize(story.category.nameEn)) bump(t, 2)
  bump(`cat:${story.category.slug}`, 5)
  for (const tag of story.tags ?? []) bump(`tag:${tag}`, 4)
  if (story.province) bump(`prov:${story.province}`, 3)
  return terms
}

/** Cosine similarity between two term-frequency maps. Returns 0..1. */
export function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0
  let aSq = 0
  let bSq = 0
  for (const [, v] of a) aSq += v * v
  for (const [, v] of b) bSq += v * v
  if (aSq === 0 || bSq === 0) return 0
  const smaller = a.size <= b.size ? a : b
  const larger = a.size <= b.size ? b : a
  for (const [k, v] of smaller) {
    const w = larger.get(k)
    if (w !== undefined) dot += v * w
  }
  return dot / (Math.sqrt(aSq) * Math.sqrt(bSq))
}

/** Build a reader interest vector from history + bookmarks + follows. Recent
 *  reads weigh more (linear recency decay over the window). */
export function buildInterestVector(
  profile: ReaderProfile,
  storiesById: Map<string, RecommendableStory>,
  now = new Date(),
  windowHours = 72,
): Map<string, number> {
  const vec = new Map<string, number>()
  const bump = (terms: Map<string, number>, weight: number) => {
    for (const [k, v] of terms) vec.set(k, (vec.get(k) ?? 0) + v * weight)
  }

  const history = [...(profile.history ?? [])].sort((a, b) => b.readAt.localeCompare(a.readAt))
  history.forEach((h, i) => {
    const story = storiesById.get(h.articleId)
    if (!story) return
    const ageHours = (now.getTime() - Date.parse(h.readAt)) / 3_600_000
    const recency = Math.max(0, 1 - ageHours / windowHours)
    const position = 1 / (1 + i)
    bump(storyTerms(story), recency * position * 2)
  })

  for (const b of profile.bookmarks ?? []) {
    const story = storiesById.get(b.articleId)
    if (story) bump(storyTerms(story), 1.5)
  }

  for (const f of profile.follows ?? []) {
    const key =
      f.kind === 'topic'
        ? `tag:${f.targetSlug}`
        : f.kind === 'province'
          ? `prov:${f.targetSlug}`
          : f.kind === 'category'
            ? `cat:${f.targetSlug}`
            : `author:${f.targetSlug}`
    vec.set(key, (vec.get(key) ?? 0) + 4)
  }

  return vec
}

/** Content-based score: cosine similarity between the reader interest vector
 *  and the candidate's term vector. */
export function contentBasedScore(
  candidate: RecommendableStory,
  interest: Map<string, number>,
): number {
  return cosineSimilarity(interest, storyTerms(candidate))
}

/** Session-based score: candidates that share terms with the most-recently-read
 *  story get a recency-weighted boost. Cheaper than the full interest vector and
 *  used to amplify "just now" intent. */
export function sessionBasedScore(
  candidate: RecommendableStory,
  recentStories: RecommendableStory[],
): number {
  if (recentStories.length === 0) return 0
  const head = recentStories.slice(0, 3)
  let score = 0
  head.forEach((s, i) => {
    const weight = 1 / (1 + i)
    score += cosineSimilarity(storyTerms(candidate), storyTerms(s)) * weight
  })
  return score
}

/** Freshness score: exponential decay over 24h. Used as a tiebreaker and a
 *  guard against surfacing stale stories in the "for you" feed. */
export function freshnessScore(publishedAt: string, now = new Date()): number {
  const ageHours = (now.getTime() - Date.parse(publishedAt)) / 3_600_000
  if (!Number.isFinite(ageHours) || ageHours < 0) return 1
  return Math.exp(-ageHours / 24)
}

/** Cold-start fallback: when there is no profile signal, rank by editorial
 *  priority + freshness + breaking flag. This is the "anonymous homepage" path. */
export function coldStartScore(candidate: RecommendableStory, now = new Date()): number {
  const fresh = freshnessScore(candidate.publishedAt, now)
  const breaking = candidate.isBreaking ? 0.3 : 0
  const sponsored = candidate.sponsored ? -0.4 : 0
  return fresh + breaking + sponsored
}

export type RecStrategy =
  | 'content'
  | 'session'
  | 'freshness'
  | 'follow'
  | 'editorial'
  | 'cold-start'

export type ScoredRecommendation<T extends RecommendableStory = RecommendableStory> = T & {
  recScore: number
  recStrategy: RecStrategy
}

/** Top-level hybrid recommender. Mixes content/session/freshness/follow signals,
 *  applies fatigue + diversity guardrails, and tags each result with the
 *  dominant strategy so editors can audit why something surfaced. */
export function recommend<T extends RecommendableStory>(
  candidates: T[],
  profile: ReaderProfile,
  options: RecommendOptions = {},
): ScoredRecommendation<T>[] {
  const {
    limit = 6,
    excludeIds = [],
    maxPerCategory = 2,
    fatigueWindowHours = 48,
    weights: partialWeights,
    now = new Date(),
  } = options
  const weights = { ...DEFAULT_WEIGHTS, ...partialWeights }

  const storiesById = new Map<string, RecommendableStory>()
  for (const c of candidates) storiesById.set(c.id, c)

  const interest = buildInterestVector(profile, storiesById, now)
  const recentIds = (profile.history ?? [])
    .sort((a, b) => b.readAt.localeCompare(a.readAt))
    .slice(0, 5)
    .map((h) => h.articleId)
  const recentStories = recentIds
    .map((id) => storiesById.get(id))
    .filter((s): s is RecommendableStory => Boolean(s))

  const excluded = new Set(excludeIds)
  const recentlyRead = new Set(recentIds)
  const fatigueCutoff = now.getTime() - fatigueWindowHours * 3_600_000

  const followSet = new Set((profile.follows ?? []).map((f) => f.targetSlug))

  const scored = candidates
    .filter((c) => !excluded.has(c.id) && !c.doNotRecommend)
    .map((c) => {
      const content = contentBasedScore(c, interest) * weights.content
      const session = sessionBasedScore(c, recentStories) * weights.session
      const fresh = freshnessScore(c.publishedAt, now) * weights.freshness
      const catFollowed = followSet.has(c.category.slug) ? 1 : 0
      const provFollowed = c.province && followSet.has(c.province) ? 1 : 0
      const follow = (catFollowed + provFollowed) * weights.follow
      const editorial = (c.isBreaking ? 0.2 : 0) * weights.editorial

      const recScore = content + session + fresh + follow + editorial

      const dominant: RecStrategy =
        interest.size === 0 && recentStories.length === 0
          ? 'cold-start'
          : content >= session && content >= fresh
            ? 'content'
            : session >= fresh
              ? 'session'
              : 'freshness'

      return { ...c, recScore, recStrategy: dominant } satisfies ScoredRecommendation<T>
    })

  const out: ScoredRecommendation<T>[] = []
  const perCategory = new Map<string, number>()
  for (const item of scored.sort((a, b) => b.recScore - a.recScore)) {
    if (out.length >= limit) break
    const seen = perCategory.get(item.category.slug) ?? 0
    if (seen >= maxPerCategory) continue
    if (recentlyRead.has(item.id) && Date.parse(item.publishedAt) < fatigueCutoff) continue
    perCategory.set(item.category.slug, seen + 1)
    out.push(item)
  }

  return out
}

/** "Continue reading" surface: the most-recent unfinished read, resurfaced.
 *  Returns at most one so callers can pin it above the feed. */
export function continueReading(
  profile: ReaderProfile,
  now = new Date(),
  windowHours = 72,
): string | null {
  const cutoff = now.getTime() - windowHours * 3_600_000
  const candidate = (profile.history ?? [])
    .filter((h) => !h.completed && Date.parse(h.readAt) >= cutoff)
    .sort((a, b) => b.readAt.localeCompare(a.readAt))[0]
  return candidate?.articleId ?? null
}

/** Convert a full Article (which carries tags + province) into the lighter
 *  RecommendableStory shape without dragging the body blocks into the recommender. */
export function articleToRecommendable(article: Article): RecommendableStory {
  return {
    id: article.id,
    slug: article.slug,
    category: article.category,
    titleNe: article.titleNe,
    titleEn: article.titleEn,
    publishedAt: article.publishedAt,
    isBreaking: article.isBreaking,
    tags: article.tags.map((t) => t.slug),
    province: article.province,
    doNotRecommend: article.doNotRecommend,
    sponsored: article.sponsored,
  }
}

/** Collaborative filtering, matrix factorization, and embedding similarity are
 *  intentionally NOT implemented here — they require a persistent signal store
 *  (a warehouse or vector index) that does not exist yet. These wrappers make
 *  the roadmap explicit so a future worker knows where to plug in. */
export const RECOMMENDATION_ROADMAP = [
  'content-based-filtering',
  'session-based-recommendation',
  'cold-start-fallback',
  'hybrid-recommender',
  'collaborative-filtering-placeholder',
  'matrix-factorization-placeholder',
  'embedding-similarity-placeholder',
  'k-nn-placeholder',
  'sequential-prediction-placeholder',
] as const
