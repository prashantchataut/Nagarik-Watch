import {
  panchangaForAdDate,
  adToBsDate,
  bsDateToAd,
  bsMonthLength,
  type Panchanga,
} from './panchanga'

/**
 * Festival engine — replaces the old fixed-date table.
 *
 *  - Solar / national observances have stable Bikram Sambat dates → fixed table.
 *  - Lunar festivals (Dashain, Tihar, Teej, Purnimas, …) are DERIVED for the
 *    requested year from the astronomical panchanga (tithi at Kathmandu sunrise),
 *    so the calendar is correct every year without manual updates.
 *  - A few international days are anchored to AD dates and converted per year.
 *
 * Windows are calibrated against purnimanta lunar-month reckoning (the festival
 * naming convention), which lags BS solar months by ~3 weeks — e.g. Shrawan
 * Purnima (Janai Purnima) falls in BS Bhadra, Ashwin-shukla Dashami in BS Kartik.
 * Verified anchors for 2083: Janai Purnima 2083-05-12 (Aug 28 2026), Teej
 * 2083-05-29 (Sep 14), Rishi Panchami 2083-05-31 (Sep 16), Indra Jatra
 * 2083-06-08 (Sep 25), Dashami 2083-07-04 (Oct 21), Bhai Tika 2083-07-26
 * (Nov 11), Chhath 2083-07-30 (Nov 15).
 *
 * Since वि.सं. २०८२ साउन, Saturday AND Sunday are both weekly public holidays.
 */

export interface FestivalEvent {
  nameNe: string
  nameEn: string
  holiday?: boolean
}

/** Weekly holiday rule — Saturday + Sunday (since 2082 Saun). */
export function isWeeklyHoliday(weekday: number): boolean {
  return weekday === 6 || weekday === 0
}

/* ---------------- solar (fixed BS) observances ---------------- */

const FIXED_BS: { month: number; day: number; event: FestivalEvent }[] = [
  { month: 2, day: 15, event: { nameNe: 'गणतन्त्र दिवस', nameEn: 'Republic Day', holiday: true } },
  { month: 3, day: 1, event: { nameNe: 'असार संक्रान्ति', nameEn: 'Asadh Sankranti' } },
  { month: 3, day: 15, event: { nameNe: 'राष्ट्रिय धान दिवस (दही–चिउरा)', nameEn: 'National Paddy Day' } },
  { month: 3, day: 29, event: { nameNe: 'भानु जयन्ती', nameEn: 'Bhanu Jayanti' } },
  { month: 4, day: 1, event: { nameNe: 'साउन संक्रान्ति', nameEn: 'Shrawan Sankranti' } },
  { month: 5, day: 3, event: { nameNe: 'संविधान दिवस', nameEn: 'Constitution Day', holiday: true } },
  { month: 8, day: 29, event: { nameNe: 'राष्ट्रिय बाल दिवस', nameEn: 'National Children Day' } },
  { month: 9, day: 15, event: { nameNe: 'तमु ल्होसार', nameEn: 'Tamu Lhosar', holiday: true } },
  { month: 10, day: 1, event: { nameNe: 'माघे संक्रान्ति / माघी पर्व', nameEn: 'Maghe Sankranti', holiday: true } },
  { month: 10, day: 16, event: { nameNe: 'शहीद दिवस', nameEn: 'Martyrs Day', holiday: true } },
  { month: 11, day: 7, event: { nameNe: 'प्रजातन्त्र दिवस', nameEn: 'Democracy Day', holiday: true } },
]

/* ---------------- lunar rules (tithi at sunrise, BS window) ---------------- */

interface LunarRule {
  /** tithiIndex 0..29 at sunrise. */
  tithi: number
  from: [number, number] // [bsMonth, bsDay] inclusive window start
  to: [number, number]
  /**
   * Optional guard: the purnima following this day (within 12 days) must fall
   * inside this window — disambiguates the two pakshas that can both touch a
   * wide window (e.g. real Vaishakha Tritiya vs the next month's tritiya).
   */
  purnimaIn?: [from: [number, number], to: [number, number]]
  event: FestivalEvent
}

const LUNAR_RULES: LunarRule[] = [
  // बैशाख–जेठ
  { tithi: 29, from: [1, 1], to: [2, 8], purnimaIn: [[1, 12], [2, 15]], event: { nameNe: 'मातातीर्थ औंसी (आमाको मुख हेर्ने दिन)', nameEn: "Mother's Day (Aunsi)" } },
  { tithi: 2, from: [1, 1], to: [2, 8], purnimaIn: [[1, 12], [2, 15]], event: { nameNe: 'अक्षय तृतीया', nameEn: 'Akshaya Tritiya' } },
  { tithi: 14, from: [1, 10], to: [2, 15], event: { nameNe: 'बुद्ध जयन्ती / उभौली पर्व / चण्डी पूर्णिमा', nameEn: 'Buddha Jayanti / Ubhauli', holiday: true } },
  { tithi: 9, from: [2, 5], to: [2, 30], event: { nameNe: 'गंगा दशहरा', nameEn: 'Ganga Dashahara' } },
  // असार–साउन
  { tithi: 14, from: [4, 1], to: [4, 20], event: { nameNe: 'गुरु पूर्णिमा', nameEn: 'Guru Purnima' } },
  { tithi: 4, from: [4, 8], to: [5, 8], event: { nameNe: 'नाग पञ्चमी', nameEn: 'Nag Panchami' } },
  { tithi: 14, from: [4, 20], to: [5, 20], event: { nameNe: 'जनै पूर्णिमा / रक्षाबन्धन / खिर खाने दिन', nameEn: 'Janai Purnima / Raksha Bandhan', holiday: true } },
  // भदौ
  { tithi: 15, from: [5, 8], to: [5, 20], event: { nameNe: 'गाईजात्रा', nameEn: 'Gai Jatra' } },
  { tithi: 22, from: [5, 10], to: [5, 28], event: { nameNe: 'कृष्ण जन्माष्टमी', nameEn: 'Krishna Janmashtami', holiday: true } },
  { tithi: 29, from: [5, 15], to: [6, 5], event: { nameNe: 'कुशे औंसी (बुवाको मुख हेर्ने दिन)', nameEn: "Father's Day (Kushe Aunsi)" } },
  { tithi: 2, from: [5, 24], to: [6, 8], event: { nameNe: 'हरितालिका तीज', nameEn: 'Haritalika Teej', holiday: true } },
  { tithi: 4, from: [5, 26], to: [6, 10], event: { nameNe: 'ऋषि पञ्चमी', nameEn: 'Rishi Panchami', holiday: true } },
  { tithi: 13, from: [5, 28], to: [6, 15], event: { nameNe: 'इन्द्रजात्रा (येँयाः पुन्हि)', nameEn: 'Indra Jatra', holiday: true } },
  // असोज–कार्तिक: दशैं र तिहार
  { tithi: 0, from: [6, 12], to: [6, 30], event: { nameNe: 'घटस्थापना', nameEn: 'Ghatasthapana', holiday: true } },
  { tithi: 6, from: [6, 18], to: [7, 10], event: { nameNe: 'फुलपाती', nameEn: 'Fulpati', holiday: true } },
  { tithi: 7, from: [6, 20], to: [7, 12], event: { nameNe: 'महाअष्टमी', nameEn: 'Maha Ashtami', holiday: true } },
  { tithi: 8, from: [6, 22], to: [7, 14], event: { nameNe: 'महानवमी', nameEn: 'Maha Navami', holiday: true } },
  { tithi: 9, from: [6, 24], to: [7, 16], event: { nameNe: 'विजया दशमी (दशैं टीका)', nameEn: 'Vijaya Dashami', holiday: true } },
  { tithi: 14, from: [7, 1], to: [7, 15], event: { nameNe: 'कोजाग्रत पूर्णिमा', nameEn: 'Kojagrat Purnima', holiday: true } },
  { tithi: 28, from: [7, 5], to: [7, 25], event: { nameNe: 'काग तिहार', nameEn: 'Kag Tihar' } },
  { tithi: 29, from: [7, 5], to: [7, 25], event: { nameNe: 'लक्ष्मी पूजा', nameEn: 'Laxmi Puja', holiday: true } },
  { tithi: 0, from: [7, 8], to: [7, 28], event: { nameNe: 'गोवर्धन पूजा / म्हः पूजा', nameEn: 'Govardhan / Mha Puja', holiday: true } },
  { tithi: 1, from: [7, 10], to: [7, 30], event: { nameNe: 'भाइटीका', nameEn: 'Bhai Tika', holiday: true } },
  { tithi: 5, from: [7, 15], to: [7, 30], event: { nameNe: 'छठ पर्व', nameEn: 'Chhath Parva', holiday: true } },
  // मंसिर–पुष
  { tithi: 4, from: [8, 15], to: [9, 12], event: { nameNe: 'विवाह पञ्चमी', nameEn: 'Vivah Panchami' } },
  { tithi: 28, from: [8, 5], to: [8, 25], event: { nameNe: 'बालचतुर्दशी', nameEn: 'Bala Chaturdashi' } },
  { tithi: 14, from: [8, 20], to: [9, 12], event: { nameNe: 'धान्य पूर्णिमा / योमरी पुन्हि / उधौली पर्व', nameEn: 'Yomari Punhi / Udhauli' } },
  { tithi: 29, from: [9, 15], to: [10, 10], event: { nameNe: 'सोनाम ल्होसार', nameEn: 'Sonam Lhosar', holiday: true } },
  // माघ–फागुन
  { tithi: 4, from: [10, 5], to: [10, 30], event: { nameNe: 'वसन्त पञ्चमी / श्रीपञ्चमी', nameEn: 'Basanta Panchami' } },
  { tithi: 14, from: [10, 5], to: [11, 10], event: { nameNe: 'माघे पूर्णिमा', nameEn: 'Maghe Purnima' } },
  { tithi: 29, from: [10, 12], to: [11, 8], event: { nameNe: 'ग्याल्पो ल्होसार', nameEn: 'Gyalpo Lhosar', holiday: true } },
  { tithi: 28, from: [11, 3], to: [12, 8], event: { nameNe: 'महाशिवरात्रि', nameEn: 'Maha Shivaratri', holiday: true } },
  { tithi: 14, from: [11, 18], to: [12, 15], event: { nameNe: 'फागु पूर्णिमा (होली)', nameEn: 'Fagu Purnima (Holi)', holiday: true } },
  // चैत (रामनवमी वर्षेनी वैशाख सुरुमै पर्न सक्छ — खिड्की वर्ष राउन्ड-द इयर विन्डो)
  { tithi: 7, from: [12, 5], to: [1, 6], event: { nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain' } },
  { tithi: 8, from: [12, 10], to: [1, 6], event: { nameNe: 'रामनवमी', nameEn: 'Ram Navami', holiday: true } },
]

/* ---------------- AD-anchored observances ---------------- */

const AD_EVENTS: { adMonth: number; adDay: number; event: FestivalEvent }[] = [
  { adMonth: 1, adDay: 1, event: { nameNe: 'अंग्रेजी नयाँ वर्ष', nameEn: 'English New Year' } },
  { adMonth: 2, adDay: 14, event: { nameNe: 'प्रेम दिवस', nameEn: "Valentine's Day" } },
  { adMonth: 3, adDay: 8, event: { nameNe: 'अन्तर्राष्ट्रिय महिला दिवस', nameEn: 'International Womens Day' } },
  { adMonth: 5, adDay: 1, event: { nameNe: 'अन्तर्राष्ट्रिय श्रमिक दिवस', nameEn: 'Labour Day', holiday: true } },
  { adMonth: 6, adDay: 5, event: { nameNe: 'विश्व वातावरण दिवस', nameEn: 'World Environment Day' } },
  { adMonth: 12, adDay: 10, event: { nameNe: 'मानव अधिकार दिवस', nameEn: 'Human Rights Day' } },
  { adMonth: 12, adDay: 25, event: { nameNe: 'क्रिसमस', nameEn: 'Christmas', holiday: true } },
]

/* ---------------- engine ---------------- */

export interface DayInfo {
  bsYear: number
  bsMonth: number
  bsDay: number
  adISO: string
  weekday: number // 0=Sun … 6=Sat
  panchanga: Panchanga
  events: FestivalEvent[]
  holiday: boolean // weekly or festival holiday
}

const monthDayVal = (m: number, d: number) => m * 40 + d

/** Window check that supports wrap-around across the BS new year (Chaitra → Baisakh). */
function inWindow(month: number, day: number, from: [number, number], to: [number, number]): boolean {
  const v = monthDayVal(month, day)
  const lo = monthDayVal(from[0], from[1])
  const hi = monthDayVal(to[0], to[1])
  if (lo <= hi) return v >= lo && v <= hi
  return v >= lo || v <= hi // wrap
}

/** Find the purnima tithi (index 14) within the 16 days after the given BS day. */
function purnimaAfter(bsYear: number, bsMonth: number, bsDay: number): { month: number; day: number } | null {
  let m = bsMonth
  let d = bsDay
  for (let i = 0; i < 16; i++) {
    d += 1
    const len = bsMonthLength(bsYear, m)
    if (d > len) {
      d = 1
      m = m === 12 ? 1 : m + 1
    }
    const ad = bsDateToAd({ year: bsYear, month: m, day: d })
    if (!ad) continue
    const p = panchangaForAdDate(ad.getUTCFullYear(), ad.getUTCMonth() + 1, ad.getUTCDate())
    if (p.tithiIndex === 14) return { month: m, day: d }
  }
  return null
}

/** Compute everything for one BS day. */
export function dayInfo(bsYear: number, bsMonth: number, bsDay: number): DayInfo | null {
  const ad = bsDateToAd({ year: bsYear, month: bsMonth, day: bsDay })
  if (!ad) return null
  const panchanga = panchangaForAdDate(ad.getUTCFullYear(), ad.getUTCMonth() + 1, ad.getUTCDate())

  const events: FestivalEvent[] = []

  for (const rule of LUNAR_RULES) {
    if (rule.tithi !== panchanga.tithiIndex) continue
    if (!inWindow(bsMonth, bsDay, rule.from, rule.to)) continue
    if (rule.purnimaIn) {
      const purnima = purnimaAfter(bsYear, bsMonth, bsDay)
      if (!purnima) continue
      if (!inWindow(purnima.month, purnima.day, rule.purnimaIn[0], rule.purnimaIn[1])) continue
    }
    events.push(rule.event)
  }

  for (const fixed of FIXED_BS) {
    if (fixed.month === bsMonth && fixed.day === bsDay) {
      events.push(fixed.event)
    }
  }
  if (bsMonth === 1 && bsDay === 1) {
    events.push({ nameNe: `नयाँ वर्ष ${bsYear}`, nameEn: 'New Year', holiday: true })
    events.push({ nameNe: 'वैशाख संक्रान्ति', nameEn: 'Baisakh Sankranti' })
  }

  // AD-anchored: check both AD years overlapping this BS year
  const startAd = bsDateToAd({ year: bsYear, month: 1, day: 1 })
  if (startAd) {
    for (const year of [startAd.getUTCFullYear(), startAd.getUTCFullYear() + 1]) {
      for (const ev of AD_EVENTS) {
        const d = new Date(Date.UTC(year, ev.adMonth - 1, ev.adDay, 6, 15))
        const bs = adToBsDate(d)
        if (bs.year === bsYear && bs.month === bsMonth && bs.day === bsDay) {
          events.push(ev.event)
        }
      }
    }
  }

  const weekday = ad.getUTCDay()
  const holiday = isWeeklyHoliday(weekday) || events.some((e) => e.holiday)

  return {
    bsYear,
    bsMonth,
    bsDay,
    adISO: ad.toISOString().slice(0, 10),
    weekday,
    panchanga,
    events,
    holiday,
  }
}

export interface MonthInfo {
  bsYear: number
  bsMonth: number
  days: number
  firstWeekday: number
  daysData: DayInfo[]
}

/** Compute a full BS month grid. */
export function monthInfo(bsYear: number, bsMonth: number): MonthInfo {
  const days = bsMonthLength(bsYear, bsMonth)
  const first = bsDateToAd({ year: bsYear, month: bsMonth, day: 1 })
  const firstWeekday = first ? first.getUTCDay() : 0
  const daysData: DayInfo[] = []
  for (let d = 1; d <= days; d++) {
    const info = dayInfo(bsYear, bsMonth, d)
    if (info) daysData.push(info)
  }

  // Boundary days of neighbouring months, so viddha-tithi duplicates that
  // straddle a month edge (e.g. Asoj 31 / Kartik 1) are also deduplicated.
  const prevMonth = bsMonth === 1 ? 12 : bsMonth - 1
  const prevYear = bsMonth === 1 ? bsYear - 1 : bsYear
  const prevLen = bsMonthLength(prevYear, prevMonth)
  const boundary: (DayInfo | null)[] = [
    dayInfo(prevYear, prevMonth, prevLen),
    ...daysData,
    dayInfo(bsMonth === 12 ? bsYear + 1 : bsYear, bsMonth === 12 ? 1 : bsMonth + 1, 1),
  ]

  // A tithi can span two consecutive sunrises (viddha tithi). When the same
  // rule matches on two adjacent days, keep the day the tithi still prevails
  // at Nepal noon — the classical convention for festival observance.
  for (let i = 0; i < boundary.length - 1; i++) {
    const a = boundary[i]
    const b = boundary[i + 1]
    if (!a || !b) continue
    const adjacent =
      Date.parse(`${b.adISO}T00:00:00Z`) - Date.parse(`${a.adISO}T00:00:00Z`) === 86400_000
    if (!adjacent) continue
    const duplicated = a.events.filter((e) => b.events.some((be) => be.nameNe === e.nameNe))
    if (duplicated.length === 0) continue
    // tithi still present at noon of the second day?
    const noonAd = new Date(`${b.adISO}T06:15:00.000Z`)
    const noon = panchangaForAdDate(noonAd.getUTCFullYear(), noonAd.getUTCMonth() + 1, noonAd.getUTCDate())
    const stillAtNoon = noon.tithiIndex === a.panchanga.tithiIndex
    const dropFrom = stillAtNoon ? a : b
    dropFrom.events = dropFrom.events.filter((e) => !duplicated.some((d) => d.nameNe === e.nameNe))
  }

  return { bsYear, bsMonth, days, firstWeekday, daysData }
}
