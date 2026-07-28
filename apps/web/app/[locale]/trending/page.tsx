import type { Metadata } from 'next'
import { detectTrending } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getTrendingSamples } from '@/lib/engagement/store'
import { AdSlot } from '@/components/AdSlot'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { RankedStoryList } from '@/components/public/RankedStoryList'
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
              ? 'Recent reader attention, ordered with freshness in mind.'
              : 'हालैको पढाइ र छलफललाई ताजापनसहित क्रमबद्ध।'
            : english
              ? 'Recent activity is still thin, so the newest reporting is shown instead.'
              : 'ट्रेन्ड संकेत पर्याप्त छैन। नयाँ सामग्री देखाइएको छ।'
        }
        lang={english ? 'en' : 'ne'}
      />

      {ranked.length > 0 ? (
        <RankedStoryList stories={ranked} locale={locale} mode="trending" />
      ) : (
        <p className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft" lang={english ? 'en' : 'ne'}>
          {english ? 'No published stories are available.' : 'प्रकाशित सामग्री उपलब्ध छैन।'}
        </p>
      )}
      <AdSlot locale={locale} placementKey="trending-inline" variant="inline" />
    </div>
  )
}
