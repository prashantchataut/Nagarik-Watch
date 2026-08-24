import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate, type Locale, type StoryCardData } from '@nagarikwatch/db'
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
  const [leadStory, ...moreStories] = sportsStories

  return (
    <LiveDeskShell
      locale={ne ? 'ne' : 'en'}
      title={ne ? 'खेलकुद' : 'Sports'}
      dek={
        ne
          ? 'लाइभ स्कोर प्रमाणित प्रदायकबाट मात्र। समाचार र विश्लेषण न्यूजरुमबाट।'
          : 'Live scores only from verified providers, with newsroom reporting and analysis below.'
      }
      kicker={ne ? 'स्कोर + रिपोर्टिङ' : 'Scores + reporting'}
    >
      <section className="sports-board" aria-label={ne ? 'खेल स्कोर बोर्ड' : 'Sports scoreboard'}>
        <ScoreSection
          title={ne ? 'फुटबल' : 'Football'}
          source={football.source}
          updatedAt={football.updatedAt}
          available={football.status === 'ok' && football.data.length > 0}
          locale={locale}
        >
          {football.data.map((match, index) => (
            <ScoreRow
              key={`${match.home}-${match.away}-${index}`}
              competition={match.league}
              home={match.home}
              away={match.away}
              score={match.score}
              status={match.minute || match.status}
            />
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
            <ScoreRow
              key={`${match.home}-${match.away}-${index}`}
              competition={match.league}
              home={match.home}
              away={match.away}
              score={match.score}
              status={match.status}
            />
          ))}
        </ScoreSection>
      </section>

      {showStories ? (
        <section className="sports-reporting" aria-labelledby="sports-reporting-title">
          <header>
            <div>
              <p>{ne ? 'न्यूजरुम' : 'Newsroom'}</p>
              <h2 id="sports-reporting-title">{ne ? 'खेलकुद रिपोर्टिङ' : 'Sports reporting'}</h2>
            </div>
            <Link href={localizeHref(locale, '/live-scores')}>
              {ne ? 'लाइभ स्कोर' : 'Live scores'}
            </Link>
          </header>

          {leadStory ? (
            <div className="sports-reporting__grid">
              <Link
                href={localizeHref(locale, `/${leadStory.category.slug}/${leadStory.slug}`)}
                className="sports-reporting__lead group"
              >
                <div className="sports-reporting__lead-media">
                  {leadStory.heroImage?.url && !leadStory.heroImage.url.startsWith('data:') ? (
                    <Image
                      src={leadStory.heroImage.url}
                      alt={leadStory.heroImage.alt || titleFor(leadStory, locale)}
                      fill
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="object-cover transition-transform duration-slow motion-safe:group-hover:scale-[1.015]"
                    />
                  ) : (
                    <span className="absolute inset-0 bg-brand-tint" aria-hidden="true" />
                  )}
                </div>
                <p>{leadStory.categoryLabel}</p>
                <h3>{titleFor(leadStory, locale)}</h3>
                {deckFor(leadStory, locale) ? <span>{deckFor(leadStory, locale)}</span> : null}
                <small>{formatDate(leadStory.publishedAt, locale)}</small>
              </Link>

              <ol className="sports-reporting__list">
                {moreStories.map((story, index) => (
                  <li key={story.id}>
                    <span aria-hidden="true">{String(index + 2).padStart(2, '0')}</span>
                    <div>
                      <Link href={localizeHref(locale, `/${story.category.slug}/${story.slug}`)}>
                        {titleFor(story, locale)}
                      </Link>
                      <p>
                        {story.categoryLabel} · {formatDate(story.publishedAt, locale)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p className="sports-reporting__empty">
              {ne ? 'खेलकुद कथा उपलब्ध छैन।' : 'No sports stories available yet.'}
            </p>
          )}
        </section>
      ) : null}
    </LiveDeskShell>
  )
}

function ScoreRow({
  competition,
  home,
  away,
  score,
  status,
}: {
  competition: string
  home: string
  away: string
  score: string
  status: string
}) {
  return (
    <li className="sports-score-row">
      <p>{competition}</p>
      <div>
        <span>{home}</span>
        <strong className="tabular-nums">{score}</strong>
        <span>{away}</span>
      </div>
      <small>{status}</small>
    </li>
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
    <section className="sports-score-section">
      <header>
        <div>
          <h2>{title}</h2>
          <p>
            {available ? (
              <>
                {source} ·{' '}
                {new Date(updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB', {
                  timeZone: 'Asia/Kathmandu',
                })}
              </>
            ) : (
              (ne ? 'प्रमाणित प्रदायक' : 'Verified provider')
            )}
          </p>
        </div>
        <span data-live={available ? 'true' : 'false'}>
          {available
            ? ne
              ? 'सत्यापित'
              : 'Verified'
            : ne
              ? 'उपलब्ध छैन'
              : 'No feed'}
        </span>
      </header>
      {available ? (
        <ul>{children}</ul>
      ) : (
        <p className="sports-score-section__empty">
          {ne
            ? 'प्रदायक फिड अहिले उपलब्ध छैन। प्रमाणित स्कोर फर्किएपछि यहाँ देखिन्छ।'
            : 'The provider feed is unavailable. Verified scores will appear here when it returns.'}
        </p>
      )}
    </section>
  )
}

function titleFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
}

function deckFor(story: StoryCardData, locale: Locale) {
  return locale === 'en' ? story.deckEn : story.deckNe
}
