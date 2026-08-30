import { Body, Observer, Equator, Ecliptic, SearchRiseSet } from 'astronomy-engine'
import NepaliDate from 'nepali-datetime'

/**
 * Astronomical panchanga engine.
 *
 * Tithi, nakshatra, yoga and karana are derived from the apparent geocentric
 * ecliptic longitudes of the Moon and Sun (astronomy-engine, J2000 → true
 * equinox of date) evaluated at sunrise in Kathmandu — the classical panchanga
 * convention. Verified against: Vijaya Dashami 2083 (2026-10-21 = Shukla
 * Dashami), Janai Purnima 2083 (2026-08-28 = Purnima), Buddha Jayanti 2083
 * (2026-05-01 = Purnima).
 */

const KATHMANDU = new Observer(27.7172, 85.324, 1300)

/* ---------------- name tables ---------------- */

export const TITHI_NAMES = [
  'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी',
  'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी',
] as const

export const NAKSHATRA_NAMES = [
  'अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु',
  'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वाफाल्गुनी', 'उत्तराफाल्गुनी', 'हस्त', 'चित्रा',
  'स्वाती', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा', 'उत्तराषाढा',
  'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वाभाद्रपद', 'उत्तराभाद्रपद', 'रेवती',
] as const

export const YOGA_NAMES = [
  'विष्कम्भ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा',
  'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र',
  'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ',
  'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति',
] as const

const KARANA_ROTATING = ['बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि'] as const
const KARANA_FIXED = ['किंस्तुघ्न', 'शकुनि', 'चतुष्पद', 'नाग'] as const

/* ---------------- core astronomy ---------------- */

function moonSunLongitude(date: Date): { moon: number; sun: number } {
  const moonEqu = Equator(Body.Moon, date, KATHMANDU, true, true)
  const sunEqu = Equator(Body.Sun, date, KATHMANDU, true, true)
  const moon = Ecliptic(moonEqu.vec).elon
  const sun = Ecliptic(sunEqu.vec).elon
  return { moon, sun }
}

/** Sunrise in Kathmandu for a Nepal civil date (y-m-d in Nepal local time). */
export function kathmanduSunrise(y: number, m: number, d: number): Date {
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0)
  const dayStart = new Date(utcMidnight - 5.75 * 3600 * 1000) // 00:00 NPT
  try {
    const t = SearchRiseSet(Body.Sun, KATHMANDU, +1, dayStart, 1)
    if (t) return t.date
    return new Date(utcMidnight + 15 * 60 * 1000)
  } catch {
    return new Date(utcMidnight + 15 * 60 * 1000)
  }
}

/** Elongation (moon − sun) in degrees, 0–360. */
function elongation(date: Date): number {
  const { moon, sun } = moonSunLongitude(date)
  return (((moon - sun) % 360) + 360) % 360
}

/* ---------------- panchanga for a moment ---------------- */

export interface Panchanga {
  /** 0..29 — 0 Shukla Pratipada … 14 Purnima, 15 Krishna Pratipada … 29 Amavasya. */
  tithiIndex: number
  tithiNe: string
  pakshaNe: 'शुक्ल पक्ष' | 'कृष्ण पक्ष'
  nakshatraNe: string
  yogaNe: string
  karanaNe: string
  /** Moon − sun elongation in degrees. */
  elongation: number
}

export function panchangaAt(date: Date): Panchanga {
  const { moon, sun } = moonSunLongitude(date)
  const elong = (((moon - sun) % 360) + 360) % 360
  const tithiIndex = Math.floor(elong / 12)
  const paksha = tithiIndex <= 14 ? 'शुक्ल पक्ष' : 'कृष्ण पक्ष'
  const tithiNe =
    tithiIndex === 14 ? 'पूर्णिमा' : tithiIndex === 29 ? 'औंसी' : TITHI_NAMES[tithiIndex % 15]!

  const nakshatraNe = NAKSHATRA_NAMES[Math.floor(moon / (360 / 27)) % 27]!
  const yogaSum = (((moon + sun) % 360) + 360) % 360
  const yogaNe = YOGA_NAMES[Math.floor(yogaSum / (360 / 27)) % 27]!

  const karanaN = Math.floor(elong / 6)
  let karanaNe: string
  if (karanaN === 0) karanaNe = KARANA_FIXED[0]!
  else if (karanaN >= 57) karanaNe = KARANA_FIXED[karanaN - 56]!
  else karanaNe = KARANA_ROTATING[(karanaN - 1) % 7]!

  return { tithiIndex, tithiNe, pakshaNe: paksha as Panchanga['pakshaNe'], nakshatraNe, yogaNe, karanaNe, elongation: elong }
}

/** Panchanga of a Nepal civil day, evaluated at Kathmandu sunrise (classical rule). */
export function panchangaForAdDate(y: number, m: number, d: number): Panchanga {
  return panchangaAt(kathmanduSunrise(y, m, d))
}

/* ---------------- BS date helpers (re-exported surface) ---------------- */

export interface BsDate { year: number; month: number; day: number }

export function adToBsDate(date: Date): BsDate {
  const bs = new NepaliDate(date)
  return { year: bs.getYear(), month: bs.getMonth() + 1, day: bs.getDate() }
}

export function bsDateToAd(bs: BsDate): Date | null {
  try {
    // getDateObject() returns the Nepal-midnight instant (UTC−5:45 form);
    // shift to UTC midnight of the same Nepal civil date so ISO strings,
    // weekday and date getters behave predictably.
    const d = new NepaliDate(bs.year, bs.month - 1, bs.day).getDateObject()
    return new Date(d.getTime() + 5.75 * 3600 * 1000)
  } catch {
    return null
  }
}

export function bsMonthLength(year: number, month: number): number {
  try {
    return NepaliDate.getDaysOfMonth(year, month - 1)
  } catch {
    return 30
  }
}
