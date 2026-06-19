import { describe, expect, it } from 'vitest'
import { formatDate, toDevanagari } from './date'

describe('toDevanagari', () => {
  it('converts Latin digits to Devanagari numerals', () => {
    expect(toDevanagari(2024)).toBe('२०२४')
    expect(toDevanagari('2081-04-14')).toBe('२०८१-०४-१४')
  })
})

describe('formatDate', () => {
  it('formats an English-locale date as AD', () => {
    const out = formatDate('2024-08-15T00:00:00Z', 'en')
    expect(out).toMatch(/2024/)
  })

  it('formats a Nepali-locale date as BS with Devanagari numerals (verified anchor)', () => {
    // Founder-verified: 2026-06-19 AD === असार ५, २०८३ BS. This is the authoritative test.
    const out = formatDate('2026-06-19T00:00:00Z', 'ne')
    expect(out).toMatch(/[०-९]/)
    expect(out).toBe('५ असार २०८३')
  })

  it('maps the BS new year (2026-04-14) to बैशाख १ २०८३', () => {
    expect(formatDate('2026-04-14T00:00:00Z', 'ne')).toBe('१ बैशाख २०८३')
  })

  it('returns empty string for an invalid date', () => {
    expect(formatDate('not-a-date', 'en')).toBe('')
  })
})
