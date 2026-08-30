'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react'
import {
  adToBs,
  BS_MONTHS,
  formatBsFull,
  toDevanagari,
  WEEKDAYS_NE,
  WEEKDAYS_FULL_NE,
  BS_MONTHS_EN,
} from '@/lib/news/patro'
import { href } from '@/lib/news/router'

const container = 'mx-auto w-full max-w-[1180px] px-4'

interface DayData {
  bsDay: number
  adISO: string
  weekday: number
  panchanga: { tithiIndex: number; tithiNe: string; pakshaNe: string; nakshatraNe: string; yogaNe: string; karanaNe: string }
  events: { nameNe: string; nameEn: string; holiday?: boolean }[]
  holiday: boolean
}

interface MonthData {
  bsYear: number
  bsMonth: number
  days: number
  firstWeekday: number
  daysData: DayData[]
}

function PageHead({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="pt-7 md:pt-9">
      <p className="kicker">{kicker}</p>
      <h1 className="mt-1.5 font-headline text-[clamp(30px,4.6vw,46px)] font-extrabold text-ink">{title}</h1>
      {sub && <p className="mt-2 max-w-[68ch] text-[15.5px] leading-relaxed text-ink-soft">{sub}</p>}
      <div className="mt-4 border-b-2 border-ink" />
    </div>
  )
}

const fmtAd = (iso: string) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const d = new Date(`${iso}T00:00:00Z`)
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`
}

export default function PatroView() {
  const todayBs = useMemo(() => adToBs(new Date()), [])
  const [year, setYear] = useState(todayBs.year)
  const [month, setMonth] = useState(todayBs.month)
  const [selectedDay, setSelectedDay] = useState(todayBs.day)
  const [loaded, setLoaded] = useState<{ key: string; month: MonthData } | null>(null)
  const [failed, setFailed] = useState<string | null>(null)
  const [refreshTick, setRefreshTick] = useState(0)

  const key = `${year}-${month}`
  const data = loaded?.key === key ? loaded.month : null
  const loading = data === null && failed === null

  useEffect(() => {
    let cancelled = false
    fetch(`/api/patro?year=${year}&month=${month}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('लोड असफल'))))
      .then((j: { month: MonthData }) => {
        if (cancelled) return
        setLoaded({ key, month: j.month })
        setFailed(null)
        setSelectedDay((d) => Math.min(d, j.month.days))
      })
      .catch(() => {
        if (!cancelled) setFailed('पात्रो लोड गर्न सकिएन — पुनः प्रयास गर्नुहोस्।')
      })
    return () => {
      cancelled = true
    }
  }, [key, year, month, refreshTick])

  const error = loading ? null : failed

  const shift = useCallback(
    (delta: number) => {
      let m = month + delta
      let y = year
      if (m > 12) {
        m = 1
        y += 1
      }
      if (m < 1) {
        m = 12
        y -= 1
      }
      if (y < 2000 || y > 2099) return
      setYear(y)
      setMonth(m)
      setSelectedDay(1)
    },
    [month, year],
  )

  const selected = data?.daysData.find((d) => d.bsDay === selectedDay) ?? null
  const monthEvents = useMemo(() => {
    if (!data) return []
    return data.daysData.flatMap((d) =>
      d.events.map((e) => ({ day: d.bsDay, adISO: d.adISO, nameNe: e.nameNe, holiday: e.holiday })),
    )
  }, [data])

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="पात्रो"
          title="नेपाली पात्रो"
          sub="खगोलशास्त्रीय गणनामा आधारित वास्तविक पञ्चाङ्ग — प्रत्येक दिनको तिथि, नक्षत्र, योग र चाडपर्व स्वचालित रूपमा निकालिन्छ। शनिबार र आइतबार दुवै साप्ताहिक सार्वजनिक बिदा।"
        />

        <div className="grid gap-x-8 gap-y-8 py-7 md:py-9 lg:grid-cols-[1.65fr_1fr]">
          {/* Month grid */}
          <section aria-label="महिना पात्रो">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => shift(-1)}
                className="grid size-11 place-items-center rounded-sm border border-rule text-ink transition-colors hover:border-crimson hover:text-crimson"
                aria-label="अघिल्लो महिना"
              >
                <ChevronLeft className="size-5" />
              </button>
              <div className="text-center">
                <h2 className="font-headline text-[24px] font-extrabold text-ink">
                  {BS_MONTHS[month - 1]} {toDevanagari(year)}
                </h2>
                <p className="text-[12.5px] text-ink-faint">
                  {data ? `${toDevanagari(data.days)} दिन · ${BS_MONTHS_EN[month - 1]}` : '…'} ·{' '}
                  <button
                    type="button"
                    className="font-semibold text-crimson underline-offset-2 hover:underline"
                    onClick={() => {
                      setYear(todayBs.year)
                      setMonth(todayBs.month)
                      setSelectedDay(todayBs.day)
                    }}
                  >
                    आजमा जानुहोस्
                  </button>
                </p>
              </div>
              <button
                type="button"
                onClick={() => shift(1)}
                className="grid size-11 place-items-center rounded-sm border border-rule text-ink transition-colors hover:border-crimson hover:text-crimson"
                aria-label="अर्को महिना"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>

            {/* weekday header — Sunday first (weekly holiday), Saturday last */}
            <div className="grid grid-cols-7 gap-1 border-b-2 border-ink pb-1.5 text-center">
              {WEEKDAYS_NE.map((d, i) => (
                <span
                  key={d}
                  className={`font-headline text-[12.5px] font-bold uppercase ${
                    i === 0 || i === 6 ? 'text-crimson' : 'text-ink-soft'
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {loading && !data ? (
              <div className="grid grid-cols-7 gap-1 pt-2" aria-hidden="true">
                {Array.from({ length: 35 }).map((_, i) => (
                  <div key={i} className="min-h-[52px] animate-pulse rounded-sm bg-surface-soft md:min-h-[68px]" />
                ))}
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-[14.5px] text-crimson">{error}</p>
                <button
                  type="button"
                  onClick={() => {
                    setFailed(null)
                    setLoaded(null)
                    setRefreshTick((t) => t + 1)
                  }}
                  className="mt-3 inline-flex items-center gap-2 rounded-sm border border-rule px-4 py-2 font-headline text-[14px] font-bold text-ink hover:border-crimson hover:text-crimson"
                >
                  <RefreshCw className="size-4" /> पुनः प्रयास
                </button>
              </div>
            ) : data ? (
              <div className="mt-1.5 grid grid-cols-7 gap-1">
                {Array.from({ length: data.firstWeekday }).map((_, i) => (
                  <span key={`e-${i}`} aria-hidden="true" />
                ))}
                {data.daysData.map((cell) => {
                  const isToday =
                    todayBs.year === year && todayBs.month === month && todayBs.day === cell.bsDay
                  const isSelected = selectedDay === cell.bsDay
                  const isWeekly = cell.weekday === 0 || cell.weekday === 6
                  const hasEvent = cell.events.length > 0
                  return (
                    <button
                      key={cell.bsDay}
                      type="button"
                      onClick={() => setSelectedDay(cell.bsDay)}
                      className={`relative flex min-h-[58px] flex-col items-center justify-start rounded-sm px-0.5 py-1.5 text-center transition-colors md:min-h-[68px] ${
                        isToday
                          ? 'bg-crimson text-white'
                          : isSelected
                            ? 'bg-crimson-wash text-crimson-deep'
                            : isWeekly
                              ? 'text-crimson/80 hover:bg-surface-soft'
                              : 'text-ink hover:bg-surface-soft'
                      }`}
                      aria-current={isToday ? 'date' : undefined}
                      aria-pressed={isSelected}
                    >
                      <span className="font-headline text-[13.5px] font-bold leading-tight tabular-nums md:text-[16px]">
                        {toDevanagari(cell.bsDay)}
                      </span>
                      <span
                        className={`font-headline text-[8.5px] font-semibold leading-none md:text-[10.5px] md:leading-tight ${
                          isToday ? 'text-white/85' : 'text-ink-faint'
                        }`}
                      >
                        {cell.panchanga.tithiNe}
                      </span>
                      {hasEvent && (
                        <span
                          className={`absolute bottom-1 size-1.5 rounded-full ${isToday ? 'bg-white' : 'bg-gold'}`}
                          aria-label="चाडपर्व छ"
                        />
                      )}
                    </button>
                  )
                })}
              </div>
            ) : null}

            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
              गोलो थोप्लो = चाडपर्व · तल्लो पङ्क्तिका रातो दिन = शनिबार र आइतबार (साप्ताहिक बिदा) ·
              आजको मिति क्रिमसन पृष्ठभूमिमा · प्रत्येक खानामुनि त्यस दिनको तिथि
            </p>
          </section>

          {/* Selected day + month events */}
          <aside className="space-y-6">
            <section className="paper-card rounded-sm p-5" aria-label="छानिएको दिन">
              <p className="text-[11px] font-semibold uppercase text-ink-faint">छानिएको दिन</p>
              <p className="mt-1 font-headline text-[26px] font-extrabold text-crimson">
                {formatBsFull({ year, month, day: selectedDay })}
              </p>
              {selected && (
                <p className="mt-0.5 text-[14px] text-ink-soft">
                  {WEEKDAYS_FULL_NE[selected.weekday]} · ई.सं. {fmtAd(selected.adISO)}
                </p>
              )}
              {selected && (
                <dl className="mt-3 space-y-1.5 border-t border-rule pt-3 text-[14px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">तिथि</dt>
                    <dd className="font-semibold text-ink">
                      {selected.panchanga.pakshaNe} {selected.panchanga.tithiNe}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">नक्षत्र</dt>
                    <dd className="font-semibold text-ink">{selected.panchanga.nakshatraNe}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">योग</dt>
                    <dd className="font-semibold text-ink">{selected.panchanga.yogaNe}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-soft">करण</dt>
                    <dd className="font-semibold text-ink">{selected.panchanga.karanaNe}</dd>
                  </div>
                </dl>
              )}
              <div className="mt-3 space-y-2 border-t border-rule pt-3">
                {selected?.events.map((e) => (
                  <p key={e.nameEn} className="text-[15px] font-semibold text-ink">
                    <span className="text-gold">◆</span> {e.nameNe}
                    {e.holiday && (
                      <span className="ml-1.5 rounded-sm bg-crimson-wash px-1.5 py-0.5 font-headline text-[11px] font-bold text-crimson">
                        सार्वजनिक बिदा
                      </span>
                    )}
                  </p>
                ))}
                {selected && selected.events.length === 0 && (
                  <p className="text-[13.5px] text-ink-faint">यस दिन दर्ता चाडपर्व छैन।</p>
                )}
                {selected?.holiday && (
                  <p className="text-[12.5px] font-semibold text-crimson">साप्ताहिक बिदा</p>
                )}
              </div>
            </section>

            <section className="paper-card rounded-sm p-5" aria-label="यस महिनाका चाडपर्व">
              <h3 className="font-headline text-[17px] font-extrabold text-ink">
                {BS_MONTHS[month - 1]}का चाडपर्व
              </h3>
              <ul className="mt-3 divide-y divide-rule">
                {monthEvents.map((e) => (
                  <li key={`${e.day}-${e.nameNe}`} className="flex items-baseline gap-3 py-2">
                    <span className="w-10 shrink-0 text-right font-headline text-[16px] font-extrabold tabular-nums text-crimson">
                      {toDevanagari(e.day)}
                    </span>
                    <span className="text-[14.5px] text-ink">
                      {e.nameNe}
                      {e.holiday && (
                        <span className="ml-1.5 align-middle rounded-sm bg-crimson-wash px-1.5 py-0.5 font-headline text-[10.5px] font-bold text-crimson">
                          बिदा
                        </span>
                      )}
                    </span>
                  </li>
                ))}
                {monthEvents.length === 0 && (
                  <li className="py-2 text-[13.5px] text-ink-faint">यस महिना दर्ता चाडपर्व छैनन्।</li>
                )}
              </ul>
            </section>

            <p className="flex items-start gap-2 text-[12px] leading-relaxed text-ink-faint">
              <CalendarDays className="mt-0.5 size-4 shrink-0" />
              तिथि–नक्षत्र खगोलीय गणनाबाट काठमाडौं सूर्योदयका आधारमा निकालिएको छ; चान्द्रमान
              चाडपर्व हरेक वर्ष स्वतः फरक पर्छन्। मिति रूपान्तरणका लागि{' '}
              <a href={href('/tools')} className="font-semibold text-crimson hover:underline">
                मिति उपकरण
              </a>{' '}
              हेर्नुहोस्।
            </p>
          </aside>
        </div>
      </div>
    </main>
  )
}

export { PageHead, container }
