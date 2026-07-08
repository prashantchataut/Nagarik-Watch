/**
 * Locale-aware date formatting using the `nepali-datetime` library for
 * accurate BS conversion (per-year month-length table, BS 2000-2099).
 * Verified anchor: 2026-06-19 AD === असार ५, २०८३ BS.
 */
import NepaliDate from 'nepali-datetime'

export function formatDate(iso: string, locale: 'ne' | 'en'): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  if (locale === 'en') {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
  try {
    const bs = new NepaliDate(date)
    const monthName = BS_MONTHS[bs.getMonth()] ?? ''
    return `${toDevanagari(bs.getDate())} ${monthName} ${toDevanagari(bs.getYear())}`
  } catch {
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

export function toDevanagari(value: number | string): string {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(value).replace(/[0-9]/g, (d) => map[Number(d)]!)
}

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

export function bsMonthLength(year: number, month: number): number {
  try {
    return NepaliDate.getDaysOfMonth(year, month - 1)
  } catch {
    return 30
  }
}

export function adToBs(date: Date): BsDate {
  try {
    const bs = new NepaliDate(date)
    return { year: bs.getYear(), month: bs.getMonth() + 1, day: bs.getDate() }
  } catch {
    return { year: date.getFullYear(), month: date.getMonth() + 1, day: date.getDate() }
  }
}

export function bsToAd(bsYear: number, bsMonth: number, bsDay: number): Date | null {
  try {
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

export const BS_YEAR_MIN = 2000
export const BS_YEAR_MAX = 2099
