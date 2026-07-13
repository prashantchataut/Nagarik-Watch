import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getFootballScores, getCricketScores } from '@/lib/live/sports'
import { getStories } from '@/lib/content'
import { asLocale, localePrefix } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Sports hub',
  description: 'Live football and cricket scores with the latest sports stories.',
}

export const dynamic = 'force-dynamic'

export default async function SportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'
  const [football, cricket, stories] = await Promise.all([
    getFootballScores(),
    getCricketScores(),
    getStories({ locale, perPage: 24 }).catch(() => ({ items: [] })),
  ])
  const prefix = localePrefix(locale)
  const sportsStories = stories.items.filter(isSportsStory).slice(0, 8)

  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <section className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong" lang="en">Sports desk</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,7vw,3.2rem)] font-extrabold text-ink" lang={ne ? 'ne' : 'en'}>
          {ne ? 'खेलकुद: स्कोर, खेलतालिका र कथा' : 'Sports: scores, fixtures and stories'}
        </h1>
        <p className="mt-3 max-w-body text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne ? 'API key नभए admin live-widget बाट manual scoreboard चल्छ, त्यसैले fake-looking score नदेखाइन्छ।' : 'When provider keys are missing, editors can run a manual scoreboard from the live-widget admin.'}
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ScoreCard title="Football / FIFA" source={football.source} updatedAt={football.updatedAt} available={football.status === 'ok' && football.data.length > 0} locale={locale}>
          {football.data.map((match, index) => (
            <li key={`${match.home}-${match.away}-${index}`} className="rounded-lg border border-rule bg-surface p-4">
              <p className="text-caption font-semibold uppercase tracking-wide text-mute">{match.league}</p>
              <div className="mt-2 flex items-center justify-between gap-4 font-display text-h2 text-ink">
                <span>{match.home}</span><span>{match.score}</span><span>{match.away}</span>
              </div>
              <p className="mt-2 text-caption text-ink-soft">{match.minute || match.status}</p>
            </li>
          ))}
        </ScoreCard>
        <ScoreCard title="Cricket" source={cricket.source} updatedAt={cricket.updatedAt} available={cricket.status === 'ok' && cricket.data.length > 0} locale={locale}>
          {cricket.data.map((match, index) => (
            <li key={`${match.home}-${match.away}-${index}`} className="rounded-lg border border-rule bg-surface p-4">
              <p className="text-caption font-semibold uppercase tracking-wide text-mute">{match.league}</p>
              <div className="mt-2 flex items-center justify-between gap-4 font-display text-h2 text-ink">
                <span>{match.home}</span><span>{match.score}</span><span>{match.away}</span>
              </div>
              <p className="mt-2 text-caption text-ink-soft">{match.status}</p>
            </li>
          ))}
        </ScoreCard>
      </div>

      <section className="mt-8 rounded-2xl border border-rule bg-surface-raised p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>{ne ? 'नयाँ खेलकुद कथा' : 'Latest sports stories'}</h2>
          <Link href={`${prefix}/sports`} className="text-meta font-semibold text-brand-strong">{ne ? 'सबै' : 'All'}</Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {sportsStories.length ? sportsStories.map((story) => (
            <Link key={story.slug} href={`${prefix}/sports/${story.slug}`} className="rounded-xl border border-rule bg-surface p-4 transition hover:border-brand/40">
              <p className="font-display text-h2 font-bold text-ink">{locale === 'en' && story.titleEn ? story.titleEn : story.titleNe}</p>
              <p className="mt-2 line-clamp-2 text-meta text-ink-soft">{locale === 'en' && story.deckEn ? story.deckEn : story.deckNe}</p>
            </Link>
          )) : <p className="text-body text-mute">{ne ? 'खेलकुद कथा उपलब्ध छैन।' : 'No sports stories available yet.'}</p>}
        </div>
      </section>
    </main>
  )
}

type SportsStory = { slug: string; category?: { slug?: string }; categorySlug?: string; titleNe: string; titleEn?: string; deckNe?: string; deckEn?: string }

function isSportsStory(story: unknown): story is SportsStory {
  if (!story || typeof story !== 'object') return false
  const candidate = story as Partial<SportsStory>
  return Boolean(candidate.slug && (candidate.category?.slug === 'sports' || candidate.categorySlug === 'sports'))
}

function ScoreCard({
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
    <section className="rounded-2xl border border-rule bg-surface-raised p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-h1 text-ink" lang="en">{title}</h2>
        <span className={`rounded-full border px-2.5 py-1 text-caption font-semibold ${available ? 'border-rule text-ink-soft' : 'border-warning/40 text-warning'}`}>
          {available ? (ne ? 'सत्यापित फिड' : 'Verified feed') : (ne ? 'डाटा उपलब्ध छैन' : 'Data unavailable')}
        </span>
      </div>
      <p className="mt-1 text-caption text-mute" lang="en">{source} · {new Date(updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB', { timeZone: 'Asia/Kathmandu' })}</p>
      {available ? (
        <ul className="mt-4 grid gap-3">{children}</ul>
      ) : (
        <p className="mt-4 border-y border-rule py-5 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'प्रदायक फिड वा सम्पादकीय म्यानुअल स्कोरबोर्ड अहिले उपलब्ध छैन।'
            : 'Neither a provider feed nor an editorial manual scoreboard is available right now.'}
        </p>
      )}
    </section>
  )
}
