import type { Category, StoryCardData } from '@nagarikwatch/db'
import { CIVIC_CATEGORY_WEIGHTS } from './digest'

export type TopicScore = {
  slug: string
  category: Category
  score: number
  storyCount: number
  recommended: boolean
}

/**
 * Score categories for the first-visit topic picker: real recent content
 * volume (an active desk is useful to follow) blended with civic weight, so
 * governance/health/education surface before niche desks when volume ties.
 * Mirrors the `onboarding-topic-picker` / `personalized-onboarding` heuristics
 * but runs against the real catalog instead of a synthetic coverage number.
 */
export function scoreOnboardingTopics(
  categories: Category[],
  catalog: StoryCardData[],
  limit = 8,
): TopicScore[] {
  const counts = new Map<string, number>()
  for (const story of catalog) {
    counts.set(story.category.slug, (counts.get(story.category.slug) ?? 0) + 1)
  }
  const maxCount = Math.max(1, ...counts.values())

  const scored = categories.map((category) => {
    const storyCount = counts.get(category.slug) ?? 0
    const activity = storyCount / maxCount
    const civic = CIVIC_CATEGORY_WEIGHTS[category.slug] ?? 0.35
    const score = activity * 0.6 + civic * 0.4
    return { slug: category.slug, category, score, storyCount, recommended: false }
  })

  scored.sort((a, b) => b.score - a.score || a.category.navOrder - b.category.navOrder)
  for (let i = 0; i < Math.min(3, scored.length); i += 1) {
    scored[i]!.recommended = true
  }
  return scored.slice(0, limit)
}

/**
 * Fraction of available topics the reader has already selected — same shape
 * as the `personalized-onboarding` capability's coverage score, computed on
 * the real selection instead of a fixture default.
 */
export function onboardingCoverage(selected: string[], available: string[]): number {
  if (available.length === 0) return 0
  const availableSet = new Set(available)
  const matched = selected.filter((slug) => availableSet.has(slug)).length
  return Math.max(0, Math.min(1, matched / available.length))
}
