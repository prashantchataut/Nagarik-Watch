import type { StoryCardData } from '@nagarikwatch/db'
import type { ReaderAffinity } from './personalize'

const DAY_MS = 86_400_000

/**
 * Civic-importance weight per category, mirroring the `digest-story-ranking`
 * heuristic's `civicWeight` input. Categories with direct public-accountability
 * value (governance, health, education) rank ahead of lifestyle sections when
 * everything else is equal. Unknown categories fall back to 0.35.
 */
export const CIVIC_CATEGORY_WEIGHTS: Record<string, number> = {
  politics: 1,
  society: 0.8,
  health: 0.7,
  education: 0.65,
  business: 0.6,
  world: 0.55,
  technology: 0.5,
  opinion: 0.5,
  interview: 0.4,
  literature: 0.35,
  'photo-story': 0.35,
  video: 0.35,
  entertainment: 0.3,
  sports: 0.3,
  diaspora: 0.4,
}

const DEFAULT_CIVIC_WEIGHT = 0.35

export function civicWeightFor(story: StoryCardData): number {
  const base = CIVIC_CATEGORY_WEIGHTS[story.category.slug] ?? DEFAULT_CIVIC_WEIGHT
  return story.isBreaking ? Math.min(1, base + 0.25) : base
}

/** Freshness decay over a 72h digest window — same shape as `reengagement-ranking`'s `freshness`. */
export function noveltyOf(story: StoryCardData, now = new Date()): number {
  const publishedAt = Date.parse(story.publishedAt)
  if (!Number.isFinite(publishedAt)) return 0
  const ageMs = Math.max(0, now.getTime() - publishedAt)
  const ageDays = ageMs / DAY_MS
  return Math.max(0, Math.min(1, 1 - ageDays / 3))
}

/** How strongly a story matches the reader's known category/topic/author affinity, 0..1. */
export function affinityMatchOf(story: StoryCardData, affinity?: ReaderAffinity | null): number {
  if (!affinity) return 0
  const categoryWeight = affinity.categories.get(story.category.slug) ?? 0
  const topicWeight = story.tags?.reduce((sum, tag) => sum + (affinity.topics.get(tag.slug) ?? 0), 0) ?? 0
  const authorWeight = story.authors.reduce((sum, author) => sum + (affinity.authors.get(author.slug) ?? 0), 0)
  const raw = categoryWeight + topicWeight * 0.5 + authorWeight * 0.5
  return Math.max(0, Math.min(1, raw / 10))
}

export type DigestScoreBreakdown = {
  story: StoryCardData
  score: number
  civic: number
  novelty: number
  affinity: number
}

/** Per-item score: civic importance, freshness and personal affinity — same weights as `digest-story-ranking`. */
export function digestScore(
  story: StoryCardData,
  affinity?: ReaderAffinity | null,
  now = new Date(),
): DigestScoreBreakdown {
  const civic = civicWeightFor(story)
  const novelty = noveltyOf(story, now)
  const affinityMatch = affinityMatchOf(story, affinity)
  const score = civic * 0.45 + novelty * 0.3 + affinityMatch * 0.25
  return { story, score, civic, novelty, affinity: affinityMatch }
}

/**
 * Order candidate stories no same category twice in a row when an
 * alternative is available, mirroring the `homepage-slot-diversity` guard.
 */
function diversify(scored: DigestScoreBreakdown[]): DigestScoreBreakdown[] {
  const remaining = [...scored].sort((a, b) => b.score - a.score)
  const ordered: DigestScoreBreakdown[] = []
  let lastCategory: string | null = null
  while (remaining.length > 0) {
    let pickIndex = remaining.findIndex((item) => item.story.category.slug !== lastCategory)
    if (pickIndex === -1) pickIndex = 0
    const [picked] = remaining.splice(pickIndex, 1)
    if (!picked) break
    ordered.push(picked)
    lastCategory = picked.story.category.slug
  }
  return ordered
}

export type DigestOptions = {
  limit?: number
  now?: Date
}

/**
 * Rank stories for a reader's re-engagement digest: civic weight + freshness
 * + personal affinity, then diversified so one desk doesn't dominate the send.
 */
export function rankDigestStories(
  stories: StoryCardData[],
  affinity?: ReaderAffinity | null,
  options: DigestOptions = {},
): StoryCardData[] {
  const now = options.now ?? new Date()
  const scored = stories.map((story) => digestScore(story, affinity, now))
  const ordered = diversify(scored)
  return ordered.slice(0, options.limit ?? 6).map((item) => item.story)
}
