import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getCategory, getCategoryPage } from '@/lib/content'
import { Pagination } from '@/components/Pagination'
import { AdSlot } from '@/components/AdSlot'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { CategoryDesk } from '@/components/category/CategoryDesk'
import { isStaticPagesExport } from '@/lib/build-mode'
import { staticCategoryParams } from '@/lib/static-export-params'

// Must be a string literal for Next segment config.
export const revalidate = 60

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
  // Short desk lead only when CMS has real copy; never invent marketing blurb.
  const lead = description?.trim() || undefined

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader title={name} lead={lead} lang={english ? 'en' : 'ne'} />
      {result.items.length ? (
        <>
          <div className="mt-3 border-b border-rule pb-3">
            <AdSlot locale={locale} placementKey="category-top" />
          </div>
          <div className="mt-4">
            <CategoryDesk stories={result.items} locale={locale} />
          </div>
          <AdSlot locale={locale} placementKey="category-inline" variant="inline" className="mt-4" />
          <Pagination
            page={result.page}
            totalPages={result.totalPages}
            basePath={localizeHref(locale, `/${slug}`)}
            locale={locale}
            className="mt-6"
          />
        </>
      ) : (
        <p
          className="mt-6 max-w-body border-t border-rule pt-4 text-body text-ink-soft"
          lang={english ? 'en' : 'ne'}
        >
          {english
            ? 'No reviewed stories are published in this section yet.'
            : 'यो खण्डमा अझै समीक्षित समाचार प्रकाशित भएका छैनन्।'}
        </p>
      )}
    </div>
  )
}
