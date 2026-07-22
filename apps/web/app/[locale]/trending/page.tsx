import type { Metadata } from 'next'
import { StoryCard } from '@nagarikwatch/ui'
import { detectTrending } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getTrendingSamples } from '@/lib/engagement/store'
import { AdSlot } from '@/components/AdSlot'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { canonicalAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Trending' : 'अहिले चर्चामा',
    description:
      locale === 'en'
        ? 'Stories receiving sustained reader attention on Nagarik Watch.'
        : 'नागरिक वाचमा पाठकको निरन्तर ध्यान पाइरहेका समाचार।',
    alternates: canonicalAlternates(locale, '/trending'),
  }
}

export const dynamic = 'force-static'

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
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <AdSlot locale={locale} placementKey="trending-top" />
      <HubIndexHeader
        title={english ? 'Trending now' : 'अहिले चर्चामा'}
        lead={
          hasLiveSignal
            ? english
              ? 'Ranked from recent reading and discussion, with freshness controls.'
              : 'हालैको पढाइ र छलफललाई ताजापनसहित क्रमबद्ध।'
            : english
              ? 'Not enough recent activity for a trend signal. Showing newest reporting.'
              : 'ट्रेन्ड संकेत पर्याप्त छैन। नयाँ सामग्री देखाइएको छ।'
        }
        lang={english ? 'en' : 'ne'}
      />

      {ranked.length > 0 ? (
        <ol className="mt-8 divide-y divide-rule border-y border-rule">
          {ranked.map((story, index) => (
            <li key={story.slug} className="grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)]">
              <span className="font-display text-h2 font-extrabold tabular-nums text-brand-strong" aria-hidden="true">
                {english
                  ? String(index + 1)
                  : String(index + 1)
                      .split('')
                      .map((d) => '०१२३४५६७८९'[Number(d)] ?? d)
                      .join('')}
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
    </div>
  )
}
