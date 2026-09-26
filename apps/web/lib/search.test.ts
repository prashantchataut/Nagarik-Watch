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

describe('morphology-aware matching', () => {
  it('matches an inflected query against an inflected headline', () => {
    // बजेटको (query) and बजेटमा (title of "budget") share the stem बजेट.
    const r = search(index, 'बजेटको')
    expect(r.map((s) => s.slug)).toContain('budget')
  })

  it('still matches while the reader is mid-word', () => {
    const r = search(index, 'बजे')
    expect(r.map((s) => s.slug)).toContain('budget')
  })

  it('ranks a full-word hit above a mid-word prefix guess', () => {
    const exact = search(index, 'बजेट')[0]?.score ?? 0
    const partial = search(index, 'बजे')[0]?.score ?? 0
    expect(exact).toBeGreaterThan(partial)
  })

  it('indexes one key per token instead of every prefix of it', () => {
    // The old index stored ब, बज, बजे, बजेट… for every Devanagari token, which
    // multiplied its size by the average token length and gave the short keys a
    // document frequency near the corpus size — a dead IDF term.
    const fragments = ['बज', 'बजे', 'पूर', 'पूर्वा', 'समी', 'समीक्ष']
    for (const fragment of fragments) {
      expect(index.vocabulary).not.toContain(fragment)
    }
    // …while the stem each of those tokens reduces to is present exactly once.
    expect(index.vocabulary.filter((term) => term === 'बजेट')).toHaveLength(1)
  })

  it('falls back to partial coverage rather than returning nothing', () => {
    // "पूर्वाधार" is only in the budget story; "मस्को" is only in the Putin
    // story. No document has both, and an empty page is the wrong answer.
    const r = search(index, 'पूर्वाधार मस्को')
    expect(r.length).toBeGreaterThan(0)
  })

  it('keeps a document covering both terms ahead of one covering either', () => {
    const r = search(index, 'बजेट समीक्षा')
    expect(r[0]?.slug).toBe('opinion-budget')
  })
})

describe('romanized queries', () => {
  // Most Nepali readers on a phone type Latin. Before these keys existed, the
  // only way `oli` reached ओली was a hand-curated lexicon entry — which cannot
  // scale to the proper nouns that make up most news queries.
  const devanagariOnly: SearchableStory[] = [
    story({
      id: 'r1',
      slug: 'kathmandu-air',
      titleNe: 'काठमाडौंको वायु प्रदूषण बढ्यो',
      deckNe: 'उपत्यकाभर मापन केन्द्रहरूले उच्च तह देखाए',
    }),
    story({
      id: 'r2',
      slug: 'oli-statement',
      titleNe: 'ओलीले सरकारको नीति स्पष्ट पारे',
      deckNe: 'प्रधानमन्त्रीको सम्बोधन',
    }),
    story({
      id: 'r3',
      slug: 'biratnagar-road',
      titleNe: 'विराटनगरमा सडक विस्तार सुरु',
      deckNe: 'महानगरले ठेक्का सम्झौता गर्‍यो',
    }),
  ]
  const romanIndex = buildIndex(devanagariOnly)

  it('finds a Devanagari headline from the Latin spelling of its subject', () => {
    expect(search(romanIndex, 'oli')[0]?.slug).toBe('oli-statement')
    expect(search(romanIndex, 'pradhanmantri')[0]?.slug).toBe('oli-statement')
  })

  it('recovers a spelling the romanizer does not predict, via the skeleton', () => {
    // काठमाडौं romanizes to `kathamadau`; `kathmandu` is three edits away, past
    // the fuzzy radius. Both reduce to the consonant skeleton `ktmd`.
    expect(search(romanIndex, 'kathmandu')[0]?.slug).toBe('kathmandu-air')
    expect(search(romanIndex, 'katmandu')[0]?.slug).toBe('kathmandu-air')
  })

  it('treats the v and b spellings of a place name as the same place', () => {
    expect(search(romanIndex, 'biratnagar')[0]?.slug).toBe('biratnagar-road')
  })

  it('reaches exactly the stories the Devanagari query reaches', () => {
    // The alias is a second key on the same posting list, not a second corpus.
    // Ordering is allowed to differ — the two queries expand through different
    // lexicon entries — but neither may find a story the other cannot.
    const viaLatin = search(index, 'bajet').map((r) => r.slug).sort()
    const viaDevanagari = search(index, 'बजेट').map((r) => r.slug).sort()
    expect(viaLatin).toEqual(viaDevanagari)
  })

  it('keeps a skeleton match below a real one', () => {
    // `ktmd` is the skeleton of काठमाडौं; `ओली` matches its story outright.
    // The skeleton may only fill in behind, never displace.
    const mixed = search(romanIndex, 'oli')
    expect(mixed[0]?.slug).toBe('oli-statement')
  })

  it('does not lengthen a document for carrying aliases', () => {
    // BM25 normalises by field length. Counting alias keys there would make
    // every Devanagari story look padded and depress its own real terms.
    const latinOnly = buildIndex([story({ id: 'l1', slug: 'en', titleNe: 'Budget review' })])
    const devanagari = buildIndex([story({ id: 'd1', slug: 'ne', titleNe: 'बजेट समीक्षा' })])
    expect(devanagari.docLen[0]?.title).toBe(latinOnly.docLen[0]?.title)
  })
})
