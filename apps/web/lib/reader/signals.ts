import type { StoryCardData } from '@nagarikwatch/db'
import type { ReadingHistoryRecord } from './state'

/** Structural subset of ReaderAffinity — kept local so there is no import cycle. */
type AffinityMaps = { topics: Map<string, number>; authors: Map<string, number> }

/**
 * Reader-behaviour scorers that the recommendation surfaces actually consume.
 *
 * Each of these had a catalog entry and a one-line fixture formula in
 * `lib/algorithms/handlers` and nothing else — the admin panel ran them, no
 * reader ever felt them. They live here, take the reader's real local history,
 * and feed `recommendForReader` / `continueReadingForReader`, which are what
 * `RecommendedForYou` and `ReaderActivityPanel` render.
 *
 * Everything here is pure and synchronous: it runs on history the browser
 * already holds, so there is no request to make and nothing to consent to
 * beyond the reading history the reader can already see and clear.
 */

const HOUR_MS = 3_600_000

function hoursSince(iso: string, now: number): number {
  const at = Date.parse(iso)
  if (!Number.isFinite(at)) return Number.POSITIVE_INFINITY
  return Math.max(0, (now - at) / HOUR_MS)
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export type ContinueReadingCandidate = {
  record: ReadingHistoryRecord
  story: StoryCardData
  score: number
}

/**
 * continue-reading-ranker
 *
 * The database helper returns the single most recent unfinished read. That is
 * the wrong pick when a reader abandoned a long investigation at 80% two hours
 * ago and then skimmed 10% of a scoreboard on the way to the bus. Rank all
 * unfinished reads by how much of the story is left worth finishing and how
 * warm the intent still is, and let the warmest deep read win.
 */
export function rankContinueReading(
  catalog: StoryCardData[],
  history: ReadingHistoryRecord[],
  now = new Date(),
): ContinueReadingCandidate[] {
  const byId = new Map(catalog.map((story) => [story.id, story]))
  const bySlug = new Map(catalog.map((story) => [story.slug, story]))
  const at = now.getTime()
  const candidates: ContinueReadingCandidate[] = []

  for (const record of history) {
    if (record.completed) continue
    // Below 10% is a bounce, not an interruption; above 92% is finished in
    // every way that matters and "continue" would open a footer.
    if (record.scrollDepth < 10 || record.scrollDepth >= 92) continue
    const story = byId.get(record.articleId) ?? bySlug.get(record.slug)
    if (!story) continue

    const age = hoursSince(record.readAt, at)
    if (age > 14 * 24) continue

    const depth = clamp01(record.scrollDepth / 100)
    const recency = clamp01(1 - age / 48)
    // Coming back more than once is the strongest signal that the reader
    // means to finish this one.
    const returns = clamp01((record.sessions - 1) / 3)
    const invested = clamp01(record.dwellSeconds / 240)
    const score = depth * 0.45 + recency * 0.3 + returns * 0.15 + invested * 0.1
    candidates.push({ record, story, score })
  }

  return candidates.sort(
    (a, b) => b.score - a.score || Date.parse(b.record.readAt) - Date.parse(a.record.readAt),
  )
}

/**
 * scroll-depth-quality
 *
 * How deeply this reader reads in general, used to decide whether their
 * history is worth leaning on. Someone who bounces off everything should not
 * have their bounces mined for topic affinity.
 */
export function scrollDepthQuality(history: ReadingHistoryRecord[]): number {
  if (history.length === 0) return 0
  let weighted = 0
  for (const record of history) {
    const depth = clamp01(record.scrollDepth / 100)
    weighted += record.completed ? 1 : depth
  }
  return clamp01(weighted / history.length)
}

/**
 * locale-preference-scorer
 *
 * Share of reads spent on stories that have an English edition, read as a
 * preference for it. Returns null rather than 0.5 when there is nothing to go
 * on, so callers can tell "no opinion" from "genuinely balanced".
 */
export function localePreference(
  catalog: StoryCardData[],
  history: ReadingHistoryRecord[],
): { english: number; sample: number } | null {
  const byId = new Map(catalog.map((story) => [story.id, story]))
  const bySlug = new Map(catalog.map((story) => [story.slug, story]))
  let english = 0
  let sample = 0
  for (const record of history) {
    const story = byId.get(record.articleId) ?? bySlug.get(record.slug)
    if (!story) continue
    sample += 1
    if (story.hasEnglish) english += 1
  }
  if (sample < 3) return null
  return { english: english / sample, sample }
}

/**
 * topic-follow-ranking / author-follow-ranking
 *
 * Normalise the raw affinity tallies to 0..1 against the reader's own
 * strongest signal, so a light reader's "three reads of खेलकुद" counts as
 * strongly as a heavy reader's thirty.
 */
function normalizedAffinity(affinity: Map<string, number>, keys: string[]): number {
  if (affinity.size === 0 || keys.length === 0) return 0
  let peak = 0
  for (const value of affinity.values()) peak = Math.max(peak, value)
  if (peak <= 0) return 0
  let best = 0
  for (const key of keys) best = Math.max(best, affinity.get(key) ?? 0)
  return clamp01(best / peak)
}

export function topicFollowScore(affinity: AffinityMaps, story: StoryCardData): number {
  return normalizedAffinity(
    affinity.topics,
    (story.tags ?? []).map((tag) => tag.slug),
  )
}

export function authorFollowScore(affinity: AffinityMaps, story: StoryCardData): number {
  return normalizedAffinity(
    affinity.authors,
    story.authors.map((author) => author.slug),
  )
}

/**
 * return-visit-propensity
 *
 * Distinct days read in the trailing two weeks, plus how recently. A reader
 * who is clearly coming back tomorrow can be shown a series or a long read;
 * one who is not should be shown something that pays off now.
 */
export function returnVisitPropensity(history: ReadingHistoryRecord[], now = new Date()): number {
  if (history.length === 0) return 0
  const at = now.getTime()
  const days = new Set<string>()
  let mostRecent = Number.POSITIVE_INFINITY
  for (const record of history) {
    const age = hoursSince(record.readAt, at)
    if (age > 14 * 24) continue
    mostRecent = Math.min(mostRecent, age)
    days.add(record.readAt.slice(0, 10))
  }
  if (days.size === 0) return 0
  const cadence = clamp01(days.size / 7)
  const warmth = clamp01(1 - mostRecent / 72)
  return clamp01(cadence * 0.65 + warmth * 0.35)
}

/**
 * reengagement-ranking
 *
 * How hard a story should be pushed to a reader who has drifted. Weight is
 * inverse to their return propensity — someone who reads daily needs no
 * nudge — and proportional to how close the story sits to what they already
 * finished.
 */
export function reengagementWeight(returnPropensity: number, affinityStrength: number): number {
  const drift = clamp01(1 - returnPropensity)
  return clamp01(drift * 0.6 + affinityStrength * 0.4)
}
