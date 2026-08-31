/**
 * Recommendation engine (तपाईंका लागि) — transparent local heuristic, no black box.
 *
 * Score components (documented on the UI too, per the honesty contract):
 *  - desk affinity   : how often the reader has opened this desk (recent-weighted)
 *  - tag overlap     : Jaccard similarity between story tags and read-history tags
 *  - recency         : publishedAt decay — fresh news first
 *  - trending boost  : optional /api/trending counts blended in
 * Excluded: stories already in the reading history.
 */

import type { Story } from './data'
import type { ReadEntry } from './read-history'

const HALF_LIFE_DAYS = 21

function daysSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 86_400_000
}

function recencyScore(iso: string): number {
  return Math.pow(0.5, Math.max(0, daysSince(iso)) / HALF_LIFE_DAYS)
}

/** Desk weights from history: newer reads count more. */
export function deskAffinity(history: ReadEntry[]): Map<string, number> {
  const weights = new Map<string, number>()
  for (let i = 0; i < history.length; i++) {
    const entry = history[i]!
    // Most recent entry (index 0) has full weight; older entries decay.
    const w = Math.pow(0.92, i)
    weights.set(entry.desk, (weights.get(entry.desk) ?? 0) + w)
  }
  return weights
}

/** Tag frequency map from history. */
function tagWeights(history: ReadEntry[]): Map<string, number> {
  const weights = new Map<string, number>()
  for (const entry of history) {
    for (const tag of entry.tags) {
      weights.set(tag, (weights.get(tag) ?? 0) + 1)
    }
  }
  return weights
}

function tagOverlapScore(story: Story, tagW: Map<string, number>): number {
  if (story.tags.length === 0 || tagW.size === 0) return 0
  let hit = 0
  let totalWeight = 0
  for (const tag of story.tags) {
    totalWeight += tagW.get(tag) ?? 0
    if (tagW.has(tag)) hit += 1
  }
  const jaccardish = hit / (story.tags.length + tagW.size - hit)
  const weighted = totalWeight / (story.tags.length * 4)
  return Math.min(1, jaccardish * 0.6 + weighted * 0.4)
}

export interface RecommendOptions {
  history: ReadEntry[]
  trending?: Map<string, number> // storyKey -> views (last 7 days)
  limit?: number
  excludeKeys?: string[]
  minHistory?: number
}

/** Personalized rail: only surfaces once the reader has a little history. */
export function recommendFor(stories: Story[], opts: RecommendOptions): Story[] {
  const { history, trending, limit = 6, excludeKeys = [], minHistory = 3 } = opts
  if (history.length < minHistory) return []

  const readKeys = new Set(history.map((e) => e.key))
  const aff = deskAffinity(history)
  const tagW = tagWeights(history)
  const maxAff = Math.max(1, ...aff.values())

  const scored = stories
    .filter((s) => !readKeys.has(`${s.desk}/${s.slug}`) && !excludeKeys.includes(s.slug))
    .map((story) => {
      const deskScore = (aff.get(story.desk) ?? 0) / maxAff
      const tagScore = tagOverlapScore(story, tagW)
      const rec = recencyScore(story.publishedAt)
      const views = trending?.get(`${story.desk}/${story.slug}`) ?? 0
      const trendScore = Math.min(1, Math.log10(1 + views) / 2) // 100 views ≈ 0.5
      const score = deskScore * 0.4 + tagScore * 0.2 + rec * 0.25 + trendScore * 0.15
      return { story, score }
    })
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, limit).map((s) => s.story)
}

/** Related stories on an article page: tag overlap + same-desk, fallback desk. */
export function relatedFor(story: Story, all: Story[], count = 4): Story[] {
  const others = all.filter((s) => s.slug !== story.slug)
  const scored = others.map((s) => {
    const shared = s.tags.filter((t) => story.tags.includes(t)).length
    const sameDesk = s.desk === story.desk ? 1 : 0
    const sameProvince = s.province === story.province ? 0.5 : 0
    const rec = recencyScore(s.publishedAt)
    return { s, score: shared * 0.5 + sameDesk * 0.5 + sameProvince + rec * 0.3 }
  })
  scored.sort((a, b) => b.score - a.score)
  // diversity: at most 2 from the same desk
  const picked: Story[] = []
  const deskCount = new Map<string, number>()
  for (const { s } of scored) {
    const c = deskCount.get(s.desk) ?? 0
    if (c >= 2) continue
    deskCount.set(s.desk, c + 1)
    picked.push(s)
    if (picked.length >= count) break
  }
  return picked
}

/** Why this story? Human-readable reason for the rail card tooltip. */
export function reasonFor(story: Story, history: ReadEntry[], trending?: Map<string, number>): string {
  const aff = deskAffinity(history)
  const tagW = tagWeights(history)
  const shared = story.tags.filter((t) => tagW.has(t))
  if (shared.length >= 2) return `पढिएका कथाका विषयसँग मिल्दो (${shared.slice(0, 2).join(', ')})`
  if ((aff.get(story.desk) ?? 0) > 0) return 'यही विषय/डेस्कमा पढ्ने बानी'
  if (trending && (trending.get(`${story.desk}/${story.slug}`) ?? 0) > 20) return 'धेरै पढिँदै'
  return 'ताजा समाचार'
}
