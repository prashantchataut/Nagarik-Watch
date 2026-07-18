import { describe, expect, it } from 'vitest'
import { CIVIC_QUERY_LEXICON, lexiconExpandTerm } from './search-lexicon'

describe('civic query lexicon', () => {
  it('expands bilingual budget terms both ways', () => {
    expect(lexiconExpandTerm('बजेट')).toEqual(expect.arrayContaining(['budget']))
    expect(lexiconExpandTerm('budget')).toEqual(expect.arrayContaining(['बजेट']))
  })

  it('returns empty for unknown terms', () => {
    expect(lexiconExpandTerm(' unrelated-token ')).toEqual([])
  })

  it('keeps every entry non-empty', () => {
    for (const [key, values] of Object.entries(CIVIC_QUERY_LEXICON)) {
      expect(key.trim().length).toBeGreaterThan(0)
      expect(values.length).toBeGreaterThan(0)
    }
  })
})
