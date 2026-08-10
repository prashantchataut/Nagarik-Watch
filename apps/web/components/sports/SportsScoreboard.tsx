import type { ReactNode } from 'react'
import Link from 'next/link'
import type { Locale, StoryCardData } from '@nagarikwatch/db'
import { getFootballScores, getCricketScores } from '@/lib/live/sports'
import { getStories } from '@/lib/content'
import { localizeHref } from '@/lib/i18n/locales'
import { LiveDeskShell } from '@/components/public/LiveDeskShell'

export async function SportsScoreboard({
  locale,
  showStories = true,
}: {
  locale: Locale
  showStories?: boolean
}) {
  const ne = locale === 'ne'
  const [football, cricket, stories] = await Promise.all([
    getFootballScores(),
    getCricketScores(),
    showStories
      ? getStories({ locale, category: 'sports', perPage: 8 }).catch(() => ({
          items: [] as StoryCardData[],
        }))
      : Promise.resolve({ items: [] as StoryCardData[] }),
  ])
  const sportsStories = stories.items

  return (
    <LiveDeskShell
      locale={ne ? 'ne' : 'en'}
      title={ne ? 'खेलकुद' : 'Sports'}
      dek={
        ne
          ? 'प्रमाणित स्कोर उपलब्ध हुँदा मात्र देखाइन्छ। तलका कथा सम्पादकीय समीक्षाबाट आउँछन्।'
          : 'Scores appear only when a verified feed is available. Stories below are editorially reviewed.'
      }
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <ScoreSection
          title={ne ? 'फुटबल' : 'Football'}
          source={football.source}
          updatedAt={football.updatedAt}
          available={football.status === 'ok' && football.data.length > 0}
          locale={locale}
        >
          {football.data.map((match, index) => (
            <li key={`${match.home}-${match.away}-${index}`} className="border-t border-rule py-4">
              <p className="text-caption font-semibold text-mute">{match.league}</p>
              <div className="mt-2 flex items-center justify-between gap-4 font-display text-h3 text-ink">
                <span>{match.home}</span>
                <span className="tabular-nums font-extrabold">{match.score}</span>
                <span>{match.away}</span>
              </div>
              <p className="mt-2 text-caption text-ink-soft">{match.minute || match.status}</p>
            </li>
          ))}
        </ScoreSection>
        <ScoreSection
          title={ne ? 'क्रिकेट' : 'Cricket'}
          source={cricket.source}
          updatedAt={cricket.updatedAt}
          available={cricket.status === 'ok' && cricket.data.length > 0}
          locale={locale}
        >
          {cricket.data.map((match, index) => (
            <li key={`${match.home}-${match.away}-${index}`} className="border-t border-rule py-4">
              <p className="text-caption font-semibold text-mute">{match.league}</p>
              <div className="mt-2 flex items-center justify-between gap-4 font-display text-h3 text-ink">
                <span>{match.home}</span>
                <span className="tabular-nums font-extrabold">{match.score}</span>
                <span>{match.away}</span>
              </div>
              <p className="mt-2 text-caption text-ink-soft">{match.status}</p>
            </li>
          ))}
        </ScoreSection>
      </div>

      {showStories ? (
        <section className="mt-12 border-t border-ink pt-8">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-display text-h2 font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
              {ne ? 'नयाँ खेलकुद कथा' : 'Latest sports stories'}
            </h2>
            <Link
              href={localizeHref(locale, '/live-scores')}
              className="text-meta font-semibold text-brand-strong"
              lang={ne ? 'ne' : 'en'}
            >
              {ne ? 'प्रत्यक्ष स्कोर' : 'Live scores'}
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-rule border-y border-rule">
            {sportsStories.length ? (
              sportsStories.map((story) => (
                <li key={story.id} className="py-4">
                  <Link
                    href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}
                    className="block font-display text-h3 font-bold text-ink transition-colors hover:text-brand-strong"
                    lang={locale === 'en' && story.titleEn ? 'en' : 'ne'}
                  >
                    {locale === 'en' && story.titleEn ? story.titleEn : story.titleNe}
                  </Link>
                  {(locale === 'en' ? story.deckEn : story.deckNe) ? (
                    <p className="mt-1 line-clamp-2 text-meta text-ink-soft">
                      {locale === 'en' ? story.deckEn : story.deckNe}
                    </p>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="py-6 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
                {ne ? 'खेलकुद कथा उपलब्ध छैन।' : 'No sports stories available yet.'}
              </li>
            )}
          </ul>
        </section>
      ) : null}
    </LiveDeskShell>
  )
}

function ScoreSection({
  title,
  source,
  updatedAt,
  available,
  locale,
  children,
}: {
  title: string
  source: string
  updatedAt: string
  available: boolean
  locale: Locale
  children?: ReactNode
}) {
  const ne = locale === 'ne'
  return (
    <section className="border-t border-rule pt-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-h2 font-extrabold text-ink">{title}</h2>
        <span
          className={
            available
              ? 'text-caption font-semibold text-up'
              : 'text-caption font-semibold text-ink-soft'
          }
        >
          {available
            ? ne
              ? 'सत्यापित फिड'
              : 'Verified feed'
            : ne
              ? 'डाटा उपलब्ध छैन'
              : 'Data unavailable'}
        </span>
      </div>
      <p className="mt-1 text-caption text-mute">
        {source} ·{' '}
        {new Date(updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB', { timeZone: 'Asia/Kathmandu' })}
      </p>
      {available ? (
        <ul className="mt-2">{children}</ul>
      ) : (
        <p
          className="mt-4 border-y border-rule py-5 text-body text-ink-soft"
          lang={ne ? 'ne' : 'en'}
        >
          {ne
            ? 'प्रदायक फिड अहिले उपलब्ध छैन। स्कोर फर्किएपछि यहाँ देखिन्छ।'
            : 'No provider feed is available right now. Scores will appear here when verified.'}
        </p>
      )}
    </section>
  )
}
