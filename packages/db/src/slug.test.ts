import { describe, expect, it } from 'vitest'
import { toSlug, transliterate } from './slug'

// Expected values are the *actual* output of the `transliteration` library, captured by
// probing it directly. The library's romanization is approximate but stable; for URL
// slugs stability matters more than phonetic precision (slugs are editor-overridable).

describe('transliterate', () => {
  it('romanizes Devanagari to Latin (matra-aware)', () => {
    // `ने` = न + े-matra -> "ne"; the lib handles vowel signs that a char map can't.
    expect(transliterate('नेपाल')).toBe('nepaal')
  })

  it('preserves Latin input unchanged', () => {
    expect(transliterate('Nepal 2024')).toBe('Nepal 2024')
  })
})

describe('toSlug', () => {
  it('produces a lowercase hyphenated slug from Devanagari', () => {
    expect(toSlug('नेपाली राजनीति')).toBe('nepaalii-raajniiti')
  })

  it('preserves Latin input as a lowercase slug', () => {
    expect(toSlug('Nepal Politics 2024')).toBe('nepal-politics-2024')
  })

  it('converts Devanagari numerals to Latin in the slug', () => {
    expect(toSlug('बजेट २०८१')).toBe('bjett-2081')
  })

  it('strips leading/trailing separators', () => {
    expect(toSlug('---हेर्नुहोस्---')).toBe('hernuhos')
  })

  it('collapses repeated separators within the slug', () => {
    expect(toSlug('a   b')).toBe('a-b')
  })

  it('bounds slug length to 80 chars', () => {
    const long = 'नेपाल'.repeat(50)
    expect(toSlug(long).length).toBeLessThanOrEqual(80)
  })

  it('returns empty string for input with no slugifiable characters', () => {
    expect(toSlug('！！！')).toBe('')
  })
})
