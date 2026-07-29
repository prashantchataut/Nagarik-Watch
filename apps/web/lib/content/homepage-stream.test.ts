import { describe, expect, it } from 'vitest'
import type { HomepageSection, StoryCardData } from '@nagarikwatch/db'
import {
  bandEveryForVariant,
  buildFeaturedBandPool,
  buildHomepageStream,
} from './homepage-stream'

function story(id: string, categorySlug = 'politics'): StoryCardData {
  return {
    id,
    slug: id,
    category: {
      id: categorySlug,
      slug: categorySlug,
      nameNe: categorySlug,
      nameEn: categorySlug,
    },
    categoryLabel: categorySlug,
    titleNe: `Title ${id}`,
    byline: 'Desk',
    authors: [],
    publishedAt: '2026-07-01T00:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    premium: false,
    readingMinutes: 3,
  } as StoryCardData
}

function section(slug: string, items: StoryCardData[]): HomepageSection {
  return {
    category: {
      id: slug,
      slug,
      nameNe: slug,
      nameEn: slug,
    },
    items,
  }
}

describe('buildHomepageStream', () => {
  it('inserts featured bands every N sections and prefers category match', () => {
    const sections = [
      section('politics', [story('p1', 'politics')]),
      section('business', [story('b1', 'business')]),
      section('society', [story('s1', 'society')]),
      section('world', [story('w1', 'world')]),
    ]
    const pool = [
      story('feat-biz', 'business'),
      story('feat-a', 'politics'),
      story('feat-b', 'society'),
      story('feat-c', 'world'),
      story('feat-d', 'education'),
      story('feat-e', 'sports'),
    ]

    const stream = buildHomepageStream(sections, pool, {
      bandEvery: 2,
      bandSize: 3,
      categoryAware: true,
    })

    expect(stream.map((item) => item.kind)).toEqual([
      'section',
      'section',
      'featured',
      'section',
      'section',
      'featured',
    ])

    const firstBand = stream[2]
    expect(firstBand?.kind).toBe('featured')
    if (firstBand?.kind === 'featured') {
      expect(firstBand.stories[0]?.category.slug).toBe('business')
      expect(firstBand.stories).toHaveLength(3)
    }
  })

  it('maps layout variants to band spacing', () => {
    expect(bandEveryForVariant('band-every-2')).toBe(2)
    expect(bandEveryForVariant('band-every-3')).toBe(3)
    expect(bandEveryForVariant(null)).toBe(2)
  })

  it('builds a mid-scroll pool without spotlight duplicates', () => {
    const featured = [
      story('f1'),
      story('f2'),
      story('f3'),
      story('f4'),
      story('f5'),
      story('f6'),
    ]
    const pool = buildFeaturedBandPool({
      featured,
      catalog: [story('c1'), story('c2', 'society')],
      excludeIds: new Set(['lead']),
      spotlightCount: 4,
    })
    expect(pool.map((s) => s.id)).toEqual(['f5', 'f6'])
  })
})
