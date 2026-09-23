import { describe, expect, it } from 'vitest'
import {
  adToBs,
  bsMonthLength,
  bsToAd,
  formatAdDate,
  formatAdDateLong,
  formatAdDateTime,
  formatAdNumber,
  formatAdTime,
  formatDate,
  formatBsFull,
  todayBsInKathmandu,
  toDevanagari,
} from './date'

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

describe('calendar safety', () => {
  it('does not fabricate month lengths outside the supported BS range', () => {
    expect(() => bsMonthLength(2200, 1)).toThrow(RangeError)
    expect(() => bsMonthLength(2083, 13)).toThrow(RangeError)
  })

  it('resolves today from the Kathmandu civil date at UTC day boundaries', () => {
    expect(todayBsInKathmandu(new Date('2026-04-13T19:00:00Z'))).toEqual({
      year: 2083,
      month: 1,
      day: 1,
    })
  })
})

describe("Gregorian formatting is independent of the runtime's Nepali ICU data", () => {
  // 2026-09-17T08:20:00Z is 2026-09-17 14:05 in Kathmandu (UTC+5:45).
  const iso = '2026-09-17T08:20:00Z'

  it('formats Nepali from its own tables', () => {
    expect(formatAdDate(iso, 'ne')).toBe('१७ सेप्टेम्बर २०२६')
    expect(formatAdTime(iso, 'ne')).toBe('१४:०५')
    expect(formatAdDateTime(iso, 'ne')).toBe('१७ सेप्टेम्बर २०२६, १४:०५')
    expect(formatAdDateLong(iso, 'ne')).toBe('बिहिबार, १७ सेप्टेम्बर २०२६')
    expect(formatAdNumber(1234567, 'ne')).toBe('१,२३४,५६७')
  })

  it('formats English from the same parts', () => {
    expect(formatAdDate(iso, 'en')).toBe('17 Sep 2026')
    expect(formatAdDateTime(iso, 'en')).toBe('17 Sep 2026, 14:05')
    expect(formatAdDateLong(iso, 'en')).toBe('Thursday, 17 Sep 2026')
    expect(formatAdNumber(1234567, 'en')).toBe('1,234,567')
  })

  it('never asks Intl for a Nepali locale', () => {
    // This is the whole point of the module. Chromium resolves `ne`/`ne-NP` to
    // en-US because it ships no Nepali data, while Node's full ICU resolves it
    // properly — so any Intl call made with a Nepali locale renders differently
    // on the server and in the browser, which is precisely the hydration
    // mismatch these formatters exist to remove. Asserting on the locale
    // argument catches a reintroduction here even when the test process (Node)
    // would happily produce the right string and hide it.
    const seen: unknown[] = []
    const RealDateTimeFormat = Intl.DateTimeFormat
    const RealNumberFormat = Intl.NumberFormat
    Intl.DateTimeFormat = function (locales?: unknown, options?: unknown) {
      seen.push(locales)
      return new RealDateTimeFormat(locales as string, options as Intl.DateTimeFormatOptions)
    } as unknown as typeof Intl.DateTimeFormat
    Intl.NumberFormat = function (locales?: unknown, options?: unknown) {
      seen.push(locales)
      return new RealNumberFormat(locales as string, options as Intl.NumberFormatOptions)
    } as unknown as typeof Intl.NumberFormat
    try {
      formatAdDate(iso, 'ne')
      formatAdDateLong(iso, 'ne')
      formatAdDateTime(iso, 'ne')
      formatAdNumber(42, 'ne')
    } finally {
      Intl.DateTimeFormat = RealDateTimeFormat
      Intl.NumberFormat = RealNumberFormat
    }
    expect(seen.length).toBeGreaterThan(0)
    expect(seen.some((locale) => String(locale).toLowerCase().startsWith('ne'))).toBe(false)
  })

  it('pins output to Kathmandu regardless of the surrounding day boundary', () => {
    // 18:20 UTC is already the next calendar day in Kathmandu (00:05).
    expect(formatAdDate('2026-09-17T18:20:00Z', 'en')).toBe('18 Sep 2026')
    expect(formatAdTime('2026-09-17T18:20:00Z', 'en')).toBe('00:05')
  })

  it('returns an empty string for an unparseable value rather than throwing', () => {
    expect(formatAdDate('not-a-date', 'ne')).toBe('')
    expect(formatAdDateTime(Number.NaN, 'en')).toBe('')
    expect(formatAdNumber(Number.NaN, 'ne')).toBe('')
  })
})
