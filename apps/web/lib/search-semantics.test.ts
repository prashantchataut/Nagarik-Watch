import { describe, expect, it } from 'vitest'
import { buildTermVectors, termNeighbors } from './search-semantics'
import { buildIndex, search, type SearchableStory } from './search'
import { stemToken } from './nlp/stemmer'

function story(id: string, slug: string, titleNe: string, deckNe: string): SearchableStory {
  return {
    id,
    slug,
    category: { id: 'c', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe,
    titleEn: '',
    deckNe,
    deckEn: '',
    byline: '',
    publishedAt: '2026-06-01T00:00:00Z',
    hasEnglish: false,
    isBreaking: false,
    authors: [],
    heroImage: null,
  }
}

/**
 * A miniature archive with three topics, written the way a desk actually
 * writes: the same handful of words recur across stories about the same thing.
 * That recurrence is the only input the vectors get.
 */
const corpus: SearchableStory[] = [
  story('1', 'moscow-visit', 'पुटिनको मस्को भ्रमण सम्पन्न', 'रुस कूटनीति वार्ता'),
  story('2', 'moscow-talks', 'मस्कोमा पुटिन र चीन वार्ता', 'रुस कूटनीति बैठक'),
  story('3', 'putin-doctrine', 'पुटिनको नयाँ कूटनीति', 'रुस सम्बन्ध विस्तार'),
  story('4', 'budget-infra', 'बजेट पूर्वाधारमा केन्द्रित', 'अर्थ मन्त्रालय खर्च'),
  story('5', 'budget-health', 'बजेटमा स्वास्थ्य खर्च बढ्यो', 'अर्थ मन्त्रालय नीति'),
  story('6', 'budget-lag', 'बजेट कार्यान्वयन सुस्त', 'अर्थ मन्त्रालय समीक्षा'),
  story('7', 'monsoon-risk', 'मनसुन बाढी जोखिम', 'मौसम विभाग चेतावनी'),
  story('8', 'monsoon-prep', 'मनसुन तयारी अपुग', 'मौसम विभाग नीति'),
]

const index = buildIndex(corpus)

describe('termNeighbors', () => {
  it('learns that two words for the same story are related', () => {
    // The vectors are keyed the same way the postings are, on stems.
    const neighbors = termNeighbors(index.semantics, stemToken('मस्को'), 4).map((hit) => hit.term)
    expect(neighbors).toContain('पुटिन')
  })

  it('keeps unrelated topics apart', () => {
    const neighbors = termNeighbors(index.semantics, stemToken('बजेट'), 8).map((hit) => hit.term)
    expect(neighbors).not.toContain('पुटिन')
    expect(neighbors).not.toContain('मनसुन')
    // The budget cluster's own vocabulary is what it should be near.
    expect(neighbors).toContain('अर्थ')
  })

  it('refuses to guess from a single sighting', () => {
    const vectors = buildTermVectors([
      ['alpha', 'beta'],
      ['beta', 'gamma'],
      ['beta', 'gamma'],
    ])
    // `alpha` appears once, so it has no distribution to compare.
    expect(termNeighbors(vectors, 'alpha')).toEqual([])
  })

  it('has no opinion about a word the archive has never carried', () => {
    expect(termNeighbors(index.semantics, stemToken('क्रिकेट'))).toEqual([])
  })
})

describe('semantic fill in search', () => {
  it('reaches a story that shares no word with the query', () => {
    const slugs = search(index, 'मस्को').map((hit) => hit.slug)

    // The two lexical hits stay at the top, in lexical order.
    expect(slugs.slice(0, 2).sort()).toEqual(['moscow-talks', 'moscow-visit'])
    // `putin-doctrine` contains neither मस्को nor anything like it; it is here
    // because the archive uses पुटिन where the reader used मस्को.
    expect(slugs).toContain('putin-doctrine')
    expect(`${corpus[2]?.titleNe} ${corpus[2]?.deckNe}`).not.toContain('मस्को')
  })

  it('never lets a filled result outrank a lexical one', () => {
    const hits = search(index, 'मस्को')
    const lexical = hits.filter((hit) => hit.slug.startsWith('moscow-'))
    const filled = hits.filter((hit) => !hit.slug.startsWith('moscow-'))
    const weakestLexical = Math.min(...lexical.map((hit) => hit.score))
    for (const hit of filled) expect(hit.score).toBeLessThan(weakestLexical)
  })

  it('leaves a healthy result page alone', () => {
    const slugs = search(index, 'बजेट').map((hit) => hit.slug)
    expect(slugs.sort()).toEqual(['budget-health', 'budget-infra', 'budget-lag'])
  })

  it('stays out of the way when the kill switch is set', () => {
    const previous = process.env.SEARCH_SEMANTIC_LOCAL
    process.env.SEARCH_SEMANTIC_LOCAL = '0'
    try {
      const slugs = search(index, 'मस्को').map((hit) => hit.slug)
      expect(slugs.sort()).toEqual(['moscow-talks', 'moscow-visit'])
    } finally {
      if (previous === undefined) delete process.env.SEARCH_SEMANTIC_LOCAL
      else process.env.SEARCH_SEMANTIC_LOCAL = previous
    }
  })
})
