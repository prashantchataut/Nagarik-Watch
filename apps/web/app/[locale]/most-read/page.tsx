import type { Metadata } from 'next'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getMostReadStats } from '@/lib/engagement/store'
import { AdSlot } from '@/components/AdSlot'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Most read' : 'धेरै पढिएका',
    description:
      locale === 'en'
        ? 'The most-read Nagarik Watch reporting from the last seven days.'
        : 'पछिल्लो सात दिनमा सबैभन्दा धेरै पढिएका नागरिक वाच समाचार।',
    alternates: canonicalAlternates(locale, '/most-read'),
  }
}

export default async function MostReadPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const [catalog, stats] = await Promise.all([
    getStories({ locale, perPage: 100 }),
    getMostReadStats(7, 100).catch(() => []),
  ])
  const bySlug = new Map(catalog.items.map((story) => [story.slug, story]))
  const eligible = stats.filter((stat) => stat.uniqueReaders >= 3 && bySlug.has(stat.articleSlug))
  const ranked = eligible.length
    ? eligible.map((stat) => bySlug.get(stat.articleSlug)!).slice(0, 18)
    : catalog.items.slice(0, 18)

  return (
    <main className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <header className="max-w-3xl border-b border-rule pb-7" lang={english ? 'en' : 'ne'}>
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">
          {english ? 'Seven-day reading' : 'सात दिनको पढाइ'}
        </p>
        <h1 className="mt-2 font-display text-display font-extrabold leading-tight text-ink">
          {english ? 'Most read' : 'धेरै पढिएका'}
        </h1>
        <p className="mt-3 max-w-body text-body-lg leading-relaxed text-ink-soft">
          {eligible.length
            ? english
              ? 'Ordered from privacy-preserving first-party reading activity. Stories need at least three distinct readers before they enter this list.'
              : 'पहिचान नखुल्ने आफ्नै पढाइ तथ्याङ्कका आधारमा क्रमबद्ध। कम्तीमा तीन फरक पाठक पुगेपछि मात्र समाचार यो सूचीमा आउँछ।'
            : english
              ? 'There is not enough verified reading activity yet, so the newest published stories are shown without popularity claims.'
              : 'विश्वसनीय पढाइ तथ्याङ्क अझै पर्याप्त छैन। त्यसैले लोकप्रियताको दाबी नगरी नयाँ प्रकाशित समाचार देखाइएको छ।'}
        </p>
      </header>

      {ranked.length ? (
        <ol className="mt-8 divide-y divide-rule border-y border-rule">
          {ranked.map((story, index) => (
            <li key={story.slug} className="grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <span className="font-mono text-h2 font-bold tabular-nums text-mute" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <StoryCard story={story} locale={locale} variant="horizontal" />
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft">
          {english ? 'No published stories are available.' : 'प्रकाशित सामग्री उपलब्ध छैन।'}
        </p>
      )}
      <AdSlot locale={locale} placementKey="hub-inline" variant="native" />
    </main>
  )
}
