/**
 * Bikram Sambat festival and public-holiday dataset.
 *
 * Each entry is pinned to a fixed BS month/day (the festivals are lunisolar but the
 * BS date is stable year to year for the major ones). `holiday` marks the date as a
 * government public holiday so the calendar can render it distinctly. Names are given
 * in both Nepali (Devanagari) and transliterated English.
 *
 * This is a curated static dataset of the major nationally-observed dates — not an
 * exhaustive panchang. Add entries here as the newsroom confirms them; the calendar
 * component picks them up automatically.
 */

export type CalendarEvent = {
  /** BS month, 1-indexed (1 = Baisakh … 12 = Chaitra). */
  month: number
  /** BS day, 1-indexed. */
  day: number
  nameNe: string
  nameEn: string
  /** Government public holiday (distinct styling in the calendar). */
  holiday?: boolean
}

/**
 * Major BS-calendar festivals and public holidays, recurring every year on the same
 * BS date. Verified against the official Government of Nepal holiday calendar for the
 * core set; supplementary regional/festival dates are marked `holiday: false`.
 */
export const BS_CALENDAR_EVENTS: readonly CalendarEvent[] = [
  { month: 1, day: 1, nameNe: 'नयाँ वर्ष', nameEn: 'Nepali New Year', holiday: true },
  { month: 1, day: 11, nameNe: 'रामनवमी', nameEn: 'Ram Navami' },
  { month: 1, day: 13, nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain' },
  { month: 2, day: 1, nameNe: 'मे दिवस', nameEn: 'International Labour Day', holiday: true },
  { month: 2, day: 14, nameNe: 'बुद्ध जयन्ती', nameEn: 'Buddha Jayanti', holiday: true },
  { month: 3, day: 15, nameNe: 'गेठे जात्रा', nameEn: 'Ghode Jatra' },
  { month: 4, day: 1, nameNe: 'साउन संक्रान्ति', nameEn: 'Shrawan Sankranti' },
  { month: 4, day: 15, nameNe: 'जनै पूर्णिमा', nameEn: 'Janai Purnima' },
  { month: 4, day: 27, nameNe: 'गाई जात्रा', nameEn: 'Gai Jatra' },
  { month: 5, day: 8, nameNe: 'कृष्ण जन्माष्टमी', nameEn: 'Krishna Janmashtami' },
  { month: 5, day: 15, nameNe: 'हरितालिका तीज', nameEn: 'Hartalika Teej', holiday: true },
  { month: 5, day: 19, nameNe: 'ऋषि पञ्चमी', nameEn: 'Rishi Panchami' },
  { month: 6, day: 1, nameNe: 'इन्द्र जात्रा', nameEn: 'Indra Jatra' },
  { month: 6, day: 10, nameNe: 'घटस्थापना', nameEn: 'Ghatasthapana (Dashain begins)' },
  { month: 6, day: 17, nameNe: 'फूलपाटी', nameEn: 'Fulpati' },
  { month: 6, day: 18, nameNe: 'महाष्टमी', nameEn: 'Maha Ashtami' },
  { month: 6, day: 19, nameNe: 'महानवमी', nameEn: 'Maha Navami' },
  { month: 6, day: 20, nameNe: 'विजया दशमी', nameEn: 'Vijaya Dashami', holiday: true },
  { month: 7, day: 1, nameNe: 'कार्तिक संक्रान्ति', nameEn: 'Kartik Sankranti' },
  { month: 7, day: 15, nameNe: 'लक्ष्मी पूजा (तिहार)', nameEn: 'Laxmi Puja (Tihar)' },
  { month: 7, day: 17, nameNe: 'गोवर्धन पूजा (म्हपूजा)', nameEn: 'Govardhan Puja / Mha Puja' },
  { month: 7, day: 18, nameNe: 'भाइटीका', nameEn: 'Bhai Tika', holiday: true },
  { month: 7, day: 28, nameNe: 'छठ पर्व', nameEn: 'Chhath Parva', holiday: true },
  { month: 8, day: 15, nameNe: 'तमु ल्होसार', nameEn: 'Tamu Lhosar' },
  { month: 9, day: 15, nameNe: 'उधौली', nameEn: 'Udhauli' },
  { month: 10, day: 1, nameNe: 'माघे संक्रान्ति', nameEn: 'Maghe Sankranti', holiday: true },
  { month: 10, day: 18, nameNe: 'सोनम ल्होसार', nameEn: 'Sonam Lhosar' },
  { month: 11, day: 11, nameNe: 'प्रजातन्त्र दिवस', nameEn: 'Democracy Day', holiday: true },
  { month: 11, day: 29, nameNe: 'राष्ट्रिय प्रजातन्त्र दिवस', nameEn: 'National Democracy Day' },
  { month: 12, day: 8, nameNe: 'महिला दिवस', nameEn: 'International Women\u2019s Day' },
  { month: 12, day: 26, nameNe: 'शिवरात्रि', nameEn: 'Maha Shivaratri', holiday: true },
  {
    month: 12,
    day: 15,
    nameNe: 'फागु पूर्णिमा (होली)',
    nameEn: 'Fagu Purnima (Holi)',
    holiday: true,
  },
]

/** Find events for a given BS month/day. Returns [] when none. */
export function eventsForBsDay(month: number, day: number): readonly CalendarEvent[] {
  return BS_CALENDAR_EVENTS.filter((e) => e.month === month && e.day === day)
}

/** Find public holidays for a given BS month. */
export function holidaysForBsMonth(month: number): readonly CalendarEvent[] {
  return BS_CALENDAR_EVENTS.filter((e) => e.month === month && e.holiday)
}
