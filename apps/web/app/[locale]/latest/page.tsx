import type { Metadata } from 'next'
import { StoryCard } from '@nagarikwatch/ui'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { Pagination } from '@/components/Pagination'
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
    title: locale === 'en' ? 'Latest News' : 'ताजा समाचार',
    description:
      locale === 'en'
        ? 'The newest verified reporting, updates and analysis from Nagarik Watch.'
        : 'नागरिक वाचका नयाँ प्रमाणित समाचार, अद्यावधिक र विश्लेषण।',
    alternates: canonicalAlternates(locale, '/latest'),
  }
}

export const dynamic = 'force-dynamic'

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
    <main className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <AdSlot locale={locale} placementKey="latest-top" />
      <HubIndexHeader
        kicker={english ? 'News stream' : 'समाचार प्रवाह'}
        title={english ? 'Latest news' : 'ताजा समाचार'}
        lead={
          english
            ? 'The newest published reporting, updates and analysis, ordered by publication time.'
            : 'प्रकाशन समयका आधारमा क्रमबद्ध नयाँ समाचार, अद्यावधिक र विश्लेषण।'
        }
        lang={english ? 'en' : 'ne'}
      />

      {result.items.length > 0 ? (
        <>
          <ol className="mt-8 divide-y divide-rule border-y border-rule">
            {result.items.map((story, index) => (
              <li
                key={story.id}
                className="grid gap-4 py-6 sm:grid-cols-[3rem_minmax(0,1fr)]"
              >
                <span
                  className="font-mono text-h2 font-bold tabular-nums text-mute"
                  aria-hidden="true"
                >
                  {String((result.page - 1) * PER_PAGE + index + 1).padStart(2, '0')}
                </span>
                <StoryCard
                  story={story}
                  locale={locale}
                  variant="horizontal"
                  priority={result.page === 1 && index === 0}
                />
              </li>
            ))}
          </ol>
          <AdSlot locale={locale} placementKey="latest-inline" variant="inline" />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={localizeHref(locale, '/latest')}
            locale={locale}
            className="mt-10"
          />
        </>
      ) : (
        <p
          className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft"
          lang={english ? 'en' : 'ne'}
        >
          {english
            ? 'No reviewed stories are published yet.'
            : 'सम्पादकीय समीक्षा पूरा भएको समाचार अझै प्रकाशित छैन।'}
        </p>
      )}
    </main>
  )
}
