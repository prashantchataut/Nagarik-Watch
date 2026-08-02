import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { resolveTrendingStories } from '@/lib/content/trending-stories'
import { AdSlot } from '@/components/AdSlot'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { HubRelatedNav } from '@/components/public/HubRelatedNav'
import { RankedStoryList } from '@/components/public/RankedStoryList'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const revalidate = 60

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const catalog = await getStories({ locale, perPage: 100 })
  const { live } = await resolveTrendingStories({
    catalog: catalog.items,
    limit: 18,
    minLive: 2,
  })
  return {
    title: locale === 'en' ? (live ? 'Trending' : 'Recent stories') : live ? 'अहिले चर्चामा' : 'हालसालैका समाचार',
    description: live
      ? locale === 'en'
        ? 'Stories receiving sustained reader attention on Nagarik Watch.'
        : 'नागरिक वाचमा पाठकको निरन्तर ध्यान पाइरहेका समाचार।'
      : locale === 'en'
        ? 'Newest Nagarik Watch reporting. Trend ranking starts once live attention accumulates.'
        : 'नयाँ प्रकाशित नागरिक वाच समाचार। लाइभ ध्यान पर्याप्त भएपछि मात्र चर्चा क्रम लागू हुन्छ।',
    alternates: canonicalAlternates(locale, '/trending'),
  }
}

export default async function TrendingPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const catalog = await getStories({ locale, perPage: 100 })
  const { stories: ranked, live: hasLiveSignal } = await resolveTrendingStories({
    catalog: catalog.items,
    limit: 18,
    minLive: 2,
  })

  return (
    <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
      <AdSlot locale={locale} placementKey="trending-top" />
      <HubIndexHeader
        title={
          english
            ? hasLiveSignal
              ? 'Trending now'
              : 'Recent stories'
            : hasLiveSignal
              ? 'अहिले चर्चामा'
              : 'हालसालैका समाचार'
        }
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
      <HubRelatedNav locale={locale} active="trending" />

      <div className="mt-1 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(14rem,0.32fr)] xl:items-start xl:gap-8">
        <div className="min-w-0">
          {ranked.length > 0 ? (
            <RankedStoryList stories={ranked} locale={locale} mode="trending" />
          ) : (
            <p
              className="mt-6 border-y border-rule py-8 text-body text-ink-soft"
              lang={english ? 'en' : 'ne'}
            >
              {english ? 'No published stories are available.' : 'प्रकाशित सामग्री उपलब्ध छैन।'}
            </p>
          )}
          <AdSlot locale={locale} placementKey="trending-inline" variant="inline" className="mt-6" />
        </div>

        <aside className="hidden border border-rule bg-surface-raised px-3.5 py-3.5 xl:block">
          <p className="font-display text-meta font-extrabold text-ink" lang={english ? 'en' : 'ne'}>
            {english ? 'How this list works' : 'यो सूची कसरी बन्छ'}
          </p>
          <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
          <p className="mt-2.5 text-caption leading-relaxed text-ink-soft" lang={english ? 'en' : 'ne'}>
            {hasLiveSignal
              ? english
                ? 'Ranks combine recent opens and sustained reading. Fresh stories can rise quickly; older spikes cool off.'
                : 'हालैका खोल्ने र निरन्तर पढाइ मिलाएर क्रमबद्ध। नयाँ समाचार छिटो माथि आउन सक्छन्; पुराना उछाल बिस्तारै तल झर्छन्।'
              : english
                ? 'When live attention is thin, we show newest published stories without claiming a trend.'
                : 'लाइभ संकेत पातलो हुँदा ट्रेन्ड दाबी नगरी नयाँ प्रकाशित समाचार देखाइन्छ।'}
          </p>
          <p
            className="mt-3 border-t border-rule pt-3 text-caption font-bold text-brand-strong"
            lang={english ? 'en' : 'ne'}
          >
            {hasLiveSignal
              ? english
                ? 'Live reader signal'
                : 'लाइभ पाठक संकेत'
              : english
                ? 'Fallback: newest first'
                : 'पुनः: नयाँ पहिले'}
          </p>
        </aside>
      </div>
    </div>
  )
}
