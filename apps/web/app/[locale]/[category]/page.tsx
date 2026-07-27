import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryGrid } from '@nagarikwatch/ui'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getCategory, getCategoryPage } from '@/lib/content'
import { Pagination } from '@/components/Pagination'
import { AdSlot } from '@/components/AdSlot'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { HubIndexHeader } from '@/components/HubIndexHeader'

import { isStaticPagesExport } from '@/lib/build-mode'
import { staticCategoryParams } from '@/lib/static-export-params'
export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticCategoryParams()
}

function pageNumber(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number.parseInt(raw || '1', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; category: string }>
}): Promise<Metadata> {
  const { locale: raw, category: slug } = await params
  const locale = asLocale(raw)
  const category = await getCategory(slug)
  if (!category) return {}
  const title = locale === 'en' ? category.nameEn : category.nameNe
  const description = locale === 'en' ? category.descriptionEn : category.descriptionNe
  return {
    title,
    description,
    alternates: canonicalAlternates(locale, `/${slug}`),
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; category: string }>
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const { locale: raw, category: slug } = await params
  const locale = asLocale(raw)
  const english = locale === 'en'
  const page = isStaticPagesExport
    ? 1
    : pageNumber((await (searchParams ?? Promise.resolve({}))).page)
  const [category, result] = await Promise.all([
    getCategory(slug),
    getCategoryPage(slug, page, locale),
  ])
  if (!category || !result || page > result.totalPages) notFound()
  const name = english ? category.nameEn : category.nameNe
  const description = english ? category.descriptionEn : category.descriptionNe

  return (
    <div className="mx-auto max-w-page px-4 py-5 sm:py-7">
      <HubIndexHeader
        title={name}
        lead={
          description ||
          (english
            ? 'Reviewed stories from this section.'
            : 'यस विभागका सम्पादकीय समीक्षा पूरा भएका समाचार।')
        }
        lang={english ? 'en' : 'ne'}
      />
      {result.items.length ? (
        <>
          <div className="mt-4 border-b border-rule pb-4">
            <AdSlot locale={locale} placementKey="category-top" />
          </div>
          <div className="mt-6">
            <StoryGrid stories={result.items} locale={locale} />
          </div>
          <AdSlot locale={locale} placementKey="category-inline" variant="inline" />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={localizeHref(locale, `/${slug}`)}
            locale={locale}
            className="mt-10"
          />
        </>
      ) : (
        <p
          className="mt-10 max-w-body border-t border-rule pt-6 text-body-lg text-ink-soft"
          lang={english ? 'en' : 'ne'}
        >
          {english
            ? 'No reviewed stories are published in this section yet.'
            : 'यस विभागमा सम्पादकीय समीक्षा पूरा भएको समाचार अझै प्रकाशित छैन।'}
        </p>
      )}
    </div>
  )
}
