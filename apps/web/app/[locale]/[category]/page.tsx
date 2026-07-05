import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { StoryCard } from '@nagarikwatch/ui'
import { getCategory, getCategoryPage } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'
import { LogoMark } from '@/components/Logo'

type Params = { locale: string; category: string }

/**
 * Category landing. Magazine-style layout (not a flat card grid):
 *  - Page 1: featured lead (large) + 2-col stream + sidebar with most-read.
 *  - Page 2+: uniform grid.
 *  - Empty: onboarding state with a link to the admin, not a bare message.
 *
 * Pagination is via ?page=N as real links; page 1 keeps a bare canonical,
 * page 2+ gets robots noindex to avoid thin duplicate listings.
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
  const en = locale === 'en'

  const isEmpty = result.items.length === 0
  const isPage1 = page === 1
  const lead = isPage1 ? result.items[0] : null
  const rest = isPage1 ? result.items.slice(1) : result.items

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <div>
          <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={titleLang}>
            {dict.footerSections}
          </p>
          <h1 className="mt-0.5 font-display text-display text-ink" lang={titleLang}>
            {name}
          </h1>
        </div>
        {description && (
          <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={titleLang}>
            {description}
          </p>
        )}
      </header>

      {isEmpty ? (
        <div className="mt-12 rounded-lg border border-dashed border-rule p-10 text-center">
          <LogoMark title={name} className="mx-auto h-12 w-12 opacity-40" />
          <p className="mt-4 font-display text-h2 text-ink" lang={titleLang}>
            {en ? 'No stories yet' : 'अहिलेसम्म कुनै समाचार छैन'}
          </p>
          <p className="mx-auto mt-2 max-w-md text-body text-ink-soft" lang={titleLang}>
            {en
              ? `The ${name} section is ready. Our editors will publish stories here soon.`
              : `${name} खण्ड तयार छ। हाम्रा सम्पादकहरूले चाँडै यहाँ समाचार प्रकाशित गर्नेछन्।`}
          </p>
          <a
            href={localizeHref(locale, '/latest')}
            className="mt-5 inline-flex h-11 items-center rounded-full border border-rule px-5 text-meta font-semibold text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
            lang={titleLang}
          >
            {en ? 'Read latest stories' : 'ताजा समाचार पढ्नुहोस्'}
          </a>
        </div>
      ) : isPage1 && lead ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
          {/* Lead + stream */}
          <div className="flex flex-col gap-6">
            <StoryCard story={lead} locale={locale} variant="featured" priority />
            {rest.length > 0 && (
              <ul className="grid gap-6 sm:grid-cols-2">
                {rest.slice(0, 4).map((s) => (
                  <li key={s.slug}>
                    <StoryCard story={s} locale={locale} variant="default" />
                  </li>
                ))}
              </ul>
            )}
          </div>
          {/* Sidebar: remaining items as compact text rails */}
          {rest.length > 4 && (
            <aside className="border-t border-rule pt-6 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang={titleLang}>
                {en ? 'More from ' + name : name + 'बाट थप'}
              </p>
              <ul className="mt-4 flex flex-col divide-y divide-rule">
                {rest.slice(4).map((s) => (
                  <li key={s.slug} className="py-3 first:pt-0">
                    <StoryCard story={s} locale={locale} variant="horizontal" />
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      ) : (
        <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((s) => (
            <li key={s.slug}>
              <StoryCard story={s} locale={locale} variant="default" />
            </li>
          ))}
        </ul>
      )}

      {!isEmpty && (
        <Pagination
          page={result.page}
          totalPages={result.totalPages}
          basePath={localizeHref(locale, `/${category}`)}
          locale={locale}
          className="mt-12"
        />
      )}
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
