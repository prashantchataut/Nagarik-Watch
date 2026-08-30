import { NextResponse } from 'next/server'
import { monthInfo, dayInfo } from '@/lib/news/festivals'
import { adToBsDate } from '@/lib/news/panchanga'

export const dynamic = 'force-dynamic'

/**
 * GET /api/patro?year=2083&month=5
 * Returns the full BS month grid with per-day panchanga (tithi, nakshatra,
 * yoga, karana), astronomically derived festivals, and holiday flags
 * (Saturday + Sunday weekly holidays since 2082 Saun).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const todayBs = adToBsDate(new Date())
  const year = Number(searchParams.get('year')) || todayBs.year
  const month = Number(searchParams.get('month')) || todayBs.month

  if (year < 2000 || year > 2099 || month < 1 || month > 12) {
    return NextResponse.json({ error: 'मिति दायरा बाहिर (वि.सं. २०००–२०९९)।' }, { status: 400 })
  }

  const month_ = monthInfo(year, month)
  const today = dayInfo(todayBs.year, todayBs.month, todayBs.day)

  return NextResponse.json({
    today: today
      ? {
          bsYear: today.bsYear,
          bsMonth: today.bsMonth,
          bsDay: today.bsDay,
          adISO: today.adISO,
          weekday: today.weekday,
          tithi: `${today.panchanga.pakshaNe} ${today.panchanga.tithiNe}`,
          nakshatra: today.panchanga.nakshatraNe,
          yoga: today.panchanga.yogaNe,
          karana: today.panchanga.karanaNe,
          events: today.events,
          holiday: today.holiday,
        }
      : null,
    month: month_,
    source: 'astronomical panchanga (astronomy-engine) · तिथि काठमाडौं सूर्योदयमा गणना',
  })
}
