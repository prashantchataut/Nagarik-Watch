'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { BS_MONTHS, BS_MONTHS_EN, adToBs, formatBsFull, toDevanagari } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { localizeNumber, relativeTime } from '@/lib/live/format'
import { NepaliCalendar } from '@/components/utilities/NepaliCalendar'
import type { ForexRate, GoldSilverReading } from '@/lib/live/real'
import type { NepseReading } from '@/lib/live/types'
import { upcomingFromSchedule, type PublishedCalendarSchedule } from '@/lib/calendar-view'

type RateMeta = {
  source: string
  updatedAt: string
}

type PatroDeskProps = {
  locale: Locale
  forex: ForexRate[]
  gold: GoldSilverReading | null
  nepse: NepseReading | null
  forexMeta: RateMeta
  goldMeta: RateMeta
  nepseMeta: RateMeta
  /** Absolute or localized href for “all latest” (apex when on calendar host). */
  latestIndexHref: string
  latestStories: Array<{
    id: string
    href: string
    title: string
    thumb?: string | null
  }>
  calendarSchedule: PublishedCalendarSchedule | null
}

const TOOL_LINKS = [
  { path: '/utilities/date-converter', ne: 'मिति रूपान्तरण', en: 'Date converter', neMeta: 'वि.सं. ↔ ई.सं.', enMeta: 'B.S. ↔ A.D.' },
  { path: '/utilities/currency', ne: 'मुद्रा रूपान्तरण', en: 'Currency converter', neMeta: 'आधिकारिक दर', enMeta: 'Official rates' },
  { path: '/rashifal', ne: 'राशिफल', en: 'Horoscope', neMeta: 'आजको संस्करण', enMeta: "Today's edition" },
  { path: '/utilities/preeti-unicode', ne: 'प्रिती युनिकोड', en: 'Preeti Unicode', neMeta: 'नेपाली लेखन', enMeta: 'Nepali text tool' },
  { path: '/market', ne: 'बजार बोर्ड', en: 'Market board', neMeta: 'NEPSE · सुन · मुद्रा', enMeta: 'NEPSE · bullion · forex' },
  { path: '/utilities', ne: 'सबै उपकरण', en: 'All utilities', neMeta: 'नागरिक उपयोगी सेवा', enMeta: 'Reader utilities' },
] as const

export function PatroDesk({
  locale,
  forex,
  gold,
  nepse,
  forexMeta,
  goldMeta,
  nepseMeta,
  latestIndexHref,
  latestStories,
  calendarSchedule,
}: PatroDeskProps) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const today = useMemo(() => adToBs(new Date()), [])
  const upcoming = useMemo(
    () => upcomingFromSchedule(calendarSchedule, today, 7),
    [calendarSchedule, today],
  )
  const holidays = useMemo(
    () =>
      upcomingFromSchedule(calendarSchedule, today, 20)
        .filter((event) => event.holiday)
        .slice(0, 6),
    [calendarSchedule, today],
  )
  const hasCurrentSchedule = calendarSchedule?.year === today.year
  const monthName = en ? BS_MONTHS_EN[today.month - 1] : BS_MONTHS[today.month - 1]
  const todayLabel = formatBsFull(today, locale)
  const usd = forex.find((r) => r.iso3 === 'USD') ?? forex[0]
  const nepseUp = Boolean(nepse && nepse.change >= 0)
  const adDateLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
    [],
  )

  return (
    <div className="patro-desk" lang={lang}>
      <div className="patro-desk__today">
        <div className="patro-today-badge" aria-hidden="true">
          {en ? today.day : toDevanagari(today.day)}
        </div>
        <div className="patro-today-copy">
          <p className="patro-today-kicker">{en ? 'Today' : 'आज'}</p>
          <h1 className="patro-today-title">{todayLabel}</h1>
          <p className="patro-today-sub">
            {en
              ? `${monthName} ${today.year} B.S.`
              : `${monthName} ${toDevanagari(today.year)} बि.सं.`}
          </p>
          <p className="patro-today-ad" lang="en">
            {adDateLabel}
          </p>
        </div>
      </div>

      <div className="patro-desk__layout">
        <aside className="patro-sidebar">
          <section className="patro-widget">
            <h2>{en ? 'Upcoming' : 'आगामी पर्व'}</h2>
            {upcoming.length === 0 ? (
              <p className="patro-widget__empty">
                {hasCurrentSchedule
                  ? en
                    ? 'No verified event is listed in the current schedule.'
                    : 'हालको प्रमाणित तालिकामा आगामी पर्व सूचीबद्ध छैन।'
                  : en
                    ? 'A verified festival schedule has not been loaded for this B.S. year.'
                    : 'यो बि.सं. वर्षका लागि प्रमाणित पर्व तालिका लोड गरिएको छैन।'}
              </p>
            ) : (
              <ul>
                {upcoming.map((event) => (
                  <li key={`${event.year}-${event.month}-${event.day}-${event.nameEn}`}>
                    <span className="patro-widget__date">
                      {en ? event.day : toDevanagari(event.day)}{' '}
                      {en ? BS_MONTHS_EN[event.month - 1] : BS_MONTHS[event.month - 1]}
                    </span>
                    <span className="patro-widget__name">{en ? event.nameEn : event.nameNe}</span>
                    <span className={`patro-widget__eta${event.holiday ? ' is-holiday' : ''}`}>
                      {event.daysUntil === 0
                        ? en
                          ? 'Today'
                          : 'आज'
                        : en
                          ? `${event.daysUntil}d`
                          : `${toDevanagari(event.daysUntil)} दिन`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="patro-widget" id="holidays">
            <h2>{en ? 'Holidays ahead' : 'आगामी बिदा'}</h2>
            {holidays.length === 0 ? (
              <p className="patro-widget__empty">
                {hasCurrentSchedule
                  ? en
                    ? 'No verified public holiday is listed soon.'
                    : 'नजिक प्रमाणित सार्वजनिक बिदा सूचीबद्ध छैन।'
                  : en
                    ? 'A verified public-holiday schedule has not been loaded for this B.S. year.'
                    : 'यो बि.सं. वर्षका लागि प्रमाणित सार्वजनिक बिदा तालिका लोड गरिएको छैन।'}
              </p>
            ) : (
              <ul>
                {holidays.map((event) => (
                  <li key={`h-${event.year}-${event.month}-${event.day}-${event.nameEn}`}>
                    <span className="patro-widget__date">
                      {en ? event.day : toDevanagari(event.day)}{' '}
                      {en ? BS_MONTHS_EN[event.month - 1] : BS_MONTHS[event.month - 1]}
                    </span>
                    <span className="patro-widget__name">{en ? event.nameEn : event.nameNe}</span>
                    <span className="patro-widget__eta is-holiday">
                      {event.daysUntil === 0
                        ? en
                          ? 'Today'
                          : 'आज'
                        : en
                          ? `${event.daysUntil}d`
                          : `${toDevanagari(event.daysUntil)} दिन`}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="patro-widget">
            <h2>NEPSE</h2>
            {nepse ? (
              <dl className="patro-rates">
                <div>
                  <dt>{en ? 'Index' : 'सूचकाङ्क'}</dt>
                  <dd className="tabular-nums">{localizeNumber(nepse.index.toFixed(2), locale)}</dd>
                </div>
                <div>
                  <dt>{en ? 'Change' : 'परिवर्तन'}</dt>
                  <dd className={`tabular-nums${nepseUp ? ' is-up' : ' is-down'}`}>
                    <span aria-hidden="true">{nepseUp ? '▲' : '▼'}</span>{' '}
                    {localizeNumber(Math.abs(nepse.change).toFixed(2), locale)} (
                    {localizeNumber(Math.abs(nepse.changePercent).toFixed(2), locale)}%)
                  </dd>
                </div>
              </dl>
            ) : (
              <div className="patro-widget__empty-block">
                <p className="patro-widget__empty">
                  {en ? 'Index feed unavailable.' : 'सूचकाङ्क फिड उपलब्ध छैन।'}
                </p>
                <p className="patro-widget__more">
                  <Link href={localizeHref(locale, '/market')}>
                    {en ? 'Open market board' : 'बजार बोर्ड खोल्नुहोस्'}
                  </Link>
                </p>
              </div>
            )}
            <p className="patro-widget__stamp">
              {sourceFor(nepseMeta.source, locale)} · {relativeTime(nepseMeta.updatedAt, locale)}
            </p>
          </section>

          <section className="patro-widget">
            <h2>{en ? 'Gold & silver' : 'सुनचाँदी'}</h2>
            {gold ? (
              <dl className="patro-rates">
                <div>
                  <dt>{en ? 'Gold / tola' : 'सुन / तोला'}</dt>
                  <dd className="tabular-nums">{formatNpr(gold.goldTolaNpr, locale)}</dd>
                </div>
                <div>
                  <dt>{en ? 'Silver / tola' : 'चाँदी / तोला'}</dt>
                  <dd className="tabular-nums">{formatNpr(gold.silverTolaNpr, locale)}</dd>
                </div>
              </dl>
            ) : (
              <div className="patro-widget__empty-block">
                <p className="patro-widget__empty">
                  {en
                    ? 'No verified bullion rate published yet.'
                    : 'प्रमाणित सुनचाँदी दर अहिले उपलब्ध छैन।'}
                </p>
                <p className="patro-widget__more">
                  <Link href={localizeHref(locale, '/market')}>
                    {en ? 'Open market board' : 'बजार बोर्ड खोल्नुहोस्'}
                  </Link>
                </p>
              </div>
            )}
            <p className="patro-widget__stamp">
              {sourceFor(goldMeta.source, locale)} · {relativeTime(goldMeta.updatedAt, locale)}
            </p>
          </section>

          <section className="patro-widget">
            <h2>{en ? 'Forex' : 'विदेशी मुद्रा'}</h2>
            {usd ? (
              <dl className="patro-rates">
                <div>
                  <dt>
                    {usd.iso3} → NPR
                    {usd.unit && usd.unit !== '1' && usd.unit !== 'NPR' ? ` (${usd.unit})` : ''}
                  </dt>
                  <dd className="tabular-nums">{localizeNumber(usd.sell.toFixed(2), locale)}</dd>
                </div>
              </dl>
            ) : (
              <div className="patro-widget__empty-block">
                <p className="patro-widget__empty">
                  {en
                    ? 'Verified forex unavailable. Try the market board.'
                    : 'प्रमाणित मुद्रा दर उपलब्ध छैन। बजार बोर्ड हेर्नुहोस्।'}
                </p>
                <p className="patro-widget__more">
                  <Link href={localizeHref(locale, '/market')}>
                    {en ? 'Open market board' : 'बजार बोर्ड खोल्नुहोस्'}
                  </Link>
                </p>
              </div>
            )}
            <p className="patro-widget__stamp">
              {sourceFor(forexMeta.source, locale)} · {relativeTime(forexMeta.updatedAt, locale)}
            </p>
            <p className="patro-widget__more">
              <Link href={localizeHref(locale, '/utilities/currency')}>
                {en ? 'Open converter' : 'रूपान्तरण खोल्नुहोस्'}
              </Link>
            </p>
          </section>
        </aside>

        <div className="patro-desk__main">
          <NepaliCalendar locale={locale} schedule={calendarSchedule} />

          <nav aria-label={en ? 'Quick tools' : 'छिटो उपकरण'} className="patro-tools">
            {TOOL_LINKS.map((tool) => (
              <Link key={tool.path} href={localizeHref(locale, tool.path)} className="patro-tool-link">
                <span>
                  <strong>{en ? tool.en : tool.ne}</strong>
                  <small>{en ? tool.enMeta : tool.neMeta}</small>
                </span>
                <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {latestStories.length > 0 ? (
        <section className="patro-news" aria-labelledby="patro-news-title">
          <div className="patro-news__head">
            <h2 id="patro-news-title">{en ? 'Latest news' : 'ताजा समाचार'}</h2>
            <Link href={latestIndexHref}>{en ? 'All latest' : 'सबै ताजा'}</Link>
          </div>
          <ul className="patro-news__grid">
            {latestStories.map((story) => (
              <li key={story.id}>
                <Link href={story.href} className="patro-news__item">
                  {story.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element -- CMS thumbs vary by host
                    <img
                      src={story.thumb}
                      alt=""
                      className="patro-news__thumb"
                      width={72}
                      height={72}
                    />
                  ) : (
                    <span
                      className="patro-news__thumb patro-news__thumb--empty"
                      aria-hidden="true"
                    />
                  )}
                  <span className="patro-news__title">{story.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

function formatNpr(value: number, locale: Locale): string {
  const formatted = value.toLocaleString(locale === 'en' ? 'en-NP' : 'ne-NP')
  return locale === 'en' ? `NPR ${formatted}` : `रु. ${formatted}`
}

function sourceFor(source: string, locale: Locale): string {
  const cleaned = source.trim()
  if (cleaned) return cleaned
  return locale === 'en' ? 'Source unavailable' : 'स्रोत उपलब्ध छैन'
}
