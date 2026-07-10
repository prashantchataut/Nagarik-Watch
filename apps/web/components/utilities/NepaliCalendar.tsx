'use client'

import { useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  BS_MONTHS,
  BS_MONTHS_EN,
  adToBs,
  bsMonthLength,
  bsToAd,
  eventsForBsDay,
  toDevanagari,
} from '@nagarikwatch/db'

const WEEKDAY_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Hamro Patro / Onlinekhabar-style BS calendar. Renders one month at a time with
 * prev/next navigation, the current AD month highlighted, today marked, and dots on
 * dates that carry a festival or public holiday (hover/tap reveals the name).
 *
 * All date math is client-side from the shared db helpers — no fetch, works offline.
 * The supported BS year range (2080–2087) gates navigation at both ends.
 */
export function NepaliCalendar({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const todayBs = useMemo(() => adToBs(new Date()), [])

  const [year, setYear] = useState(todayBs.year)
  const [month, setMonth] = useState(todayBs.month)

  const length = bsMonthLength(year, month)
  const firstAd = bsToAd(year, month, 1)
  const startWeekday = firstAd ? firstAd.getUTCDay() : 0

  const cells = useMemo(() => {
    const out: Array<{ day: number; events: ReturnType<typeof eventsForBsDay> }> = []
    for (let d = 1; d <= length; d++) {
      out.push({ day: d, events: eventsForBsDay(month, d) })
    }
    return out
  }, [length, month])

  const monthName = en ? BS_MONTHS_EN[month - 1] : BS_MONTHS[month - 1]
  const holidaysThisMonth = useMemo(() => {
    const list: Array<{ day: number; nameNe: string; nameEn: string; holiday?: boolean }> = []
    for (const c of cells) {
      for (const e of c.events) list.push({ ...e, day: c.day })
    }
    return list
  }, [cells])

  const go = (delta: number) => {
    let m = month + delta
    let y = year
    if (m < 1) {
      m = 12
      y -= 1
    } else if (m > 12) {
      m = 1
      y += 1
    }
    if (y < 2080 || y > 2087) return
    setMonth(m)
    setYear(y)
  }

  return (
    <section
      className="mt-6 rounded-lg border border-rule bg-surface-raised p-5"
      lang={en ? 'en' : 'ne'}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-h2 text-ink">
            {monthName} {en ? year : toDevanagari(year)}
          </h2>
          <p className="mt-0.5 text-caption text-mute">
            {firstAd ? firstAd.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''}
          </p>
        </div>
        <div className="flex gap-1">
          <NavButton onClick={() => go(-1)} label={en ? 'Previous month' : 'अघिल्लो महिना'}>
            ‹
          </NavButton>
          <NavButton onClick={() => go(1)} label={en ? 'Next month' : 'अर्को महिना'}>
            ›
          </NavButton>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {(en ? WEEKDAY_EN : WEEKDAY_NE).map((w) => (
          <div key={w} className="py-1 text-meta font-semibold text-ink-soft">
            {w}
          </div>
        ))}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden="true" />
        ))}
        {cells.map((c) => {
          const isToday = c.day === todayBs.day && month === todayBs.month && year === todayBs.year
          const hasHoliday = c.events.some((e) => e.holiday)
          const hasEvent = c.events.length > 0
          const title = c.events.map((e) => (en ? e.nameEn : e.nameNe)).join(', ')
          return (
            <div
              key={c.day}
              title={title}
              className={[
                'relative flex aspect-square items-center justify-center rounded-md text-body',
                isToday
                  ? 'bg-brand font-bold text-surface'
                  : hasHoliday
                    ? 'bg-brand-tint font-semibold text-brand-strong'
                    : hasEvent
                      ? 'font-semibold text-ink'
                      : 'text-ink-soft',
              ].join(' ')}
            >
              {en ? c.day : toDevanagari(c.day)}
              {hasEvent && !isToday && (
                <span
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    hasHoliday ? 'bg-brand-strong' : 'bg-mute'
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>

      {holidaysThisMonth.length > 0 && (
        <div className="mt-5 border-t border-rule pt-4">
          <p className="text-meta font-semibold uppercase tracking-wide text-ink-soft">
            {en ? 'Events this month' : 'यो महिनाका पर्व'}
          </p>
          <ul className="mt-2 grid gap-1.5">
            {holidaysThisMonth.map((e, i) => (
              <li key={`${e.day}-${e.nameEn}-${i}`} className="flex items-baseline gap-2 text-body">
                <span className="w-8 shrink-0 font-semibold text-brand-strong">
                  {en ? e.day : toDevanagari(e.day)}
                </span>
                <span className="text-ink-soft">{en ? e.nameEn : e.nameNe}</span>
                {e.holiday && (
                  <span className="rounded-full bg-brand-tint px-2 py-0.5 text-caption font-semibold text-brand-strong">
                    {en ? 'Holiday' : 'बिदा'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-rule text-lg text-ink-soft transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
    >
      {children}
    </button>
  )
}
