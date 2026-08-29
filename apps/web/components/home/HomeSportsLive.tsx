import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { getCricketScores, getFootballScores } from '@/lib/live/sports'
import type { CricketScore, FootballScore } from '@/lib/live/types'

function updatedLabel(value: string, locale: Locale): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale === 'ne' ? 'ne-NP' : 'en-GB', {
    timeZone: 'Asia/Kathmandu',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function footballRank(match: FootballScore): number {
  if (match.status === 'live') return 0
  if (match.status === 'fixture') return 1
  return 2
}

function cricketRank(match: CricketScore): number {
  const status = match.status.toLowerCase()
  if (/live|innings|day \d|session/.test(status)) return 0
  if (/won|draw|finished|complete|stumps/.test(status)) return 2
  return 1
}

export async function HomeSportsLive({ locale }: { locale: Locale }) {
  const [football, cricket] = await Promise.all([
    getFootballScores().catch(() => null),
    getCricketScores().catch(() => null),
  ])
  const footballMatches =
    football?.status === 'ok'
      ? [...football.data].sort((a, b) => footballRank(a) - footballRank(b)).slice(0, 4)
      : []
  const cricketMatches =
    cricket?.status === 'ok'
      ? [...cricket.data].sort((a, b) => cricketRank(a) - cricketRank(b)).slice(0, 4)
      : []
  if (footballMatches.length === 0 && cricketMatches.length === 0) return null

  const ne = locale === 'ne'
  return (
    <section className="mt-7 border-y border-rule py-5 sm:mt-9 sm:py-6" aria-labelledby="home-live-sports-title">
      <header className="flex items-end justify-between gap-4 border-b-2 border-ink pb-2.5">
        <div>
          <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-brand-strong">
            {ne ? 'प्रदायक फिड' : 'Provider feed'}
          </p>
          <h2 id="home-live-sports-title" className="mt-1 font-display text-h2 font-black leading-none text-ink">
            {ne ? 'लाइभ खेल' : 'Live sport'}
          </h2>
        </div>
        <Link
          href={localizeHref(locale, '/live-scores')}
          className="text-caption font-extrabold text-brand-strong underline decoration-rule underline-offset-4 hover:text-ink"
        >
          {ne ? 'सबै स्कोर →' : 'All scores →'}
        </Link>
      </header>

      <div className="grid gap-x-8 lg:grid-cols-2">
        {footballMatches.length > 0 && football ? (
          <HomeScoreFeed
            label={ne ? 'फुटबल' : 'Football'}
            source={football.source}
            updatedAt={football.updatedAt}
            locale={locale}
          >
            {footballMatches.map((match, index) => (
              <HomeScoreRow
                key={`${match.home}-${match.away}-${index}`}
                league={match.league}
                home={match.home}
                away={match.away}
                score={match.score}
                status={match.minute || match.status}
                live={match.status === 'live'}
              />
            ))}
          </HomeScoreFeed>
        ) : null}

        {cricketMatches.length > 0 && cricket ? (
          <HomeScoreFeed
            label={ne ? 'क्रिकेट' : 'Cricket'}
            source={cricket.source}
            updatedAt={cricket.updatedAt}
            locale={locale}
          >
            {cricketMatches.map((match, index) => (
              <HomeScoreRow
                key={`${match.home}-${match.away}-${index}`}
                league={match.league}
                home={match.home}
                away={match.away}
                score={match.score}
                status={match.status}
                live={cricketRank(match) === 0}
              />
            ))}
          </HomeScoreFeed>
        ) : null}
      </div>
    </section>
  )
}

function HomeScoreFeed({
  label,
  source,
  updatedAt,
  locale,
  children,
}: {
  label: string
  source: string
  updatedAt: string
  locale: Locale
  children: ReactNode
}) {
  const time = updatedLabel(updatedAt, locale)
  return (
    <section className="min-w-0 py-4 lg:py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-h3 font-black text-ink">{label}</h3>
        <p className="text-[0.7rem] font-semibold text-mute">
          {source}
          {time ? ` · ${time}` : ''}
        </p>
      </div>
      <ol className="mt-2 divide-y divide-rule border-y border-rule">{children}</ol>
    </section>
  )
}

function HomeScoreRow({
  league,
  home,
  away,
  score,
  status,
  live,
}: {
  league: string
  home: string
  away: string
  score: string
  status: string
  live: boolean
}) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1 py-3">
      <p className="truncate text-[0.68rem] font-bold uppercase tracking-[0.08em] text-mute">{league}</p>
      <span className={`text-[0.68rem] font-extrabold ${live ? 'text-breaking' : 'text-mute'}`}>
        {status}
      </span>
      <div className="min-w-0 text-meta font-extrabold leading-snug text-ink">
        <p className="truncate">{home}</p>
        <p className="truncate">{away}</p>
      </div>
      <strong className="self-center whitespace-nowrap font-sans text-body font-black tabular-nums text-brand-strong">
        {score}
      </strong>
    </li>
  )
}
