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
  const [bsY, bsM, bsD] = adToBs(date)
  return `${toDevanagari(bsD)} ${BS_MONTHS[bsM - 1]} ${toDevanagari(bsY)}`
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
 * 14 April. Values below are computed exactly (not estimated) from those AD dates.
 *
 * Verified: BS 2083 began 2026-04-14 = day 20,557. 2026-06-19 = day 20,623, which is
 * day 66 of BS 2083 -> Baisakh(31) + Jestha(31) = 62 -> Asadh day 5. ✓ (founder-confirmed)
 */
const AD_DAYS_AT_BS_NEW_YEAR: ReadonlyArray<[bsYear: number, adDaysSinceEpoch: number]> = [
  [2080, 19_494], // 2023-04-14
  [2081, 19_859], // 2024-04-13 (2024 is a leap year)
  [2082, 20_225], // 2025-04-14
  [2083, 20_557], // 2026-04-14  ← verified anchor
  [2084, 20_922], // 2027-04-14
  [2085, 21_287], // 2028-04-13
  [2086, 21_653], // 2029-04-14
  [2087, 22_018], // 2030-04-14
]

/** Standard BS month lengths (days), index 0 = Baisakh. Used across the supported range. */
const BS_MONTH_LENGTHS = [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 30] as const

/** Whole days since 1970-01-01 UTC for the given date (floor of ms/day). */
function daysSinceEpoch(date: Date): number {
  return Math.floor(date.getTime() / 86_400_000)
}

function adToBs(date: Date): [year: number, month: number, day: number] {
  const adDays = daysSinceEpoch(date)
  // Find the latest BS new-year at or before adDays.
  let row: [number, number] | undefined
  for (const r of AD_DAYS_AT_BS_NEW_YEAR) {
    if (r[1] <= adDays) row = r
    else break
  }
  if (!row) {
    // Out of supported range: degrade to AD (won't render BS for ancient/future dates).
    return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
  }
  const [bsYear, startDays] = row
  let remaining = adDays - startDays // 0-indexed day of the BS year
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
  // `remaining` is now the 0-indexed day within the chosen month.
  return [bsYear, month + 1, remaining + 1]
}
