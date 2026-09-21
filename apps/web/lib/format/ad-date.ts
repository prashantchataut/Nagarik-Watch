import { toDevanagari } from '@nagarikwatch/db'

/**
 * Deterministic Gregorian (AD) date formatting for surfaces that are rendered on
 * both the server and the client.
 *
 * Why not `Intl.DateTimeFormat('ne-NP')`: Node ships full ICU, the browser may
 * not. `ne-NP` produced "२०२६ सेप्टेम्बर १७" on the server and "Sep 17, 2026" in
 * Chromium, which React reports as a hydration mismatch and then re-renders the
 * whole tree. Formatting from `en-GB` parts plus our own month/weekday tables is
 * byte-identical everywhere.
 *
 * All formatting is pinned to Asia/Kathmandu, the newsroom's editorial clock.
 */
const TIME_ZONE = 'Asia/Kathmandu'

const AD_MONTHS_EN = [
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

const AD_MONTHS_EN_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const AD_MONTHS_NE = [
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

const AD_WEEKDAYS_EN = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const AD_WEEKDAYS_EN_NARROW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as const

const AD_WEEKDAYS_NE = [
  'आइतबार',
  'सोमबार',
  'मङ्गलबार',
  'बुधबार',
  'बिहीबार',
  'शुक्रबार',
  'शनिबार',
] as const

/** First letter of each Nepali weekday name, for compact axis labels. */
const AD_WEEKDAYS_NE_NARROW = ['आ', 'सो', 'म', 'बु', 'बि', 'शु', 'श'] as const

export type AdDateStyle = 'short' | 'long' | 'weekday-long' | 'weekday-narrow'

export type AdDateParts = {
  year: number
  month: number
  day: number
  weekday: number
}

/** Kathmandu calendar parts for an instant. Deterministic across runtimes. */
export function adDateParts(date: Date): AdDateParts {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date)
  const num = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)
  const year = num('year')
  const month = num('month')
  const day = num('day')
  return { year, month, day, weekday: new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay() }
}

/**
 * Format an AD date for readers. `locale` is the two-letter portal locale, not a
 * BCP-47 tag: Nepali output is transliterated locally rather than delegated to ICU.
 */
export function formatAdDate(
  date: Date,
  locale: 'ne' | 'en',
  style: AdDateStyle = 'short',
): string {
  const { year, month, day, weekday } = adDateParts(date)
  const nepali = locale === 'ne'
  const digits = (value: number) => (nepali ? toDevanagari(value) : String(value))

  switch (style) {
    case 'long':
      return nepali
        ? `${digits(day)} ${AD_MONTHS_NE[month - 1] ?? ''} ${digits(year)}`
        : `${day} ${AD_MONTHS_EN_LONG[month - 1] ?? ''} ${year}`
    case 'weekday-long':
      return nepali
        ? `${AD_WEEKDAYS_NE[weekday] ?? ''}, ${digits(day)} ${AD_MONTHS_NE[month - 1] ?? ''} ${digits(year)}`
        : `${AD_WEEKDAYS_EN[weekday] ?? ''}, ${day} ${AD_MONTHS_EN_LONG[month - 1] ?? ''} ${year}`
    case 'weekday-narrow':
      return nepali
        ? (AD_WEEKDAYS_NE_NARROW[weekday] ?? '')
        : (AD_WEEKDAYS_EN_NARROW[weekday] ?? '')
    case 'short':
    default:
      return nepali
        ? `${AD_MONTHS_NE[month - 1] ?? ''} ${digits(day)}, ${digits(year)}`
        : `${AD_MONTHS_EN[month - 1] ?? ''} ${day}, ${year}`
  }
}

/** `Sep 17, 2026 – Oct 17, 2026` (or the Nepali equivalent). */
export function formatAdDateRange(
  from: Date,
  to: Date,
  locale: 'ne' | 'en',
  style: AdDateStyle = 'short',
): string {
  return `${formatAdDate(from, locale, style)} – ${formatAdDate(to, locale, style)}`
}

/** 24-hour `HH:mm` in Kathmandu time, deterministic across runtimes. */
export function formatKathmanduTime(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '00'
  return `${value('hour')}:${value('minute')}`
}
