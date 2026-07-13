import type { Metadata } from 'next'
import { StoryCard } from '@nagarikwatch/ui'
import { detectTrending } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getTrendingSamples } from '@/lib/engagement/store'
import { AdSlot } from '@/components/AdSlot'

export const metadata: Metadata = {
  title: 'Trending',
  description: 'Stories receiving sustained reader attention on Nagarik Watch.',
}

export const dynamic = 'force-dynamic'

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const [catalog, samples] = await Promise.all([
    getStories({ locale, perPage: 100 }),
    getTrendingSamples(120).catch(() => []),
  ])

  const ranked = detectTrending(
    catalog.items.map((story) => ({ ...story, id: story.slug })),
    samples,
  ).slice(0, 18)
  const hasLiveSignal = samples.length > 0 && ranked.some((story) => story.trendingScore > 0)

  return (
    <main className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <AdSlot locale={locale} placementKey="trending-top" />
      <header className="max-w-3xl border-b border-rule pb-7" lang={english ? 'en' : 'ne'}>
        <p className="text-caption font-bold uppercase tracking-[0.18em] text-brand-strong">
          {english ? 'Reader attention' : 'पाठकको ध्यान'}
        </p>
        <h1 className="mt-2 font-display text-display font-extrabold leading-tight text-ink">
          {english ? 'Trending now' : 'अहिले चर्चामा'}
        </h1>
        <p className="mt-3 max-w-body text-body-lg leading-relaxed text-ink-soft">
          {hasLiveSignal
            ? english
              ? 'Ranked from recent reading and approved discussion activity, with freshness and burst controls.'
              : 'हालैको पढाइ र स्वीकृत छलफल गतिविधिलाई ताजापन र अचानक बढेको रुचिसँग मिलाएर क्रमबद्ध गरिएको।'
            : english
              ? 'There is not enough recent activity for a reliable trend signal, so the newest published reporting is shown.'
              : 'विश्वसनीय ट्रेन्ड संकेतका लागि हालको गतिविधि पर्याप्त छैन, त्यसैले नयाँ प्रकाशित सामग्री देखाइएको छ।'}
        </p>
      </header>

      {ranked.length > 0 ? (
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
        <p className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft" lang={english ? 'en' : 'ne'}>
          {english ? 'No published stories are available.' : 'प्रकाशित सामग्री उपलब्ध छैन।'}
        </p>
      )}
      <AdSlot locale={locale} placementKey="trending-inline" variant="inline" />
    </main>
  )
}
