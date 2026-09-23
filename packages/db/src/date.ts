import NepaliDate from 'nepali-datetime'

export const BS_YEAR_MIN = 2000
export const BS_YEAR_MAX = 2099

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

export type BsDate = { year: number; month: number; day: number }

type CalendarDate = { year: number; month: number; day: number }

function kathmanduCalendarDate(date: Date): CalendarDate {
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid Gregorian date.')
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  if (!year || !month || !day) throw new RangeError('Could not resolve Kathmandu calendar date.')
  return { year, month, day }
}

function stableAdDate({ year, month, day }: CalendarDate): Date {
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
}

export function formatDate(iso: string, locale: 'ne' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const calendar = kathmanduCalendarDate(date)
  if (locale === 'en') {
    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ] as const
    return `${calendar.day} ${months[calendar.month - 1]} ${calendar.year}`
  }
  try {
    const bs = adToBs(stableAdDate(calendar))
    return formatBsFull(bs, 'ne')
  } catch {
    return `${calendar.day}/${calendar.month}/${calendar.year}`
  }
}

export function toDevanagari(value: number | string): string {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(value).replace(/[0-9]/g, (digit) => map[Number(digit)]!)
}

export function bsMonthLength(year: number, month: number): number {
  if (!Number.isInteger(year) || year < BS_YEAR_MIN || year > BS_YEAR_MAX) {
    throw new RangeError(`Bikram Sambat year must be ${BS_YEAR_MIN}-${BS_YEAR_MAX}.`)
  }
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError('Bikram Sambat month must be 1-12.')
  }
  const days = NepaliDate.getDaysOfMonth(year, month - 1)
  if (!Number.isInteger(days) || days < 28 || days > 32) {
    throw new RangeError('Calendar library returned an invalid Bikram Sambat month length.')
  }
  return days
}

export function adToBs(date: Date): BsDate {
  if (Number.isNaN(date.getTime())) throw new RangeError('Invalid Gregorian date.')
  const stable = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0),
  )
  const bs = new NepaliDate(stable)
  const value = { year: bs.getYear(), month: bs.getMonth() + 1, day: bs.getDate() }
  if (value.year < BS_YEAR_MIN || value.year > BS_YEAR_MAX || value.month < 1 || value.month > 12) {
    throw new RangeError(
      `Gregorian date falls outside supported Bikram Sambat range ${BS_YEAR_MIN}-${BS_YEAR_MAX}.`,
    )
  }
  return value
}

export function todayBsInKathmandu(now = new Date()): BsDate {
  return adToBs(stableAdDate(kathmanduCalendarDate(now)))
}

export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date | null {
  try {
    const maxDay = bsMonthLength(bsYear, bsMonth)
    if (!Number.isInteger(bsDay) || bsDay < 1 || bsDay > maxDay) return null
    const bs = new NepaliDate(bsYear, bsMonth - 1, bsDay)
    return bs.getDateObject()
  } catch {
    return null
  }
}

export function formatBsFull(bs: BsDate, locale: 'ne' | 'en'): string {
  const monthName = locale === 'en' ? BS_MONTHS_EN[bs.month - 1] : BS_MONTHS[bs.month - 1]
  if (!monthName) return ''
  const day = locale === 'en' ? String(bs.day) : toDevanagari(bs.day)
  const year = locale === 'en' ? String(bs.year) : toDevanagari(bs.year)
  return `${day} ${monthName} ${year}`
}

/**
 * Gregorian (AD) date formatting for the reader UI.
 *
 * These exist because `Intl` cannot be trusted with Nepali on the client.
 * Chromium ships no `ne` date or number data at all —
 * `Intl.DateTimeFormat.supportedLocalesOf(['ne-NP', 'ne'])` returns `[]` — so a
 * `ne-NP` format call silently resolves to `en-US` in the browser while Node's
 * full ICU resolves it properly. Two things went wrong because of that:
 *
 *   1. Every SSR'd client component that formatted a `ne-NP` date hydrated with a
 *      mismatch, and React threw away and re-rendered the subtree client-side.
 *   2. The client value wins that re-render, so Nepali readers were shown
 *      "Sep 17, 2026" where the server had correctly sent "१७ सेप्टेम्बर २०२६".
 *
 * So Nepali is formatted from the tables below rather than delegated, exactly as
 * `formatBsFull` already does for Bikram Sambat. English is built from parts too:
 * there is no reason to leave a second locale depending on ICU agreeing across
 * two runtimes when the cost of not doing so is one lookup table.
 *
 * The names are CLDR's own Nepali forms, so server output is unchanged from what
 * ICU was already producing — this fixes the client, it does not restyle the site.
 *
 * Everything here is pinned to Asia/Kathmandu. A Nepali news site states times in
 * Nepal time regardless of where the reader or the server sits.
 */
export const AD_MONTHS_NE = [
  'जनवरी',
  'फेब्रुअरी',
  'मार्च',
  'अप्रिल',
  'मे',
  'जुन',
  'जुलाई',
  'अगस्ट',
  'सेप्टेम्बर',
  'अक्टोबर',
  'नोभेम्बर',
  'डिसेम्बर',
] as const

export const AD_MONTHS_EN_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const

export const AD_WEEKDAYS_NE = [
  'आइतबार',
  'सोमबार',
  'मङ्गलबार',
  'बुधबार',
  'बिहिबार',
  'शुक्रबार',
  'शनिबार',
] as const

export const AD_WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

/** Single-glyph weekday initials for compact strips such as the reading heatmap. */
export const AD_WEEKDAYS_NARROW_NE = ['आ', 'सो', 'म', 'बु', 'बि', 'शु', 'श'] as const

export const AD_WEEKDAYS_NARROW_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

type KathmanduParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  weekday: number
}

/**
 * `en-CA` is the pivot rather than the display locale: it is supported in every
 * runtime and yields unambiguous ISO-ordered numeric parts, so the parts are the
 * same whether this runs in Node or a browser. Display formatting then happens
 * against the tables above.
 */
function kathmanduParts(value: Date | string | number): KathmanduParts | null {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  const year = pick('year')
  const month = pick('month')
  const day = pick('day')
  if (!year || !month || !day) return null
  // Derived from the Kathmandu calendar date rather than read off the Date, so
  // the weekday always belongs to the day actually being shown.
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  return { year, month, day, hour: pick('hour') || 0, minute: pick('minute') || 0, weekday }
}

function pad2(value: number, locale: 'ne' | 'en'): string {
  const padded = String(value).padStart(2, '0')
  return locale === 'ne' ? toDevanagari(padded) : padded
}

/** `17 Sep 2026` / `१७ सेप्टेम्बर २०२६` */
export function formatAdDate(value: Date | string | number, locale: 'ne' | 'en'): string {
  const parts = kathmanduParts(value)
  if (!parts) return ''
  if (locale === 'en') return `${parts.day} ${AD_MONTHS_EN_SHORT[parts.month - 1]} ${parts.year}`
  return `${toDevanagari(parts.day)} ${AD_MONTHS_NE[parts.month - 1]} ${toDevanagari(parts.year)}`
}

/** `Thursday, 17 Sep 2026` / `बिहिबार, १७ सेप्टेम्बर २०२६` */
export function formatAdDateLong(value: Date | string | number, locale: 'ne' | 'en'): string {
  const parts = kathmanduParts(value)
  if (!parts) return ''
  const weekday = locale === 'en' ? AD_WEEKDAYS_EN[parts.weekday] : AD_WEEKDAYS_NE[parts.weekday]
  return `${weekday}, ${formatAdDate(value, locale)}`
}

/** `14:05` / `१४:०५` — 24-hour, which is what Nepali broadcast style uses. */
export function formatAdTime(value: Date | string | number, locale: 'ne' | 'en'): string {
  const parts = kathmanduParts(value)
  if (!parts) return ''
  return `${pad2(parts.hour, locale)}:${pad2(parts.minute, locale)}`
}

/** `17 Sep 2026, 14:05` / `१७ सेप्टेम्बर २०२६, १४:०५` */
export function formatAdDateTime(value: Date | string | number, locale: 'ne' | 'en'): string {
  const parts = kathmanduParts(value)
  if (!parts) return ''
  return `${formatAdDate(value, locale)}, ${formatAdTime(value, locale)}`
}

/**
 * Grouped number. `Intl.NumberFormat('ne-NP')` has the same client gap as the
 * date formatters, so Nepali digits are produced here instead. Nepali uses the
 * same thousands grouping as English for these magnitudes (prices, scores,
 * counts), so the grouping is shared and only the digits differ.
 */
export function formatAdNumber(
  value: number,
  locale: 'ne' | 'en',
  fractionDigits?: number,
): string {
  if (!Number.isFinite(value)) return ''
  const grouped = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value)
  return locale === 'ne' ? toDevanagari(grouped) : grouped
}

/** `बि` / `T` — weekday initial only. */
export function formatAdWeekdayNarrow(value: Date | string | number, locale: 'ne' | 'en'): string {
  const parts = kathmanduParts(value)
  if (!parts) return ''
  const table = locale === 'en' ? AD_WEEKDAYS_NARROW_EN : AD_WEEKDAYS_NARROW_NE
  // `weekday` comes from getUTCDay() so it is always 0-6, but the tuple index is
  // typed `number` under noUncheckedIndexedAccess. Empty string rather than a
  // non-null assertion: a missing initial should leave a gap in the heatmap
  // strip, not crash the panel around it.
  return table[parts.weekday] ?? ''
}
