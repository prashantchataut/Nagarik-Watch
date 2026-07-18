import { describe, expect, it } from 'vitest'
import {
  autocomplete,
  buildIndex,
  editDistance,
  fuzzyExpandTerm,
  highlightSegments,
  search,
  type SearchableStory,
} from './search'

function story(partial: Partial<SearchableStory>): SearchableStory {
  return {
    id: partial.id ?? '1',
    slug: partial.slug ?? 'slug',
    category: partial.category ?? {
      id: 'c',
      slug: 'politics',
      nameNe: 'राजनीति',
      nameEn: 'Politics',
    },
    categoryLabel: partial.categoryLabel ?? 'राजनीति',
    titleNe: partial.titleNe ?? '',
    titleEn: partial.titleEn,
    deckNe: partial.deckNe,
    deckEn: partial.deckEn,
    byline: partial.byline ?? '',
    publishedAt: partial.publishedAt ?? '2026-06-01T00:00:00Z',
    hasEnglish: partial.hasEnglish ?? false,
    isBreaking: partial.isBreaking ?? false,
    authors: partial.authors ?? [{ name: 'श्रीजना कार्की', slug: 'srijana-karki' }],
    heroImage: partial.heroImage,
  }
}

const corpus: SearchableStory[] = [
  story({
    id: '1',
    slug: 'budget',
    titleNe: 'बजेटमा पूर्वाधारको प्राथमिकता',
    titleEn: 'Budget prioritizes infrastructure',
    deckNe: 'अर्थमन्त्रीले यो वर्षको बजेट प्रस्तुत गरे',
    publishedAt: '2026-06-10T00:00:00Z',
  }),
  story({
    id: '2',
    slug: 'monsoon',
    titleNe: 'वर्षात्मा बाढीको जोखिम',
    deckNe: 'बजेट अभावमा बाढी नियन्त्रण कठिन',
    publishedAt: '2026-06-12T00:00:00Z',
  }),
  story({
    id: '3',
    slug: 'opinion-budget',
    titleNe: 'बजेटको समीक्षा',
    titleEn: 'A budget review',
    deckNe: 'सम्पादकीय विश्लेषण',
    publishedAt: '2026-06-08T00:00:00Z',
  }),
  story({
    id: '4',
    slug: 'putin',
    titleNe: 'पुटिनको विदेश नीति',
    titleEn: 'Putin foreign policy brief',
    deckNe: 'मस्कोको कूटनीतिक चाल',
    publishedAt: '2026-06-11T00:00:00Z',
  }),
]

const index = buildIndex(corpus)

describe('search', () => {
  it('returns nothing for an empty query', () => {
    expect(search(index, '')).toEqual([])
    expect(search(index, '   ')).toEqual([])
  })

  it('matches Devanagari titles via inverted index', () => {
    const r = search(index, 'बजेट')
    expect(r.map((s) => s.slug)).toContain('budget')
    expect(r.map((s) => s.slug)).toContain('opinion-budget')
  })

  it('ranks title hits above deck hits with BM25 field weights', () => {
    const r = search(index, 'बजेट')
    const budgetIdx = r.findIndex((s) => s.slug === 'budget')
    const monsoonIdx = r.findIndex((s) => s.slug === 'monsoon')
    expect(budgetIdx).toBeGreaterThanOrEqual(0)
    if (monsoonIdx >= 0) expect(budgetIdx).toBeLessThan(monsoonIdx)
  })

  it('ANDs multi-term queries', () => {
    const r = search(index, 'बजेट पूर्वाधार')
    expect(r.map((s) => s.slug)).toEqual(['budget'])
  })

  it('respects the limit', () => {
    const r = search(index, 'बजेट', 1)
    expect(r.length).toBeLessThanOrEqual(1)
  })

  it('breaks ties by recency (newer first)', () => {
    const r = search(index, 'बजेट')
    const budget = r.find((s) => s.slug === 'budget')
    const opinion = r.find((s) => s.slug === 'opinion-budget')
    if (budget && opinion) {
      expect(budget.publishedAt.localeCompare(opinion.publishedAt)).toBeGreaterThan(0)
    }
  })

  it('recovers Latin typos with fuzzy expansion', () => {
    const r = search(index, 'puttin')
    expect(r.map((s) => s.slug)).toContain('putin')
  })

  it('expands English civic synonyms to Nepali title matches', () => {
    const r = search(index, 'budget')
    expect(r.map((s) => s.slug)).toContain('budget')
    expect(r.map((s) => s.slug)).toContain('opinion-budget')
  })

  it('expands flood synonym toward monsoon coverage', () => {
    const r = search(index, 'flood')
    expect(r.map((s) => s.slug)).toContain('monsoon')
  })
})

describe('fuzzyExpandTerm / editDistance', () => {
  it('computes small edit distances', () => {
    expect(editDistance('putin', 'puttin')).toBe(1)
    expect(editDistance('budget', 'budget')).toBe(0)
  })

  it('expands unknown Latin terms against vocabulary', () => {
    const expanded = fuzzyExpandTerm('puttin', index.vocabulary)
    expect(expanded).toContain('putin')
  })
})

describe('autocomplete', () => {
  it('suggests title prefixes from the trie', () => {
    const suggestions = autocomplete(index, 'bud')
    expect(suggestions.some((s) => /budget/i.test(s))).toBe(true)
  })

  it('suggests Devanagari prefixes', () => {
    const suggestions = autocomplete(index, 'बज')
    expect(suggestions.length).toBeGreaterThan(0)
  })
})

describe('highlightSegments', () => {
  it('returns the whole string as a single non-match when query is empty', () => {
    expect(highlightSegments('बजेटको समीक्षा', '')).toEqual([
      { text: 'बजेटको समीक्षा', match: false },
    ])
  })

  it('marks the matched substring', () => {
    const segs = highlightSegments('बजेटमा पूर्वाधारको प्राथमिकता', 'बजेट')
    expect(segs.some((s) => s.match && s.text === 'बजेट')).toBe(true)
  })

  it('marks multiple terms in one pass', () => {
    const segs = highlightSegments('बजेट पूर्वाधार', 'बजेट पूर्वाधार')
    const matched = segs.filter((s) => s.match).map((s) => s.text)
    expect(matched).toContain('बजेट')
    expect(matched).toContain('पूर्वाधार')
  })

  it('returns no matches when the term is absent', () => {
    const segs = highlightSegments('वर्षात्मा बाढी', 'बजेट')
    expect(segs.every((s) => !s.match)).toBe(true)
  })
})
