import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { resolveMostReadStories } from '@/lib/content/most-read-stories'
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
  const { live } = await resolveMostReadStories({
    catalog: catalog.items,
    limit: 18,
    minLive: 3,
  })
  return {
    title:
      locale === 'en'
        ? live
          ? 'Most read'
          : 'Recent stories'
        : live
          ? 'धेरै पढिएका'
          : 'हालसालैका समाचार',
    description: live
      ? locale === 'en'
        ? 'The most-read Nagarik Watch reporting from the last seven days.'
        : 'पछिल्लो सात दिनमा सबैभन्दा धेरै पढिएका नागरिक वाच समाचार।'
      : locale === 'en'
        ? 'Newest Nagarik Watch reporting. Popularity ranking starts once enough verified readers accumulate.'
        : 'नयाँ प्रकाशित नागरिक वाच समाचार। पर्याप्त पाठक पुगेपछि मात्र लोकप्रियता क्रम लागू हुन्छ।',
    alternates: canonicalAlternates(locale, '/most-read'),
  }
}

export default async function MostReadPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const catalog = await getStories({ locale, perPage: 100 })
  const { stories: ranked, live } = await resolveMostReadStories({
    catalog: catalog.items,
    limit: 18,
    minLive: 3,
  })

  return (
    <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
      <HubIndexHeader
        title={
          english
            ? live
              ? 'Most read'
              : 'Recent stories'
            : live
              ? 'धेरै पढिएका'
              : 'हालसालैका समाचार'
        }
        lead={
          live
            ? english
              ? 'Most-read reporting from the past week, based on verified reader activity.'
              : 'पहिचान नखुल्ने आफ्नै पढाइ तथ्याङ्कका आधारमा क्रमबद्ध। कम्तीमा तीन फरक पाठक पुगेपछि मात्र समाचार यो सूचीमा आउँछ।'
            : english
              ? 'Verified reading activity is still limited, so the newest reporting is shown without popularity claims.'
              : 'विश्वसनीय पढाइ तथ्याङ्क अझै पर्याप्त छैन। त्यसैले लोकप्रियताको दाबी नगरी नयाँ प्रकाशित समाचार देखाइएको छ।'
        }
        lang={english ? 'en' : 'ne'}
      />
      <HubRelatedNav locale={locale} active="most-read" />

      {ranked.length ? (
        <RankedStoryList stories={ranked} locale={locale} mode="most-read" />
      ) : (
        <p className="mt-6 border-y border-rule py-8 text-body text-ink-soft">
          {english ? 'No published stories are available.' : 'प्रकाशित सामग्री उपलब्ध छैन।'}
        </p>
      )}
      <AdSlot locale={locale} placementKey="hub-inline" variant="native" className="mt-6" />
    </div>
  )
}
