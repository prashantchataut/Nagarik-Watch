import { describe, expect, it } from 'vitest'
import type { Follow } from './types'
import { recommend, RECOMMENDER_VERSION, type RecommendableStory } from './recommend'

const category = { id: 'cat-news', slug: 'news', nameNe: 'समाचार', nameEn: 'News' }
const authorA = { id: 'author-a', slug: 'a', name: 'A' }
const authorB = { id: 'author-b', slug: 'b', name: 'B' }

function story(
  id: string,
  overrides: Partial<RecommendableStory> = {},
): RecommendableStory {
  return {
    id,
    slug: id,
    category,
    titleNe: `समाचार ${id}`,
    publishedAt: '2026-07-13T08:00:00.000Z',
    isBreaking: false,
    authors: [authorA],
    ...overrides,
  }
}

const now = new Date('2026-07-13T10:00:00.000Z')

function follow(kind: Follow['kind'], targetSlug: string): Follow {
  return {
    id: `${kind}:${targetSlug}`,
    userId: 'reader',
    kind,
    targetSlug,
    createdAt: now.toISOString(),
  }
}

describe('recommend', () => {
  it('makes author follows an actual ranking signal', () => {
    const result = recommend(
      [story('other', { authors: [authorB] }), story('followed', { authors: [authorA] })],
      { follows: [follow('author', 'a')] },
      { now, limit: 2 },
    )
    expect(result[0]?.id).toBe('followed')
    expect(result[0]?.recStrategy).toBe('follow')
    expect(result[0]?.recVersion).toBe(RECOMMENDER_VERSION)
  })

  it('excludes recently read, sponsored, future, and do-not-recommend stories', () => {
    const result = recommend(
      [
        story('read'),
        story('sponsored', { sponsored: true }),
        story('future', { publishedAt: '2026-07-14T08:00:00.000Z' }),
        story('blocked', { doNotRecommend: true }),
        story('safe'),
      ],
      {
        history: [
          {
            id: 'history-read',
            userId: 'reader',
            articleId: 'read',
            readAt: '2026-07-13T09:00:00.000Z',
          },
        ],
      },
      { now, limit: 10 },
    )
    expect(result.map((item) => item.id)).toEqual(['safe'])
  })

  it('limits repeated authors and sources', () => {
    const result = recommend(
      [
        story('one', { sourceKey: 'wire-a' }),
        story('two', { sourceKey: 'wire-a' }),
        story('three', { sourceKey: 'wire-b', authors: [authorB] }),
      ],
      {},
      { now, limit: 3, maxPerAuthor: 1, maxPerSource: 1, maxPerCategory: 3 },
    )
    expect(result.map((item) => item.id)).toEqual(['one', 'three'])
  })

  it('retains category, topic and byline signals when the read story has left the catalog', () => {
    const followedCategory = { ...category, id: 'cat-economy', slug: 'economy', nameNe: 'अर्थ', nameEn: 'Economy' }
    const result = recommend(
      [
        story('generic', { authors: [authorB] }),
        story('history-match', {
          category: followedCategory,
          tags: ['banking'],
          authors: [authorA],
        }),
      ],
      {
        history: [{
          id: 'old-history',
          userId: 'reader',
          articleId: 'no-longer-in-catalog',
          categorySlug: 'economy',
          tagSlugs: ['banking'],
          authorSlugs: ['a'],
          readAt: '2026-07-13T09:00:00.000Z',
          completed: true,
        }],
      },
      { now, limit: 2 },
    )
    expect(result[0]?.id).toBe('history-match')
    expect(result[0]?.recStrategy).toBe('content')
  })
})

// Compile-time assertion that the public card contract remains recommendable.
