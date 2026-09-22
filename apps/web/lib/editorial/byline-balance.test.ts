import { describe, expect, it } from 'vitest'
import type { StoryCardData } from '@nagarikwatch/db'
import { bylineBalance } from './byline-balance'

function story(id: string, categorySlug: string, authors: Array<[string, string]>): StoryCardData {
  return {
    id,
    slug: id,
    category: { id: categorySlug, slug: categorySlug, nameNe: categorySlug, nameEn: categorySlug },
    categoryLabel: categorySlug,
    titleNe: `शीर्षक ${id}`,
    byline: authors.map(([, name]) => name).join(', '),
    authors: authors.map(([slug, name]) => ({ id: slug, slug, name })),
    publishedAt: '2026-06-22T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
  }
}

const DESKS = [
  { slug: 'politics', nameNe: 'राजनीति' },
  { slug: 'economy', nameNe: 'अर्थतन्त्र' },
  { slug: 'sports', nameNe: 'खेलकुद' },
]

function spread(): StoryCardData[] {
  // Twelve stories, four reporters, three desks, nothing dominant.
  const reporters: Array<[string, string]> = [
    ['reema', 'रीमा'],
    ['bikash', 'विकास'],
    ['sita', 'सीता'],
    ['anil', 'अनिल'],
  ]
  return Array.from({ length: 12 }, (_, index) =>
    story(`s${index}`, DESKS[index % 3]!.slug, [reporters[index % 4]!]),
  )
}

describe('bylineBalance', () => {
  it('reports no findings for evenly spread output', () => {
    const balance = bylineBalance(spread(), DESKS)
    expect(balance.stories).toBe(12)
    expect(balance.findings).toEqual([])
    // Four equal bylines: 4 × 0.25² = 0.25, which must read as balanced.
    expect(balance.authorConcentration).toBeCloseTo(0.25, 6)
  })

  it('flags a reporter carrying most of the window', () => {
    const stories = [
      ...Array.from({ length: 8 }, (_, i) => story(`d${i}`, 'politics', [['reema', 'रीमा']])),
      ...Array.from({ length: 4 }, (_, i) =>
        story(`o${i}`, DESKS[i % 3]!.slug, [['anil', 'अनिल']]),
      ),
    ]
    const balance = bylineBalance(stories, DESKS)
    expect(balance.authors[0]).toMatchObject({ key: 'reema', stories: 8 })
    expect(balance.findings.map((f) => f.code)).toContain('byline-dominance')
    expect(balance.findings.find((f) => f.code === 'byline-dominance')?.detail).toContain('67%')
  })

  it('credits every byline on a shared story, not just the first', () => {
    const balance = bylineBalance(
      [
        story('a', 'politics', [
          ['reema', 'रीमा'],
          ['bikash', 'विकास'],
        ]),
      ],
      DESKS,
    )
    expect(balance.authors.map((a) => a.key).sort()).toEqual(['bikash', 'reema'])
    expect(balance.authors.every((a) => a.share === 0.5)).toBe(true)
  })

  it('names a desk that published nothing in the window', () => {
    const stories = Array.from({ length: 6 }, (_, i) =>
      story(`s${i}`, i % 2 === 0 ? 'politics' : 'economy', [['reema', 'रीमा']]),
    )
    const balance = bylineBalance(stories, DESKS)
    expect(balance.silentDesks).toEqual(['खेलकुद'])
    expect(balance.findings.map((f) => f.code)).toContain('desk-silent')
  })

  it('flags a desk holding most of the front page', () => {
    const stories = [
      ...Array.from({ length: 9 }, (_, i) =>
        story(`p${i}`, 'politics', [[`r${i % 5}`, `रिपोर्टर ${i % 5}`]]),
      ),
      story('e0', 'economy', [['a', 'अ']]),
      story('s0', 'sports', [['b', 'ब']]),
    ]
    const balance = bylineBalance(stories, DESKS)
    expect(balance.desks[0]).toMatchObject({ key: 'politics', stories: 9 })
    expect(balance.findings.map((f) => f.code)).toContain('desk-dominance')
  })

  it('stays quiet on a window too small to mean anything', () => {
    // Three stories by one reporter is a quiet Tuesday, not a concentration
    // problem. Crying wolf here is how an editor learns to ignore the card.
    const stories = Array.from({ length: 3 }, (_, i) =>
      story(`s${i}`, 'politics', [['reema', 'रीमा']]),
    )
    const balance = bylineBalance(stories)
    expect(balance.authorConcentration).toBe(1)
    expect(balance.findings).toEqual([])
  })

  it('survives stories with no byline at all', () => {
    const balance = bylineBalance([story('a', 'politics', []), story('b', 'economy', [])], DESKS)
    expect(balance.authors).toEqual([])
    expect(balance.authorConcentration).toBe(0)
    expect(balance.desks).toHaveLength(2)
  })

  it('handles an empty window without dividing by zero', () => {
    const balance = bylineBalance([], DESKS)
    expect(balance.stories).toBe(0)
    expect(balance.authorConcentration).toBe(0)
    expect(balance.deskConcentration).toBe(0)
    expect(balance.silentDesks).toHaveLength(3)
  })
})
