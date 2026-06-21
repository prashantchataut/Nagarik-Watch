import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { StoryCard } from '@nagarikwatch/ui'
import { getCategory, getCategoryPage } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'

type Params = { locale: string; category: string }

/**
 * Category landing. Reads the category (404 if unknown) and the paginated story list.
 * Pagination is via ?page=N as real links; page 1 keeps a bare canonical (no query), page
 * 2+ gets robots noindex to avoid thin duplicate listings in the index.
 */
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: rawLocale, category } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const requested = Number.parseInt(sp.page ?? '1', 10)
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1

  const cat = await getCategory(category)
  if (!cat) notFound()

  const result = await getCategoryPage(category, page, locale)
  if (!result) notFound()

  const dict = getDictionary(locale)
  const name = locale === 'en' && cat.nameEn ? cat.nameEn : cat.nameNe
  const titleLang = locale === 'en' && cat.nameEn ? 'en' : 'ne'
  const description = locale === 'en' ? cat.descriptionEn : cat.descriptionNe

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={titleLang}
        >
          {dict.footerSections}
        </p>
        <h1 className="mt-1 font-display text-display text-ink" lang={titleLang}>
          {name}
        </h1>
        {description && (
          <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={titleLang}>
            {description}
          </p>
        )}
      </header>

      {result.items.length === 0 ? (
        <p className="mt-12 text-body-lg text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
          {dict.emptyEnglish}
        </p>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((s) => (
            <li key={s.slug}>
              <StoryCard story={s} locale={locale} variant="default" />
            </li>
          ))}
        </ul>
      )}

      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        basePath={localizeHref(locale, `/${category}`)}
        locale={locale}
        className="mt-12"
      />
    </div>
  )
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}): Promise<Metadata> {
  const { locale: rawLocale, category } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const page = Number.parseInt(sp.page ?? '1', 10)
  const cat = await getCategory(category)
  const prefix = localePrefix(locale)
  const canonical = `${prefix}/${category}`

  if (!cat) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }

  const name = locale === 'en' && cat.nameEn ? cat.nameEn : cat.nameNe
  return {
    title: name,
    alternates: {
      canonical,
      languages: { ne: `/${category}`, en: `/en/${category}` },
    },
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}
