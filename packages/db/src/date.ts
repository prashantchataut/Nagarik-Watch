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
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const
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
  const stable = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0))
  const bs = new NepaliDate(stable)
  const value = { year: bs.getYear(), month: bs.getMonth() + 1, day: bs.getDate() }
  if (value.year < BS_YEAR_MIN || value.year > BS_YEAR_MAX || value.month < 1 || value.month > 12) {
    throw new RangeError(`Gregorian date falls outside supported Bikram Sambat range ${BS_YEAR_MIN}-${BS_YEAR_MAX}.`)
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
