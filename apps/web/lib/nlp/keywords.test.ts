import { describe, expect, it } from 'vitest'
import { extractKeywords } from './keywords'

describe('extractKeywords', () => {
  it('ranks the most frequent non-stopword terms first', () => {
    const keywords = extractKeywords('बाढी बाढी बाढी सडक सडक पहिरो', 3)
    expect(keywords[0]).toEqual({ term: 'बाढी', freq: 3 })
    expect(keywords.map((k) => k.term)).toContain('सडक')
  })

  it('drops stopwords and single-character tokens', () => {
    const keywords = extractKeywords('the a र को समाचार समाचार')
    expect(keywords.map((k) => k.term)).not.toContain('र')
    expect(keywords.map((k) => k.term)).not.toContain('को')
    expect(keywords[0]).toEqual({ term: 'समाचार', freq: 2 })
  })

  it('respects the limit', () => {
    expect(extractKeywords('one two three four five six', 2)).toHaveLength(2)
  })
})
