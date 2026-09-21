'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { useHydrated } from '@/lib/browser/use-browser-store'
import { formatAdDate, formatAdDateRange } from '@/lib/format/ad-date'
import type { PublishedCalendarEvent, PublishedCalendarSchedule } from '@/lib/calendar-view'
import { relativeTime } from '@/lib/live/format'
import {
  BS_MONTHS,
  BS_MONTHS_EN,
  BS_YEAR_MAX,
  BS_YEAR_MIN,
  todayBsInKathmandu,
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

function kathmanduAdParts(date: Date): { day: number; weekday: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kathmandu',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)
  const weekday = new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
  return { day, weekday }
}

function readTodayBs(): BsPoint {
  return todayBsInKathmandu()
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
  // "Today" in BS depends on the reader's clock; it is derived after hydration
  // so the server and first client render agree without a corrective effect.
  const mounted = useHydrated()
  const todayBs = mounted ? readTodayBs() : seed
  const [year, setYear] = useState(seed.year)
  const [month, setMonth] = useState(seed.month)
  const [selectedDay, setSelectedDay] = useState(seed.day)

  const length = bsMonthLength(year, month)
  const safeSelectedDay = Math.min(selectedDay, length)
  const firstAd = bsToAd(year, month, 1)
  const lastAd = bsToAd(year, month, length)
  const startWeekday = firstAd ? kathmanduAdParts(firstAd).weekday : 0

  // No manual memoization: the React Compiler could not preserve it (and a
  // 32-cell loop is cheap), so the grid is built during render.
  const cells: DayCell[] = (() => {
    const out: DayCell[] = []
    // Derived inside the memo so every dependency is a plain, stable value
    // (the React Compiler cannot prove an outer derived value is stable).
    const firstAdOfMonth = bsToAd(year, month, 1)
    const startWeekday = firstAdOfMonth ? kathmanduAdParts(firstAdOfMonth).weekday : 0
    for (let d = 1; d <= length; d++) {
      const ad = bsToAd(year, month, d)
      out.push({
        day: d,
        weekday: ad ? kathmanduAdParts(ad).weekday : (startWeekday + d - 1) % 7,
        adDay: ad ? kathmanduAdParts(ad).day : d,
        adDate: ad,
        events:
          schedule?.year === year
            ? schedule.events.filter((event) => event.month === month && event.day === d)
            : [],
      })
    }
    return out
  })()

  // Rows for the ARIA grid: leading blanks plus the month's days, seven per row.
  const dayRows: Array<Array<DayCell | null>> = []
  {
    const flat: Array<DayCell | null> = [
      ...Array.from({ length: startWeekday }, () => null),
      ...cells,
    ]
    while (flat.length % 7 !== 0) flat.push(null)
    for (let i = 0; i < flat.length; i += 7) dayRows.push(flat.slice(i, i + 7))
  }

  const monthName = en ? BS_MONTHS_EN[month - 1] : BS_MONTHS[month - 1]
  const selected = cells.find((c) => c.day === safeSelectedDay) ?? cells[0]

  // Plain derivations: cheap (a handful of events per month) and free of the
  // manual memoization the React Compiler cannot preserve here.
  const holidaysThisMonth: Array<{
    day: number
    nameNe: string
    nameEn: string
    holiday?: boolean
  }> = []
  for (const c of cells) {
    for (const e of c.events) holidaysThisMonth.push({ ...e, day: c.day })
  }
  holidaysThisMonth.sort((a, b) => {
    if (Boolean(a.holiday) !== Boolean(b.holiday)) return a.holiday ? -1 : 1
    return a.day - b.day
  })

  const holidayCount = holidaysThisMonth.filter((e) => e.holiday).length
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

  const adRangeLabel = firstAd && lastAd ? formatAdDateRange(firstAd, lastAd, locale, 'short') : ''

  const selectedAdLabel = selected?.adDate
    ? formatAdDate(selected.adDate, locale, 'weekday-long')
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
                ? `${festivalCount} verified event${festivalCount === 1 ? '' : 's'} · ${holidayCount} public holiday${holidayCount === 1 ? '' : 's'} · ${schedule?.source} · ${relativeTime(schedule.updatedAt, locale)}`
                : `${toDevanagari(festivalCount)} प्रमाणित कार्यक्रम · ${toDevanagari(holidayCount)} सार्वजनिक बिदा · ${schedule?.source} · ${relativeTime(schedule.updatedAt, locale)}`
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
          {/* ARIA grid semantics require rows: columnheaders and gridcells are
              only valid inside role="row". Rows use `display: contents` so the
              seven-column CSS grid layout is unchanged. */}
          <div className="calendar-grid__row" role="row">
            {(en ? WEEKDAY_EN : WEEKDAY_NE).map((w, i) => (
              <div
                key={w}
                className={`calendar-weekday${i === 6 ? ' is-saturday' : ''}`}
                role="columnheader"
                aria-label={w}
              >
                {w}
              </div>
            ))}
          </div>
          {dayRows.map((row, rowIndex) => (
            <div className="calendar-grid__row" role="row" key={`row-${rowIndex}`}>
              {row.map((entry, entryIndex) =>
                entry === null ? (
                  <div
                    key={`pad-${rowIndex}-${entryIndex}`}
                    className="calendar-blank"
                    aria-hidden="true"
                  />
                ) : (
                  <DayCellButton
                    key={entry.day}
                    cell={entry}
                    en={en}
                    isToday={mounted && entry.day === todayBs.day && viewingTodayMonth}
                    isSelected={entry.day === safeSelectedDay}
                    onSelect={setSelectedDay}
                  />
                ),
              )}
            </div>
          ))}
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

function DayCellButton({
  cell: c,
  en,
  isToday,
  isSelected,
  onSelect,
}: {
  cell: DayCell
  en: boolean
  isToday: boolean
  isSelected: boolean
  onSelect: (day: number) => void
}) {
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
      type="button"
      role="gridcell"
      aria-selected={isSelected}
      aria-current={isToday ? 'date' : undefined}
      aria-label={label}
      onClick={() => onSelect(c.day)}
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
      {primaryEvent ? <small>{en ? primaryEvent.nameEn : primaryEvent.nameNe}</small> : null}
    </button>
  )
}
