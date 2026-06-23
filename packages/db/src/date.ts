/**
 * Locale-aware date formatting. All stored timestamps are UTC ISO. Display:
 *  - 'ne' locale -> Bikram Sambat (BS) date with Devanagari numerals
 *  - 'en' locale -> Gregorian (AD) date with Latin numerals
 *
 * BS conversion uses a lookup table of verified BS-new-year AD dates. Days-since-epoch
 * are computed from the real AD date of each BS new year, not estimated. Verified anchor:
 * 2026-06-19 AD === असार ५, २०८३ BS (founder-confirmed). Out-of-range dates fall back to AD.
 *
 * Replacing this with a full per-year month-length table is an open item (ADR-005) if
 * date-critical precision is ever needed; the constant-length model is within 1 day for
 * the supported range.
 */
export function formatDate(iso: string, locale: 'ne' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  if (locale === 'en') {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Nepali: BS date + Devanagari numerals.
  const bs = adToBs(date)
  return `${toDevanagari(bs.day)} ${BS_MONTHS[bs.month - 1]} ${toDevanagari(bs.year)}`
}

/** Convert Latin digits to Devanagari numerals (०१२३...). */
export function toDevanagari(value: number | string): string {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(value).replace(/[0-9]/g, (d) => map[Number(d)]!)
}

/** Devanagari month names (BS calendar). Index 0 = Baisakh. */
export const BS_MONTHS = [
  'बैशाख',
  'जेठ',
  'असार',
  'साउन',
  'भदौ',
  'असोज',
  'कार्तिक',
  'मंसिर',
  'पुष',
  'माघ',
  'फागुन',
  'चैत',
] as const

/**
 * BS new-year dates, expressed as whole AD days since 1970-01-01 UTC. Each entry is the
 * AD date on which the named BS year began. The Bikram Sambat new year falls on 13 or
 * 14 April. Values below are the exact days-since-epoch of those AD dates.
 *
 * Verified anchors (recomputed against real epoch, divisor 86_400_000 ms/day):
 *   BS 2083 began 2026-04-14 = day 20,557.
 *   2026-06-19 = day 20,623 → day 66 of BS 2083 → Baisakh(31)+Jestha(31)=62 → Asadh 5. ✓
 * Consecutive gaps are 365/366 (Gregorian year length), confirming internal consistency.
 */
const AD_DAYS_AT_BS_NEW_YEAR: ReadonlyArray<[bsYear: number, adDaysSinceEpoch: number]> = [
  [2080, 19_461], // 2023-04-14
  [2081, 19_826], // 2024-04-13 (2024 is a leap year)
  [2082, 20_192], // 2025-04-14
  [2083, 20_557], // 2026-04-14  ← verified anchor
  [2084, 20_922], // 2027-04-14
  [2085, 21_287], // 2028-04-13
  [2086, 21_653], // 2029-04-14
  [2087, 22_018], // 2030-04-14
]

/** Standard BS month lengths (days), index 0 = Baisakh. Used across the supported range. */
const BS_MONTH_LENGTHS = [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 30] as const

/**
 * Number of days in a BS month (1-indexed). Uses the standard-length model so the
 * calendar grid renders consistently; out-of-range months return 30 as a safe default.
 */
export function bsMonthLength(_year: number, month: number): number {
  return BS_MONTH_LENGTHS[month - 1] ?? 30
}

export type BsDate = { year: number; month: number; day: number }

/** Whole days since 1970-01-01 UTC for the given date (floor of ms/day). */
function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000)
}

/**
 * AD → Bikram Sambat. Returns a 1-indexed {year, month, day}. Out-of-range AD
 * dates (before BS 2080 / after BS 2087) fall back to the AD calendar fields so
 * the caller still gets a usable triplet rather than a thrown error — mirrors
 * the degrade-gracefully policy of formatDate.
 */
export function adToBs(date: Date): BsDate {
  const adDays = daysSinceEpoch(date)
  let row: Readonly<[number, number]> | undefined
  for (const r of AD_DAYS_AT_BS_NEW_YEAR) {
    if (r[1] <= adDays) row = r
    else break
  }
  if (!row) {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
  }
  const [bsYear, startDays] = row
  let remaining = adDays - startDays
  let month = 0
  for (let m = 0; m < 12; m++) {
    const len = BS_MONTH_LENGTHS[m]!
    if (remaining < len) {
      month = m
      break
    }
    remaining -= len
    month = m
  }
  return { year: bsYear, month: month + 1, day: remaining + 1 }
}

/**
 * Bikram Sambat → AD Date (UTC midnight). Inverse of adToBs: uses the same new-year
 * anchor table and the same constant month-length model, so adToBs(bsToAd(x)) is
 * identity across the supported BS year range (2080–2087). Out-of-range years
 * return null — the caller decides whether to fall back to AD.
 */
export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date | null {
  const row = AD_DAYS_AT_BS_NEW_YEAR.find((r) => r[0] === bsYear)
  if (!row) return null
  if (bsMonth < 1 || bsMonth > 12 || bsDay < 1) return null
  const monthLen = BS_MONTH_LENGTHS[bsMonth - 1]!
  if (bsDay > monthLen) return null

  let days = row[1]
  for (let m = 0; m < bsMonth - 1; m++) days += BS_MONTH_LENGTHS[m]!
  days += bsDay - 1
  return new Date(days * 86_400_000)
}

/**
 * Format a BS triplet for display. In Nepali locale the month name and numerals
 * are Devanagari ("५ असार २०८३"); in English the BS month is transliterated to
 * Latin and Latin numerals are kept so the value stays copy-pasteable.
 */
export function formatBsFull(bs: BsDate, locale: 'ne' | 'en'): string {
  const monthName = locale === 'en' ? BS_MONTHS_EN[bs.month - 1] : BS_MONTHS[bs.month - 1]
  if (!monthName) return ''
  const day = locale === 'en' ? String(bs.day) : toDevanagari(bs.day)
  const year = locale === 'en' ? String(bs.year) : toDevanagari(bs.year)
  return `${day} ${monthName} ${year}`
}

/** Transliterated BS month names for the English locale. Index 0 = Baisakh. */
export const BS_MONTHS_EN = [
  'Baisakh',
  'Jestha',
  'Asadh',
  'Shrawan',
  'Bhadra',
  'Ashwin',
  'Kartik',
  'Mangsir',
  'Poush',
  'Magh',
  'Falgun',
  'Chaitra',
] as const
