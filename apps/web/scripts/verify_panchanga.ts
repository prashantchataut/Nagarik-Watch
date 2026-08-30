/**
 * Sanity-check the astronomical panchanga engine before wiring it in.
 * Anchors: Dashain Tika (Vijaya Dashami) 2083 = Oct 21 2026 AD;
 *          Janai Purnima 2026 = Aug 28 2026 AD; New Year 2083 = Apr 14 2026 AD.
 */
import { Body, Observer, Equator, Ecliptic, AstroTime, SearchRiseSet } from 'astronomy-engine'
import NepaliDate from 'nepali-datetime'

const KTM = new Observer(27.7172, 85.324, 1300)

/** Geocentric apparent ecliptic longitude of a body at a given time (degrees). */
function eclipticLongitude(body: Body, date: Date): number {
  const equ = Equator(body, date, KTM, true, true)
  const ecl = Ecliptic(equ.vec)
  return ecl.elon
}

/** Tithi index (0..29) at a given moment: 0 = Shukla Pratipada, 14 = Purnima, 15 = Krishna Pratipada, 29 = Amavasya */
function tithiIndex(date: Date): number {
  const moon = eclipticLongitude(Body.Moon, date)
  const sun = eclipticLongitude(Body.Sun, date)
  const diff = (((moon - sun) % 360) + 360) % 360
  return Math.floor(diff / 12)
}

/** Sunrise in Kathmandu for a Nepal civil date (UTC). Nepal day starts 18:15Z prev day. */
function sunrise(y: number, m: number, d: number): Date {
  const utcMidnight = Date.UTC(y, m - 1, d, 0, 0)
  const dayStart = new Date(utcMidnight - 5.75 * 3600 * 1000)
  try {
    return (SearchRiseSet(Body.Sun, KTM, +1, dayStart, 1) as AstroTime).date
  } catch {
    return new Date(utcMidnight + 15 * 60 * 1000)
  }
}

function check(label: string, y: number, m: number, d: number, expectTithi: number) {
  const sr = sunrise(y, m, d)
  const idx = tithiIndex(sr)
  const names = ['Shukla Pratipada','Dwitiya','Tritiya','Chaturthi','Panchami','Shashthi','Saptami','Ashtami','Navami','Dashami','Ekadashi','Dwadashi','Trayodashi','Chaturdashi','Purnima','Krishna Pratipada','K Dwitiya','K Tritiya','K Chaturthi','K Panchami','K Shashthi','K Saptami','K Ashtami','K Navami','K Dashami','K Ekadashi','K Dwadashi','K Trayodashi','K Chaturdashi','Amavasya']
  console.log(`${label}: ${y}-${m}-${d} sunrise ${sr.toISOString().slice(11,16)}Z -> tithi ${idx} (${names[idx]}) | expected ${expectTithi} (${names[expectTithi]}) | ${idx === expectTithi ? 'OK' : 'MISMATCH'}`)
}

// Anchor 1: Vijaya Dashami 2083 = Oct 21, 2026 -> Ashwin Shukla Dashami = tithi 9
check('Dashain Tika 2083', 2026, 10, 21, 9)
// Anchor 2: Janai Purnima 2026 = Aug 28, 2026 -> Purnima = tithi 14
check('Janai Purnima 2083', 2026, 8, 28, 14)
// Anchor 3: Buddha Jayanti 2026 = May 1, 2026 -> Purnima = tithi 14
check('Buddha Jayanti 2083', 2026, 5, 1, 14)
// Today check
const now = new Date()
const bs = new NepaliDate(now)
console.log('Today AD:', now.toISOString().slice(0, 10), '-> BS:', bs.getYear(), bs.getMonth() + 1, bs.getDate())
console.log('Today tithi idx (at sunrise):', tithiIndex(sunrise(2026, 8, 30)))

// Moon phase check
const mp = (tithiIndex(sunrise(2026, 8, 30)) - 14 + 30) % 30
console.log('Days since purnima:', mp)
