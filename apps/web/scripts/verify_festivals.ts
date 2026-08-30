/**
 * Verify the festival engine for BS 2083 against known AD dates:
 *  - Janai Purnima = Aug 28, 2026 (Bhadra 12)
 *  - Teej = Sep 14, 2026 · Rishi Panchami = Sep 16, 2026
 *  - Indra Jatra = Sep 25, 2026
 *  - Dashami = Oct 21, 2026 · Ghatasthapana Oct 11
 *  - Bhai Tika = Nov 11, 2026 · Chhath = Nov 15, 2026
 *  - Buddha Jayanti = May 1, 2026
 *  - Today: Aug 30, 2026 = Sunday = 2083-05-14, weekly holiday
 */
import { monthInfo, dayInfo } from '../src/lib/news/festivals'

const year = 2083
const all: string[] = []
for (let m = 1; m <= 12; m++) {
  const info = monthInfo(year, m)
  for (const d of info.daysData) {
    for (const e of d.events) {
      all.push(`${d.bsYear}-${String(d.bsMonth).padStart(2, '0')}-${String(d.bsDay).padStart(2, '0')} ${d.adISO} wd=${d.weekday} ${e.nameNe}${e.holiday ? ' [बिदा]' : ''}`)
    }
  }
}
console.log(`--- ${all.length} festival days in BS ${year} ---`)
console.log(all.join('\n'))

const today = dayInfo(2083, 5, 14)
if (today) {
  console.log('\nToday 2083-05-14:', JSON.stringify({
    ad: today.adISO, weekday: today.weekday,
    tithi: today.panchanga.pakshaNe + ' ' + today.panchanga.tithiNe,
    nakshatra: today.panchanga.nakshatraNe,
    yoga: today.panchanga.yogaNe,
    events: today.events.map((e) => e.nameNe),
    holiday: today.holiday,
  }))
}
