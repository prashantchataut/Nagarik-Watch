import Link from 'next/link'
import { formatBsFull, todayBsInKathmandu, type Locale } from '@nagarikwatch/db'
import { getPublishedCalendarSchedule, upcomingFromSchedule } from '@/lib/calendar-schedule'
import { getRealForex, getRealNepse } from '@/lib/live/real'
import { localizeHref } from '@/lib/i18n/locales'

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function updatedTime(value: string, locale: Locale) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', {
    timeZone: 'Asia/Kathmandu',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

export async function HomeServiceDesk({ locale }: { locale: Locale }) {
  const ne = locale === 'ne'
  const today = todayBsInKathmandu()
  const [schedule, nepse, forex] = await Promise.all([
    getPublishedCalendarSchedule().catch(() => null),
    getRealNepse(locale).catch(() => null),
    getRealForex(locale).catch(() => null),
  ])
  const nextEvent = upcomingFromSchedule(schedule, today, 1)[0]
  const market = nepse?.status === 'ok' ? nepse.data : undefined
  const usd = forex?.status === 'ok' ? forex.data?.find((rate) => rate.iso3 === 'USD') : undefined

  return (
    <section className="mt-8 border-y border-rule sm:mt-10" aria-labelledby="home-service-desk-title">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule py-3">
        <div>
          <p className="text-caption font-extrabold text-brand-strong">{ne ? 'सार्वजनिक सेवा' : 'Public service'}</p>
          <h2 id="home-service-desk-title" className="mt-0.5 font-display text-h2 font-black leading-tight text-ink">
            {ne ? 'आजको सन्दर्भ' : "Today's reference"}
          </h2>
        </div>
        <nav className="flex gap-4 text-caption font-bold" aria-label={ne ? 'सेवा लिंक' : 'Service links'}>
          <Link href={localizeHref(locale, '/patro')} className="text-brand-strong hover:text-ink">
            {ne ? 'पात्रो →' : 'Patro →'}
          </Link>
          <Link href={localizeHref(locale, '/market')} className="text-brand-strong hover:text-ink">
            {ne ? 'बजार →' : 'Markets →'}
          </Link>
        </nav>
      </header>

      <div className="grid md:grid-cols-3">
        <section className="py-5 md:pr-6">
          <p className="text-caption font-bold text-mute">{ne ? 'आज · नेपाल समय' : 'Today · Nepal time'}</p>
          <p className="mt-1 font-display text-[clamp(1.65rem,3vw,2.45rem)] font-black leading-tight text-ink">
            {formatBsFull(today, locale)}
          </p>
          {nextEvent ? (
            <p className="mt-3 max-w-[34ch] text-meta leading-relaxed text-ink-soft">
              <strong className="text-ink">{ne ? nextEvent.nameNe : nextEvent.nameEn}</strong>
              {' · '}
              {nextEvent.daysUntil === 0
                ? ne
                  ? 'आज'
                  : 'today'
                : ne
                  ? `${formatNumber(nextEvent.daysUntil, locale, 0)} दिनपछि`
                  : `in ${formatNumber(nextEvent.daysUntil, locale, 0)} days`}
            </p>
          ) : (
            <p className="mt-3 text-meta text-mute">
              {ne ? 'प्रमाणित आगामी बिदा/पर्व फिड उपलब्ध छैन।' : 'No verified upcoming holiday/event feed.'}
            </p>
          )}
          {schedule ? <p className="mt-2 text-[0.7rem] text-mute">{schedule.source}</p> : null}
        </section>

        <section className="border-t border-rule py-5 md:border-l md:border-t-0 md:px-6">
          <p className="text-caption font-bold text-mute">NEPSE</p>
          {market ? (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <strong className="font-sans text-[clamp(1.7rem,3vw,2.5rem)] font-black tabular-nums text-ink">
                  {formatNumber(market.index, locale)}
                </strong>
                <span className={`text-meta font-extrabold tabular-nums ${market.change >= 0 ? 'text-up' : 'text-down'}`}>
                  {market.change >= 0 ? '+' : ''}{formatNumber(market.changePercent, locale)}%
                </span>
              </div>
              <p className="mt-2 text-[0.7rem] text-mute">
                {nepse?.source}{nepse?.updatedAt ? ` · ${updatedTime(nepse.updatedAt, locale)}` : ''}
              </p>
            </>
          ) : (
            <p className="mt-3 text-meta text-mute">
              {ne ? 'प्रमाणित बजार सूचक अहिले उपलब्ध छैन।' : 'Verified market index is currently unavailable.'}
            </p>
          )}
        </section>

        <section className="border-t border-rule py-5 md:border-l md:border-t-0 md:pl-6">
          <p className="text-caption font-bold text-mute">{ne ? 'USD / NPR · राष्ट्र बैंक' : 'USD / NPR · central bank'}</p>
          {usd ? (
            <>
              <div className="mt-2 grid grid-cols-2 gap-5">
                <div>
                  <span className="block text-[0.68rem] font-bold text-mute">{ne ? 'खरिद' : 'Buy'}</span>
                  <strong className="font-sans text-h3 font-black tabular-nums text-ink">{formatNumber(usd.buy, locale)}</strong>
                </div>
                <div>
                  <span className="block text-[0.68rem] font-bold text-mute">{ne ? 'बिक्री' : 'Sell'}</span>
                  <strong className="font-sans text-h3 font-black tabular-nums text-ink">{formatNumber(usd.sell, locale)}</strong>
                </div>
              </div>
              <p className="mt-2 text-[0.7rem] text-mute">{forex?.source}</p>
            </>
          ) : (
            <p className="mt-3 text-meta text-mute">
              {ne ? 'राष्ट्र बैंकको विनिमय फिड अहिले उपलब्ध छैन।' : 'The NRB exchange-rate feed is currently unavailable.'}
            </p>
          )}
        </section>
      </div>
    </section>
  )
}
