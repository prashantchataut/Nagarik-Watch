import NepaliDate from 'nepali-datetime'

export const BS_MONTHS = [
  'बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज',
  'कार्तिक', 'मंसिर', 'पुष', 'माघ', 'फागुन', 'चैत',
] as const

export const BS_MONTHS_EN = [
  'Baisakh', 'Jestha', 'Asadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
] as const

export const WEEKDAYS_NE = ['आइत', 'सोम', 'मङ्गल', 'बुध', 'बिही', 'शुक्र', 'शनि'] as const
export const WEEKDAYS_FULL_NE = [
  'आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार',
] as const

export function toDevanagari(value: number | string): string {
  const map = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']
  return String(value).replace(/[0-9]/g, (d) => map[Number(d)]!)
}

export function toLatinDigits(value: string): string {
  return value.replace(/[०-९]/g, (d) => String('०१२३४५६७८९'.indexOf(d)))
}

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
    return { year: 2083, month: 1, day: 1 }
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

/** Weekday (0=Sun) of the first day of a BS month. */
export function bsMonthFirstWeekday(year: number, month: number): number {
  const ad = bsToAd(year, month, 1)
  return ad ? ad.getDay() : 0
}


export function formatBsFull(bs: BsDate): string {
  const monthName = BS_MONTHS[bs.month - 1] ?? ''
  return `${toDevanagari(bs.day)} ${monthName} ${toDevanagari(bs.year)}`
}

export function formatBsMonthYear(year: number, month: number): string {
  return `${BS_MONTHS[month - 1]} ${toDevanagari(year)}`
}

export function formatAdFull(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

