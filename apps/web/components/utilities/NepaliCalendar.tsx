'use client'

import { useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import {
  BS_MONTHS,
  BS_MONTHS_EN,
  BS_YEAR_MAX,
  BS_YEAR_MIN,
  adToBs,
  bsMonthLength,
  bsToAd,
  eventsForBsDay,
  toDevanagari,
} from '@nagarikwatch/db'

const WEEKDAY_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type DayCell = {
  day: number
  weekday: number
  adDay: number
  events: ReturnType<typeof eventsForBsDay>
}

/**
 * Editorial Bikram Sambat month desk: navigate months, mark today, select a day
 * for festival detail, and list the month agenda. Date math is local (offline).
 */
export function NepaliCalendar({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  const todayBs = useMemo(() => adToBs(new Date()), [])

  const [year, setYear] = useState(todayBs.year)
  const [month, setMonth] = useState(todayBs.month)
  const [selectedDay, setSelectedDay] = useState(todayBs.day)

  const length = bsMonthLength(year, month)
  const firstAd = bsToAd(year, month, 1)
  const startWeekday = firstAd ? firstAd.getUTCDay() : 0

  const cells = useMemo(() => {
    const out: DayCell[] = []
    for (let d = 1; d <= length; d++) {
      const ad = bsToAd(year, month, d)
      out.push({
        day: d,
        weekday: ad ? ad.getUTCDay() : (startWeekday + d - 1) % 7,
        adDay: ad ? ad.getUTCDate() : d,
        events: eventsForBsDay(month, d),
      })
    }
    return out
  }, [length, month, year, startWeekday])

  const monthName = en ? BS_MONTHS_EN[month - 1] : BS_MONTHS[month - 1]
  const selected = cells.find((c) => c.day === selectedDay) ?? cells[0]
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
    if (y < BS_YEAR_MIN || y > BS_YEAR_MAX) return
    setMonth(m)
    setYear(y)
    setSelectedDay(1)
  }

  const jumpToday = () => {
    setYear(todayBs.year)
    setMonth(todayBs.month)
    setSelectedDay(todayBs.day)
  }

  const viewingTodayMonth = year === todayBs.year && month === todayBs.month
  const adRangeLabel = firstAd
    ? firstAd.toLocaleDateString(en ? 'en-GB' : 'ne-NP', { month: 'long', year: 'numeric' })
    : ''

  return (
    <section className="calendar-workspace" lang={en ? 'en' : 'ne'}>
      <header className="calendar-header">
        <div>
          <p className="calendar-kicker">{en ? 'Bikram Sambat' : 'विक्रम संवत्'}</p>
          <h2>
            {monthName} {en ? year : toDevanagari(year)}
          </h2>
          <p>{adRangeLabel}</p>
        </div>
        <div className="calendar-actions">
          <button type="button" onClick={() => go(-1)} aria-label={en ? 'Previous month' : 'अघिल्लो महिना'}>
            ‹
          </button>
          <button type="button" onClick={jumpToday} disabled={viewingTodayMonth && selectedDay === todayBs.day}>
            {en ? 'Today' : 'आज'}
          </button>
          <button type="button" onClick={() => go(1)} aria-label={en ? 'Next month' : 'अर्को महिना'}>
            ›
          </button>
        </div>
      </header>

      <div className="calendar-grid" role="grid" aria-label={en ? `${monthName} ${year}` : `${monthName} ${toDevanagari(year)}`}>
        {(en ? WEEKDAY_EN : WEEKDAY_NE).map((w, i) => (
          <div key={w} className={`calendar-weekday${i === 6 ? ' is-saturday' : ''}`} role="columnheader">
            {w}
          </div>
        ))}
        {Array.from({ length: startWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="calendar-blank" aria-hidden="true" />
        ))}
        {cells.map((c) => {
          const isToday = c.day === todayBs.day && viewingTodayMonth
          const isSelected = c.day === selectedDay
          const hasHoliday = c.events.some((e) => e.holiday)
          const primaryEvent = c.events[0]
          const label = [
            en ? String(c.day) : toDevanagari(c.day),
            primaryEvent ? (en ? primaryEvent.nameEn : primaryEvent.nameNe) : null,
            isToday ? (en ? 'today' : 'आज') : null,
          ]
            .filter(Boolean)
            .join(', ')

          return (
            <button
              key={c.day}
              type="button"
              role="gridcell"
              aria-selected={isSelected}
              aria-current={isToday ? 'date' : undefined}
              aria-label={label}
              onClick={() => setSelectedDay(c.day)}
              className={[
                'calendar-day',
                isToday ? 'is-today' : '',
                isSelected ? 'is-selected' : '',
                hasHoliday ? 'is-holiday' : c.events.length ? 'has-event' : '',
                c.weekday === 6 ? 'is-saturday' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <span className="calendar-day__nums">
                <strong>{en ? c.day : toDevanagari(c.day)}</strong>
                <span className="calendar-day__ad" aria-hidden="true">
                  {c.adDay}
                </span>
              </span>
              {primaryEvent ? (
                <small>{en ? primaryEvent.nameEn : primaryEvent.nameNe}</small>
              ) : null}
            </button>
          )
        })}
      </div>

      {selected ? (
        <div className="calendar-selection" aria-live="polite">
          <p className="calendar-selection__date">
            {en ? selected.day : toDevanagari(selected.day)} {monthName}
            <span>
              · {en ? 'AD' : 'इस्वी'} {selected.adDay}
            </span>
          </p>
          {selected.events.length > 0 ? (
            <ul>
              {selected.events.map((e, i) => (
                <li key={`${e.nameEn}-${i}`}>
                  <span>{en ? e.nameEn : e.nameNe}</span>
                  {e.holiday ? <em>{en ? 'Public holiday' : 'सार्वजनिक बिदा'}</em> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="calendar-selection__empty">
              {en ? 'No festival listed for this date.' : 'यो मितिमा सूचीबद्ध पर्व छैन।'}
            </p>
          )}
        </div>
      ) : null}

      {holidaysThisMonth.length > 0 ? (
        <div className="calendar-agenda">
          <h3>{en ? 'This month' : 'यो महिना'}</h3>
          <ul>
            {holidaysThisMonth.map((e, i) => (
              <li key={`${e.day}-${e.nameEn}-${i}`}>
                <button type="button" className="calendar-agenda__day" onClick={() => setSelectedDay(e.day)}>
                  <time dateTime={`${year}-${String(month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`}>
                    {en ? e.day : toDevanagari(e.day)}
                  </time>
                </button>
                <span>{en ? e.nameEn : e.nameNe}</span>
                {e.holiday ? <em>{en ? 'Holiday' : 'बिदा'}</em> : <span />}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
