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
import { canonicalCategoryBySlug } from '@/lib/site'

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
  // Desk names are static product taxonomy: resolve them synchronously so the
  // streamed <title> never races a slow content-source read. The source is
  // only consulted for slugs outside the canonical set.
  const fallback = canonicalCategoryBySlug(slug)
  if (fallback) {
    return {
      title: locale === 'en' ? fallback.nameEn : fallback.nameNe,
      alternates: canonicalAlternates(locale, `/${slug}`),
    }
  }
  const source = await getCategory(slug).catch(() => null)
  if (!source) return {}
  return {
    title: locale === 'en' ? source.nameEn || source.nameNe : source.nameNe || source.nameEn,
    description: (locale === 'en' ? source.descriptionEn : source.descriptionNe) ?? undefined,
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
  const [categoryResult, result] = await Promise.all([
    getCategory(slug).catch(() => null),
    getCategoryPage(slug, page, locale).catch(() => null),
  ])
  // Fail safe to the canonical taxonomy so a source hiccup renders a correct
  // desk shell (and a real empty state) instead of a 404/500. Partial records
  // with empty names also fall back.
  const fallback = canonicalCategoryBySlug(slug)
  const category = categoryResult ??
    (fallback ? { slug, nameNe: fallback.nameNe, nameEn: fallback.nameEn } : null)
  const resolvedName = category ? (english ? category.nameEn || category.nameNe : category.nameNe || category.nameEn) : ''
  if (!category || !resolvedName || !result || page > result.totalPages) notFound()
  const name = resolvedName
  const description = english ? categoryResult?.descriptionEn : categoryResult?.descriptionNe
  // Short desk lead only when CMS has real copy; never invent marketing blurb.
  const lead = description?.trim() || undefined

  return (
    <div className="mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5">
      <HubIndexHeader title={name} lead={lead} lang={english ? 'en' : 'ne'} />
      {result.items.length ? (
        <>
          <div className="mt-4">
            <AdSlot locale={locale} placementKey="category-top" />
          </div>
          <div className="mt-4">
            <CategoryDesk stories={result.items} locale={locale} />
          </div>
          <AdSlot
            locale={locale}
            placementKey="category-inline"
            variant="inline"
            className="mt-4"
          />
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
