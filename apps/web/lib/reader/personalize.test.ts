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
})
