'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import type { PublishedCalendarEvent, PublishedCalendarSchedule } from '@/lib/calendar-view'
import {
  BS_MONTHS,
  BS_MONTHS_EN,
  BS_YEAR_MAX,
  BS_YEAR_MIN,
  adToBs,
  bsMonthLength,
  bsToAd,
  formatBsFull,
  toDevanagari,
} from '@nagarikwatch/db'

const WEEKDAY_NE = ['आइत', 'सोम', 'मंगल', 'बुध', 'बिहि', 'शुक्र', 'शनि']
const WEEKDAY_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type DayCell = {
  day: number
  weekday: number
  adDay: number
  adDate: Date | null
  events: PublishedCalendarEvent[]
}

type BsPoint = { year: number; month: number; day: number }

function readTodayBs(): BsPoint {
  return adToBs(new Date())
}

/**
 * Editorial Bikram Sambat month desk: navigate months/years, mark today,
 * select a day for festival detail, and list the month agenda. Offline date math.
 */
export function NepaliCalendar({
  locale,
  schedule,
}: {
  locale: Locale
  schedule: PublishedCalendarSchedule | null
}) {
  const en = locale === 'en'
  const seed = useMemo(() => readTodayBs(), [])
  const [todayBs, setTodayBs] = useState<BsPoint>(seed)
  const [mounted, setMounted] = useState(false)
  const [year, setYear] = useState(seed.year)
  const [month, setMonth] = useState(seed.month)
  const [selectedDay, setSelectedDay] = useState(seed.day)

  useEffect(() => {
    setTodayBs(readTodayBs())
    setMounted(true)
  }, [])

  const length = bsMonthLength(year, month)
  const safeSelectedDay = Math.min(selectedDay, length)
  const firstAd = bsToAd(year, month, 1)
  const lastAd = bsToAd(year, month, length)
  const startWeekday = firstAd ? firstAd.getUTCDay() : 0

  const cells = useMemo(() => {
    const out: DayCell[] = []
    for (let d = 1; d <= length; d++) {
      const ad = bsToAd(year, month, d)
      out.push({
        day: d,
        weekday: ad ? ad.getUTCDay() : (startWeekday + d - 1) % 7,
        adDay: ad ? ad.getUTCDate() : d,
        adDate: ad,
        events:
          schedule?.year === year
            ? schedule.events.filter((event) => event.month === month && event.day === d)
            : [],
      })
    }
    return out
  }, [length, month, schedule, year, startWeekday])

  const monthName = en ? BS_MONTHS_EN[month - 1] : BS_MONTHS[month - 1]
  const selected = cells.find((c) => c.day === safeSelectedDay) ?? cells[0]

  const holidaysThisMonth = useMemo(() => {
    const list: Array<{ day: number; nameNe: string; nameEn: string; holiday?: boolean }> = []
    for (const c of cells) {
      for (const e of c.events) list.push({ ...e, day: c.day })
    }
    return list.sort((a, b) => {
      if (Boolean(a.holiday) !== Boolean(b.holiday)) return a.holiday ? -1 : 1
      return a.day - b.day
    })
  }, [cells])

  const holidayCount = useMemo(
    () => holidaysThisMonth.filter((e) => e.holiday).length,
    [holidaysThisMonth],
  )
  const festivalCount = holidaysThisMonth.length
  const hasScheduleForYear = schedule?.year === year

  const goMonth = (delta: number) => {
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

  const goYear = (delta: number) => {
    const y = year + delta
    if (y < BS_YEAR_MIN || y > BS_YEAR_MAX) return
    setYear(y)
    setSelectedDay(1)
  }

  const jumpToday = () => {
    setYear(todayBs.year)
    setMonth(todayBs.month)
    setSelectedDay(todayBs.day)
  }

  const viewingTodayMonth = year === todayBs.year && month === todayBs.month
  const canPrevMonth = !(year === BS_YEAR_MIN && month === 1)
  const canNextMonth = !(year === BS_YEAR_MAX && month === 12)
  const canPrevYear = year > BS_YEAR_MIN
  const canNextYear = year < BS_YEAR_MAX

  const adRangeLabel = (() => {
    if (!firstAd || !lastAd) return ''
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
    const loc = en ? 'en-GB' : 'ne-NP'
    return `${firstAd.toLocaleDateString(loc, opts)} – ${lastAd.toLocaleDateString(loc, opts)}`
  })()

  const selectedAdLabel = selected?.adDate
    ? selected.adDate.toLocaleDateString(en ? 'en-GB' : 'ne-NP', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : ''

  const selectedBsLabel = selected ? formatBsFull({ year, month, day: selected.day }, locale) : ''

  return (
    <section className="calendar-workspace" lang={en ? 'en' : 'ne'}>
      <header className="calendar-header">
        <div className="calendar-header__lead">
          <p className="calendar-kicker">{en ? 'Bikram Sambat' : 'विक्रम संवत्'}</p>
          <h2 className="calendar-header__title">
            <span className="calendar-header__month">{monthName}</span>{' '}
            <span className="calendar-header__year">{en ? year : toDevanagari(year)}</span>
          </h2>
          <span className="calendar-header__rule" aria-hidden="true" />
          {adRangeLabel ? <p className="calendar-header__ad">{adRangeLabel}</p> : null}
          <p className="calendar-header__meta">
            {hasScheduleForYear
              ? en
                ? `${festivalCount} verified event${festivalCount === 1 ? '' : 's'} · ${holidayCount} public holiday${holidayCount === 1 ? '' : 's'} · ${schedule?.source}`
                : `${toDevanagari(festivalCount)} प्रमाणित कार्यक्रम · ${toDevanagari(holidayCount)} सार्वजनिक बिदा · ${schedule?.source}`
              : en
                ? 'Verified festival and public-holiday schedule not loaded for this B.S. year.'
                : 'यो बि.सं. वर्षका लागि प्रमाणित पर्व र सार्वजनिक बिदा तालिका लोड गरिएको छैन।'}
          </p>
        </div>

        <div className="calendar-nav">
          <div
            className="calendar-actions"
            role="group"
            aria-label={en ? 'Change year' : 'वर्ष परिवर्तन'}
          >
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => goYear(-1)}
              disabled={!canPrevYear}
              aria-label={en ? 'Previous year' : 'अघिल्लो वर्ष'}
            >
              «
            </button>
            <span className="calendar-nav-year" aria-hidden="true">
              {en ? year : toDevanagari(year)}
            </span>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => goYear(1)}
              disabled={!canNextYear}
              aria-label={en ? 'Next year' : 'अर्को वर्ष'}
            >
              »
            </button>
          </div>
          <div
            className="calendar-actions"
            role="group"
            aria-label={en ? 'Change month' : 'महिना परिवर्तन'}
          >
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => goMonth(-1)}
              disabled={!canPrevMonth}
              aria-label={en ? 'Previous month' : 'अघिल्लो महिना'}
            >
              ‹
            </button>
            <button
              type="button"
              className="calendar-nav-btn calendar-nav-btn--today"
              onClick={jumpToday}
              disabled={viewingTodayMonth && selectedDay === todayBs.day}
            >
              {en ? 'Today' : 'आज'}
            </button>
            <button
              type="button"
              className="calendar-nav-btn"
              onClick={() => goMonth(1)}
              disabled={!canNextMonth}
              aria-label={en ? 'Next month' : 'अर्को महिना'}
            >
              ›
            </button>
          </div>
        </div>
      </header>

      <div className="calendar-desk">
        <div
          className="calendar-grid"
          role="grid"
          aria-label={en ? `${monthName} ${year}` : `${monthName} ${toDevanagari(year)}`}
        >
          {(en ? WEEKDAY_EN : WEEKDAY_NE).map((w, i) => (
            <div
              key={w}
              className={`calendar-weekday${i === 6 ? ' is-saturday' : ''}`}
              role="columnheader"
            >
              {w}
            </div>
          ))}
          {Array.from({ length: startWeekday }).map((_, i) => (
            <div key={`pad-${i}`} className="calendar-blank" aria-hidden="true" />
          ))}
          {cells.map((c) => {
            const isToday = mounted && c.day === todayBs.day && viewingTodayMonth
            const isSelected = c.day === safeSelectedDay
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
                {hasHoliday ? <span className="calendar-day__corner" aria-hidden="true" /> : null}
                <span className="calendar-day__nums">
                  <strong>{en ? c.day : toDevanagari(c.day)}</strong>
                  <span className="calendar-day__ad" aria-hidden="true">
                    {c.adDay}
                  </span>
                </span>
                {c.events.length > 0 ? (
                  <span className="calendar-day__dots" aria-hidden="true">
                    {c.events.slice(0, 3).map((_, i) => (
                      <i key={i} className={c.events[i]?.holiday ? 'is-holiday' : undefined} />
                    ))}
                  </span>
                ) : null}
                {primaryEvent ? (
                  <small>{en ? primaryEvent.nameEn : primaryEvent.nameNe}</small>
                ) : null}
              </button>
            )
          })}
        </div>

        <aside className="calendar-rail">
          {selected ? (
            <div className="calendar-selection" aria-live="polite">
              <p className="calendar-selection__kicker">{en ? 'Selected day' : 'छानिएको दिन'}</p>
              <p className="calendar-selection__date">{selectedBsLabel}</p>
              {selectedAdLabel ? <p className="calendar-selection__ad">{selectedAdLabel}</p> : null}
              {selected.events.length > 0 ? (
                <ul>
                  {selected.events.map((e, i) => (
                    <li key={`${e.nameEn}-${i}`}>
                      <span>{en ? e.nameEn : e.nameNe}</span>
                      {e.holiday ? (
                        <em className="calendar-badge">
                          {en ? 'Public holiday' : 'सार्वजनिक बिदा'}
                        </em>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="calendar-selection__empty">
                  {hasScheduleForYear
                    ? en
                      ? 'No verified event is listed for this date.'
                      : 'यो मितिमा प्रमाणित कार्यक्रम सूचीबद्ध छैन।'
                    : en
                      ? 'Verified schedule not loaded for this B.S. year.'
                      : 'यो बि.सं. वर्षको प्रमाणित तालिका लोड गरिएको छैन।'}
                </p>
              )}
            </div>
          ) : null}

          {holidaysThisMonth.length > 0 ? (
            <div className="calendar-agenda">
              <h3>{en ? 'This month' : 'यो महिना'}</h3>
              <span className="calendar-agenda__rule" aria-hidden="true" />
              <ul>
                {holidaysThisMonth.map((e, i) => (
                  <li
                    key={`${e.day}-${e.nameEn}-${i}`}
                    className={e.holiday ? 'is-holiday' : undefined}
                  >
                    <button
                      type="button"
                      className="calendar-agenda__day"
                      onClick={() => setSelectedDay(e.day)}
                      aria-pressed={safeSelectedDay === e.day}
                    >
                      <time
                        dateTime={`${year}-${String(month).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`}
                      >
                        {en ? e.day : toDevanagari(e.day)}
                      </time>
                    </button>
                    <span>{en ? e.nameEn : e.nameNe}</span>
                    {e.holiday ? (
                      <em className="calendar-badge">{en ? 'Holiday' : 'बिदा'}</em>
                    ) : (
                      <span />
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="calendar-agenda">
              <h3>{en ? 'This month' : 'यो महिना'}</h3>
              <span className="calendar-agenda__rule" aria-hidden="true" />
              <p className="calendar-selection__empty">
                {hasScheduleForYear
                  ? en
                    ? 'No verified festival or public holiday is listed for this month.'
                    : 'यो महिनामा प्रमाणित पर्व वा सार्वजनिक बिदा सूचीबद्ध छैन।'
                  : en
                    ? 'Verified schedule not loaded for this B.S. year.'
                    : 'यो बि.सं. वर्षको प्रमाणित तालिका लोड गरिएको छैन।'}
              </p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
