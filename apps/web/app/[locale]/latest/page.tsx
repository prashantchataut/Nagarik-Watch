import type { Metadata } from 'next'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { Pagination } from '@/components/Pagination'
import { AdSlot } from '@/components/AdSlot'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { HubRelatedNav } from '@/components/public/HubRelatedNav'
import { RankedStoryList } from '@/components/public/RankedStoryList'
import { canonicalAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Latest News' : 'ताजा समाचार',
    description:
      locale === 'en'
        ? 'The newest verified reporting, updates and analysis from Nagarik Watch.'
        : 'नागरिक वाचका नयाँ प्रमाणित समाचार, अद्यावधिक र विश्लेषण।',
    alternates: canonicalAlternates(locale, '/latest'),
  }
}

export const dynamic = 'force-dynamic'
export const revalidate = 60

const PER_PAGE = 24

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export default async function LatestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const locale = asLocale((await params).locale)
  const english = locale === 'en'
  const page = pageNumber((await searchParams).page)
  const result = await getStories({ locale, page, perPage: PER_PAGE })

  return (
    <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
      <AdSlot locale={locale} placementKey="latest-top" />
      <HubIndexHeader
        title={english ? 'Latest news' : 'ताजा समाचार'}
        lead={
          english
            ? 'Newest reporting and analysis, ordered by publication time.'
            : 'प्रकाशन समयअनुसार नयाँ समाचार र विश्लेषण।'
        }
        lang={english ? 'en' : 'ne'}
      />
      <HubRelatedNav locale={locale} active="latest" />

      {result.items.length > 0 ? (
        <>
          <RankedStoryList
            stories={result.items}
            locale={locale}
            mode="latest"
            startRank={(result.page - 1) * PER_PAGE + 1}
          />
          <AdSlot locale={locale} placementKey="latest-inline" variant="inline" className="mt-6" />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={localizeHref(locale, '/latest')}
            locale={locale}
            className="mt-8"
          />
        </>
      ) : (
        <p
          className="mt-6 border-y border-rule py-8 text-body text-ink-soft"
          lang={english ? 'en' : 'ne'}
        >
          {english
            ? 'No reviewed stories are published yet.'
            : 'सम्पादकीय समीक्षा पूरा भएको समाचार अझै प्रकाशित छैन।'}
        </p>
      )}
    </div>
  )
}
