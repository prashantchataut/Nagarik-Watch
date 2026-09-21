import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import type { BookmarkRecord, ReadingHistoryRecord } from './state'
import { buildAffinity, recommendForReader } from './personalize'

function story(id: string, categorySlug: string, authorSlug = 'reporter'): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: categorySlug, slug: categorySlug, nameNe: categorySlug, nameEn: categorySlug },
    categoryLabel: categorySlug,
    titleNe: `शीर्षक ${id}`,
    titleEn: `Story ${id}`,
    byline: 'नागरिक वाच',
    authors: [{ id: authorSlug, name: authorSlug, slug: authorSlug }],
    publishedAt: '2026-06-22T00:00:00Z',
    hasEnglish: true,
    isBreaking: false,
  }
}

function history(articleId: string, categorySlug: string, scrollDepth = 90): ReadingHistoryRecord {
  return {
    articleId,
    slug: articleId,
    categorySlug,
    title: articleId,
    href: `/${categorySlug}/${articleId}`,
    readAt: '2026-06-22T00:00:00Z',
    firstReadAt: '2026-06-22T00:00:00Z',
    scrollDepth,
    completed: scrollDepth > 92,
    sessions: 1,
    dwellSeconds: 120,
  }
}

describe('reader personalization', () => {
  it('builds affinity from bookmarks and reading history', () => {
    const politics = story('p1', 'politics', 'a1')
    const economy = story('e1', 'economy', 'a2')
    const bookmarks: BookmarkRecord[] = [
      { articleId: politics.id, story: politics, savedAt: '2026-06-22T00:00:00Z' },
    ]
    const affinity = buildAffinity(
      bookmarks,
      [history(economy.id, economy.category.slug)],
      [politics, economy],
    )

    expect(affinity.categories.get('politics')).toBeGreaterThan(3)
    expect(affinity.categories.get('economy')).toBeGreaterThan(1)
    expect(affinity.authors.get('a1')).toBeGreaterThan(3)
  })

  it('recommends from reader affinity without letting one section dominate', () => {
    const catalog = [
      story('p1', 'politics', 'a1'),
      story('p2', 'politics', 'a1'),
      story('p3', 'politics', 'a1'),
      story('e1', 'economy', 'a2'),
      story('w1', 'world', 'a3'),
    ]
    const bookmarks: BookmarkRecord[] = [
      { articleId: 'p1', story: catalog[0]!, savedAt: '2026-06-22T00:00:00Z' },
    ]
    const recommended = recommendForReader(catalog, bookmarks, [history('p2', 'politics')], 4)

    expect(recommended).toHaveLength(4)
    expect(recommended.filter((item) => item.category.slug === 'politics')).toHaveLength(2)
  })

  it('accepts a consented interaction matrix option for CF volume gating', () => {
    const catalog = [story('a1', 'politics'), story('a2', 'economy'), story('a3', 'world')]
    const interactions: Record<string, Record<string, number>> = {}
    for (let i = 0; i < 30; i++) {
      interactions[`r${i}`] = { a1: 1, a2: i % 2, a3: 1 }
    }
    interactions.target = { a1: 1 }
    const recommended = recommendForReader(catalog, [], [history('a1', 'politics')], {
      limit: 3,
      interactions,
      readerId: 'target',
    })
    expect(recommended.length).toBeGreaterThan(0)
  })

  it('lets latent factors lift the cohort a folded-in reader belongs to', () => {
    // Two cohorts, disjoint reading. `newcomer` has read only politics, so the
    // fold-in should place it in the politics cohort — and the uplift it adds
    // to a politics candidate should exceed what it adds to a sports one.
    const catalog = [
      ...Array.from({ length: 6 }, (_, index) => story(`pol-${index}`, 'politics', `a${index}`)),
      ...Array.from({ length: 6 }, (_, index) => story(`spo-${index}`, 'sports', `b${index}`)),
    ]
    const interactions: Record<string, Record<string, number>> = {}
    for (let reader = 0; reader < 16; reader += 1) {
      const politics: Record<string, number> = {}
      const sports: Record<string, number> = {}
      for (let item = 0; item < 6; item += 1) {
        if (item !== reader % 6) politics[`pol-${item}`] = 3
        if (item !== reader % 6) sports[`spo-${item}`] = 3
      }
      interactions[`p${reader}`] = politics
      interactions[`s${reader}`] = sports
    }

    const readerHistory = [history('pol-1', 'politics'), history('pol-2', 'politics')]
    const withFactors = recommendForReader(catalog, [], readerHistory, {
      limit: 12,
      interactions,
      readerId: 'newcomer',
    })
    const withoutFactors = recommendForReader(catalog, [], readerHistory, { limit: 12 })

    const scoreOf = (items: typeof withFactors, id: string) =>
      items.find((item) => item.id === id)?.recScore ?? 0
    const shared = withFactors
      .map((item) => item.id)
      .filter((id) => withoutFactors.some((item) => item.id === id))
    const uplift = new Map(
      shared.map((id) => [id, scoreOf(withFactors, id) - scoreOf(withoutFactors, id)]),
    )

    const politicsUplift = Math.max(
      ...shared.filter((id) => id.startsWith('pol-')).map((id) => uplift.get(id) ?? 0),
    )
    const sportsUplift = Math.max(
      ...shared.filter((id) => id.startsWith('spo-')).map((id) => uplift.get(id) ?? 0),
    )
    expect(politicsUplift).toBeGreaterThan(0)
    expect(politicsUplift).toBeGreaterThan(sportsUplift)
  })
})
