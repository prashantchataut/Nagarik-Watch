import type { Metadata } from 'next'
import { asLocale } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getMostReadStats } from '@/lib/engagement/store'
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
    <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
      <HubIndexHeader
        title={english ? 'Most read' : 'धेरै पढिएका'}
        lead={
          eligible.length
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
