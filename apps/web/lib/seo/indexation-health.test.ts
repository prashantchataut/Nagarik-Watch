import type { StoryCardData } from '@nagarikwatch/db'
import { describe, expect, it } from 'vitest'
import { assessIndexation } from './indexation-health'

const NOW = Date.parse('2026-06-22T12:00:00Z')

function story(overrides: Partial<StoryCardData> & { slug: string }): StoryCardData {
  return {
    id: overrides.slug,
    category: { id: 'news', slug: 'news', nameNe: 'समाचार', nameEn: 'News' },
    categoryLabel: 'समाचार',
    titleNe: 'संघीय बजेट संसदमा पेश',
    deckNe: 'अर्थमन्त्रीले प्रतिनिधिसभामा विनियोजन विधेयक पेश गरे।',
    heroImage: { url: 'https://cdn.example/hero.jpg', alt: 'संसद भवन' },
    byline: 'नागरिक वाच',
    authors: [],
    publishedAt: '2026-06-22T09:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    ...overrides,
  } as StoryCardData
}

const codes = (stories: StoryCardData[]) =>
  assessIndexation(stories, NOW).findings.map((f) => f.code)

describe('assessIndexation', () => {
  it('reports a clean archive as clean', () => {
    const health = assessIndexation(
      [story({ slug: 'a' }), story({ slug: 'b', titleNe: 'अर्को' })],
      NOW,
    )
    expect(health.findings).toEqual([])
    expect(health.score).toBe(1)
    expect(health.newsWindowEmpty).toBe(false)
    expect(health.freshnessHours).toBeCloseTo(3, 6)
  })

  it('separates no-indexed stories from the indexable set', () => {
    const health = assessIndexation(
      [story({ slug: 'a' }), story({ slug: 'b', noIndex: true, titleNe: 'अर्को' })],
      NOW,
    )
    expect(health).toMatchObject({ total: 2, indexable: 1, noIndexed: 1 })
    // The no-index story's missing fields must not count against the score.
    expect(health.findings).toEqual([])
  })

  it('finds the things that index badly', () => {
    expect(
      codes([story({ slug: 'a', deckNe: '' }), story({ slug: 'b', titleNe: 'अर्को' })]),
    ).toContain('missing-deck')
    expect(
      codes([story({ slug: 'a', heroImage: undefined }), story({ slug: 'b', titleNe: 'अर्को' })]),
    ).toContain('missing-hero')
    expect(codes([story({ slug: 'a', titleNe: 'क'.repeat(90) })])).toContain('long-title')
  })

  it('flags two stories competing on the same headline', () => {
    const health = assessIndexation([story({ slug: 'a' }), story({ slug: 'b' })], NOW)
    const duplicate = health.findings.find((f) => f.code === 'duplicate-title')
    expect(duplicate?.count).toBe(2)
    expect(duplicate?.samples).toEqual(['a', 'b'])
  })

  it('treats one slug under two categories as an error', () => {
    const health = assessIndexation(
      [
        story({ slug: 'same', titleNe: 'एक' }),
        story({
          slug: 'same',
          titleNe: 'दुई',
          category: { id: 'politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
        }),
      ],
      NOW,
    )
    const duplicate = health.findings.find((f) => f.code === 'duplicate-slug')
    expect(duplicate?.severity).toBe('error')
  })

  it('notices when nothing published inside the Google News window', () => {
    const stale = assessIndexation([story({ slug: 'a', publishedAt: '2026-06-18T09:00:00Z' })], NOW)
    expect(stale.newsWindowEmpty).toBe(true)
    expect(stale.freshnessHours).toBeGreaterThan(48)
  })

  it('scales a finding by how much of the archive it touches', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      story({ slug: `s${i}`, titleNe: `शीर्षक ${i}` }),
    )
    const oneBad = assessIndexation([{ ...many[0]!, deckNe: '' }, ...many.slice(1)], NOW)
    const allBad = assessIndexation(
      many.map((s) => ({ ...s, deckNe: '' })),
      NOW,
    )
    expect(oneBad.score).toBeGreaterThan(allBad.score)
    expect(oneBad.score).toBeGreaterThan(0.98)
  })

  it('handles an empty archive', () => {
    const health = assessIndexation([], NOW)
    expect(health).toMatchObject({ total: 0, indexable: 0, score: 1, freshnessHours: null })
    expect(health.newsWindowEmpty).toBe(true)
    expect(health.bilingualShare).toBe(0)
  })
})
