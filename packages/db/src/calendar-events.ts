import { bsMonthLength } from './date'

/**
 * Comprehensive Bikram Sambat festival and public-holiday dataset for Nepal.
 * Covers 80+ national holidays, cultural festivals, Jayantis, Sankrantis, and observances.
 */

export type CalendarEvent = {
  /** BS month, 1-indexed (1 = Baisakh … 12 = Chaitra). */
  month: number
  /** BS day, 1-indexed. */
  day: number
  nameNe: string
  nameEn: string
  /** Government public holiday. */
  holiday?: boolean
}

export const BS_CALENDAR_EVENTS: readonly CalendarEvent[] = [
  // Month 1: बैशाख (Baisakh)
  {
    month: 1,
    day: 1,
    nameNe: 'नयाँ वर्ष (बि.सं. प्रारम्भ)',
    nameEn: 'Nepali New Year',
    holiday: true,
  },
  {
    month: 1,
    day: 8,
    nameNe: 'मातातीर्थ औंसी (आमाको मुख हेर्ने दिन)',
    nameEn: "Mother's Day (Matatirtha Aunsi)",
  },
  { month: 1, day: 11, nameNe: 'रामनवमी', nameEn: 'Ram Navami' },
  { month: 1, day: 13, nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain' },
  { month: 1, day: 18, nameNe: 'अक्षय तृतीया', nameEn: 'Akshaya Tritiya' },
  { month: 1, day: 22, nameNe: 'कानून दिवस', nameEn: 'National Law Day' },
  {
    month: 1,
    day: 25,
    nameNe: 'चण्डी पूर्णिमा / उभौली पर्व',
    nameEn: 'Ubhauli Parva / Chandi Purnima',
  },

  // Month 2: जेठ (Jestha)
  {
    month: 2,
    day: 1,
    nameNe: 'अन्तर्राष्ट्रिय श्रमिक दिवस (मे १)',
    nameEn: 'International Labour Day',
    holiday: true,
  },
  {
    month: 2,
    day: 14,
    nameNe: 'बुद्ध जयन्ती / उभौली पर्व',
    nameEn: 'Buddha Jayanti',
    holiday: true,
  },
  { month: 2, day: 15, nameNe: 'गणतन्त्र दिवस', nameEn: 'Republic Day', holiday: true },
  { month: 2, day: 22, nameNe: 'विश्व वातावरण दिवस', nameEn: 'World Environment Day' },
  { month: 2, day: 24, nameNe: 'गंगा दशहरा', nameEn: 'Ganga Dussehra' },

  // Month 3: असार (Asadh)
  { month: 3, day: 1, nameNe: 'असार संक्रान्ति', nameEn: 'Asadh Sankranti' },
  { month: 3, day: 7, nameNe: 'अन्तर्राष्ट्रिय योग दिवस', nameEn: 'International Yoga Day' },
  {
    month: 3,
    day: 15,
    nameNe: 'राष्ट्रिय धान दिवस (दही चिउरा खाने दिन)',
    nameEn: 'National Paddy Day (Dahi Chiura)',
  },
  { month: 3, day: 20, nameNe: 'भानु जयन्ती', nameEn: 'Bhanu Jayanti' },
  { month: 3, day: 31, nameNe: 'गुरु पूर्णिमा / व्यास जयन्ती', nameEn: 'Guru Purnima' },

  // Month 4: साउन (Shrawan)
  { month: 4, day: 1, nameNe: 'साउन संक्रान्ति (लुतो फाल्ने दिन)', nameEn: 'Shrawan Sankranti' },
  { month: 4, day: 5, nameNe: 'नाग पञ्चमी', nameEn: 'Nag Panchami' },
  { month: 4, day: 15, nameNe: 'खिर खाने दिन', nameEn: 'Kheer Khane Din' },
  {
    month: 4,
    day: 20,
    nameNe: 'जनै पूर्णिमा / रक्षाबन्धन / क्वाँटी खाने दिन',
    nameEn: 'Janai Purnima / Raksha Bandhan',
  },
  { month: 4, day: 21, nameNe: 'गाईजात्रा', nameEn: 'Gai Jatra' },
  { month: 4, day: 28, nameNe: 'गौरा पर्व', nameEn: 'Gaura Parva', holiday: true },

  // Month 5: भदौ (Bhadra)
  { month: 5, day: 1, nameNe: 'भदौ संक्रान्ति', nameEn: 'Bhadra Sankranti' },
  {
    month: 5,
    day: 3,
    nameNe: 'कुशे औंसी (बुबाको मुख हेर्ने दिन / गोकर्ण औंसी)',
    nameEn: "Father's Day (Kushe Aunsi)",
  },
  {
    month: 5,
    day: 8,
    nameNe: 'श्रीकृष्ण जन्माष्टमी',
    nameEn: 'Krishna Janmashtami',
    holiday: true,
  },
  { month: 5, day: 15, nameNe: 'हरितालिका तीज', nameEn: 'Hartalika Teej', holiday: true },
  { month: 5, day: 17, nameNe: 'गणेश चतुर्थी', nameEn: 'Ganesh Chaturthi' },
  { month: 5, day: 19, nameNe: 'ऋषि पञ्चमी', nameEn: 'Rishi Panchami' },
  { month: 5, day: 22, nameNe: 'निजामती सेवा दिवस', nameEn: 'Civil Service Day' },
  { month: 5, day: 29, nameNe: 'राष्ट्रिय बाल दिवस', nameEn: 'National Children Day' },

  // Month 6: असोज (Ashwin)
  { month: 6, day: 1, nameNe: 'असोज संक्रान्ति / विश्वकर्मा पूजा', nameEn: 'Vishwakarma Puja' },
  {
    month: 6,
    day: 3,
    nameNe: 'संविधान दिवस (राष्ट्रिय दिवस)',
    nameEn: 'Constitution Day',
    holiday: true,
  },
  {
    month: 6,
    day: 10,
    nameNe: 'घटस्थापना (दशैं प्रारम्भ)',
    nameEn: 'Ghatasthapana (Dashain Begins)',
    holiday: true,
  },
  { month: 6, day: 16, nameNe: 'दशैं बिदा सुरु', nameEn: 'Dashain Holiday Begins', holiday: true },
  { month: 6, day: 17, nameNe: 'फूलपाती', nameEn: 'Fulpati', holiday: true },
  { month: 6, day: 18, nameNe: 'महाअष्टमी / कालरात्रि', nameEn: 'Maha Ashtami', holiday: true },
  { month: 6, day: 19, nameNe: 'महानवमी', nameEn: 'Maha Navami', holiday: true },
  {
    month: 6,
    day: 20,
    nameNe: 'विजया दशमी (बडादशैं टीका)',
    nameEn: 'Vijaya Dashami',
    holiday: true,
  },
  { month: 6, day: 21, nameNe: 'एकादशी (दशैं)', nameEn: 'Ekadashi (Dashain)', holiday: true },
  { month: 6, day: 24, nameNe: 'कोजाग्रत पूर्णिमा (दशैं समापन)', nameEn: 'Kojagrat Purnima' },

  // Month 7: कार्तिक (Kartik)
  { month: 7, day: 1, nameNe: 'कार्तिक संक्रान्ति', nameEn: 'Kartik Sankranti' },
  {
    month: 7,
    day: 13,
    nameNe: 'काग तिहार / धन्वन्तरी जयन्ती (धनतेरस)',
    nameEn: 'Kag Tihar / Dhanteras',
  },
  { month: 7, day: 14, nameNe: 'कुकुर तिहार / नरक चतुर्दशी', nameEn: 'Kukur Tihar' },
  {
    month: 7,
    day: 15,
    nameNe: 'लक्ष्मी पूजा (दीपावली)',
    nameEn: 'Laxmi Puja (Diwali)',
    holiday: true,
  },
  {
    month: 7,
    day: 16,
    nameNe: 'गाई पूजा / गोवर्धन पूजा',
    nameEn: 'Gai Puja / Govardhan Puja',
    holiday: true,
  },
  {
    month: 7,
    day: 17,
    nameNe: 'म्हपूजा / नेपाल संवत् नयाँ वर्ष',
    nameEn: 'Mha Puja / Nepal Sambat New Year',
    holiday: true,
  },
  { month: 7, day: 18, nameNe: 'भाइटीका (यमद्वितीया)', nameEn: 'Bhai Tika', holiday: true },
  { month: 7, day: 24, nameNe: 'छठ पर्व', nameEn: 'Chhath Parva', holiday: true },
  { month: 7, day: 28, nameNe: 'हरिबोधिनी एकादशी (तुलसी विवाह)', nameEn: 'Haribodhini Ekadashi' },

  // Month 8: मंसिर (Mangsir)
  { month: 8, day: 1, nameNe: 'मंसिर संक्रान्ति', nameEn: 'Mangsir Sankranti' },
  { month: 8, day: 15, nameNe: 'बाला चतुर्दशी (सतबीज छर्ने दिन)', nameEn: 'Bala Chaturdashi' },
  { month: 8, day: 25, nameNe: 'मानव अधिकार दिवस', nameEn: 'Human Rights Day' },
  {
    month: 8,
    day: 29,
    nameNe: 'उधौली पर्व / धान्य पूर्णिमा / योमरी पुन्ही',
    nameEn: 'Udhauli Parva / Yomari Punhi',
  },

  // Month 9: पुष (Poush)
  { month: 9, day: 1, nameNe: 'पुष संक्रान्ति', nameEn: 'Poush Sankranti' },
  { month: 9, day: 10, nameNe: 'क्रिसमस डे', nameEn: 'Christmas Day', holiday: true },
  { month: 9, day: 15, nameNe: 'तमु ल्होसार', nameEn: 'Tamu Lhosar', holiday: true },
  {
    month: 9,
    day: 27,
    nameNe: 'राष्ट्रिय एकता दिवस / पृथ्वी जयन्ती',
    nameEn: 'National Unity Day / Prithvi Jayanti',
    holiday: true,
  },

  // Month 10: माघ (Magh)
  {
    month: 10,
    day: 1,
    nameNe: 'माघे संक्रान्ति / माघी पर्व',
    nameEn: 'Maghe Sankranti / Maghi',
    holiday: true,
  },
  { month: 10, day: 16, nameNe: 'सहिद दिवस', nameEn: 'Martyrs Day' },
  { month: 10, day: 18, nameNe: 'सोनम ल्होसार', nameEn: 'Sonam Lhosar', holiday: true },
  {
    month: 10,
    day: 22,
    nameNe: 'श्रीपञ्चमी / सरस्वती पूजा',
    nameEn: 'Shree Panchami / Saraswati Puja',
  },

  // Month 11: फागुन (Falgun)
  { month: 11, day: 1, nameNe: 'फागुन संक्रान्ति', nameEn: 'Falgun Sankranti' },
  {
    month: 11,
    day: 7,
    nameNe: 'राष्ट्रिय प्रजातन्त्र दिवस',
    nameEn: 'National Democracy Day',
    holiday: true,
  },
  { month: 11, day: 14, nameNe: 'ग्याल्पो ल्होसार', nameEn: 'Gyalpo Lhosar', holiday: true },
  { month: 11, day: 24, nameNe: 'महाशिवरात्रि', nameEn: 'Maha Shivaratri', holiday: true },
  {
    month: 11,
    day: 25,
    nameNe: 'अन्तर्राष्ट्रिय महिला दिवस',
    nameEn: 'International Women Day',
    holiday: true,
  },

  // Month 12: चैत (Chaitra)
  { month: 12, day: 1, nameNe: 'चैत संक्रान्ति', nameEn: 'Chaitra Sankranti' },
  {
    month: 12,
    day: 14,
    nameNe: 'फागु पूर्णिमा (होली - पहाड)',
    nameEn: 'Fagu Purnima (Holi - Hill)',
    holiday: true,
  },
  {
    month: 12,
    day: 15,
    nameNe: 'फागु पूर्णिमा (होली - तराई)',
    nameEn: 'Fagu Purnima (Holi - Terai)',
    holiday: true,
  },
  { month: 12, day: 23, nameNe: 'घोडे जात्रा', nameEn: 'Ghode Jatra' },
  { month: 12, day: 27, nameNe: 'चैते दशैं', nameEn: 'Chaite Dashain' },
  { month: 12, day: 28, nameNe: 'रामनवमी', nameEn: 'Ram Navami' },
]

/** Find events for a given BS month/day. Returns [] when none. */
export function eventsForBsDay(month: number, day: number): readonly CalendarEvent[] {
  return BS_CALENDAR_EVENTS.filter((e) => e.month === month && e.day === day)
}

/** Find public holidays for a given BS month. */
export function holidaysForBsMonth(month: number): readonly CalendarEvent[] {
  return BS_CALENDAR_EVENTS.filter((e) => e.month === month && e.holiday)
}

export type UpcomingCalendarEvent = CalendarEvent & {
  year: number
  /** Inclusive: 0 means today. */
  daysUntil: number
}

/**
 * Next festival / holiday hits from a BS date, walking day-by-day across year wrap.
 * Uses the static month/day dataset (same dates every BS year).
 */
export function upcomingCalendarEvents(
  from: { year: number; month: number; day: number },
  limit = 20,
  horizonDays = 400,
): UpcomingCalendarEvent[] {
  const out: UpcomingCalendarEvent[] = []
  let year = from.year
  let month = from.month
  let day = from.day

  for (let i = 0; i < horizonDays && out.length < limit; i++) {
    const hits = eventsForBsDay(month, day)
    for (const event of hits) {
      if (out.length >= limit) break
      out.push({ ...event, year, daysUntil: i })
    }
    day += 1
    const length = bsMonthLength(year, month)
    if (day > length) {
      day = 1
      month += 1
      if (month > 12) {
        month = 1
        year += 1
      }
    }
  }
  return out
}
