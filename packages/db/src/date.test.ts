import { describe, expect, it } from 'vitest'
import { adToBs, bsToAd, formatDate, formatBsFull, toDevanagari } from './date'

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

describe('adToBs', () => {
  it('maps the founder-verified anchor 2026-06-19 to Asadh 5, 2083', () => {
    const bs = adToBs(new Date('2026-06-19T00:00:00Z'))
    expect(bs).toEqual({ year: 2083, month: 3, day: 5 })
  })

  it('maps the BS new year 2026-04-14 to Baisakh 1, 2083', () => {
    const bs = adToBs(new Date('2026-04-14T00:00:00Z'))
    expect(bs).toEqual({ year: 2083, month: 1, day: 1 })
  })
})

describe('bsToAd', () => {
  it('inverts adToBs for the verified anchor', () => {
    const ad = bsToAd(2083, 3, 5)
    expect(ad).not.toBeNull()
    // nepali-datetime returns AD in Nepal time (UTC+05:45). Compare in Nepal time.
    const nepalDate = new Date(ad!.getTime() + 5 * 3600_000 + 45 * 60_000)
    expect(nepalDate.toISOString().slice(0, 10)).toBe('2026-06-19')
  })

  it('round-trips adToBs across the supported range', () => {
    const samples = [
      '2023-05-01',
      '2024-01-01',
      '2025-07-15',
      '2026-06-19',
      '2026-12-31',
      '2027-04-13',
      '2029-09-09',
    ]
    for (const iso of samples) {
      const ad = new Date(`${iso}T00:00:00Z`)
      const bs = adToBs(ad)
      const back = bsToAd(bs.year, bs.month, bs.day)
      expect(back).not.toBeNull()
      const nepalDate = new Date(back!.getTime() + 5 * 3600_000 + 45 * 60_000)
      expect(nepalDate.toISOString().slice(0, 10)).toBe(iso)
    }
  })

  it('rejects invalid month/day', () => {
    expect(bsToAd(2083, 13, 1)).toBeNull()
    expect(bsToAd(2083, 0, 1)).toBeNull()
    expect(bsToAd(2083, 1, 0)).toBeNull()
    expect(bsToAd(2083, 1, 99)).toBeNull()
  })
})

describe('formatBsFull', () => {
  it('renders Nepali locale with Devanagari month and numerals', () => {
    expect(formatBsFull({ year: 2083, month: 3, day: 5 }, 'ne')).toBe('५ असार २०८३')
  })

  it('renders English locale with transliterated month and Latin numerals', () => {
    expect(formatBsFull({ year: 2083, month: 3, day: 5 }, 'en')).toBe('5 Asadh 2083')
  })
})
