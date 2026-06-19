import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { StoryCard } from '@nagarikwatch/ui'
import { getStories, getTag } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'

type Params = { locale: string; slug: string }

/**
 * Topic (tag) landing. Resolves the tag (404 if unknown) and renders its paginated story
 * grid. Pagination mirrors the category page: ?page=N as real links, page 1 keeps a bare
 * canonical, page 2+ is noindex. Tag names/descriptions are Nepali-primary; the English
 * route surfaces the English fields when present.
 */
export default async function TopicPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const requested = Number.parseInt(sp.page ?? '1', 10)
  const page = Number.isFinite(requested) && requested > 0 ? requested : 1

  const data = await getTag(slug)
  if (!data) notFound()

  // Fetch the full paginated list for this locale so /en honours the same visibility rules
  // as the rest of the site (ADR-007). getTag only returns page 1 in ne; getStories paginates.
  const result = await getStories({ tag: slug, page, locale })
  const dict = getDictionary(locale)
  const { tag } = data
  const name = locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe
  const nameLang = locale === 'en' && tag.nameEn ? 'en' : 'ne'
  const description = locale === 'en' ? tag.descriptionEn : tag.descriptionNe

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {dict.topicStories}
        </p>
        <h1 className="mt-1 font-display text-display text-ink" lang={nameLang}>
          {name}
        </h1>
        {description && (
          <p className="mt-3 max-w-body text-body-lg text-ink-soft" lang={nameLang}>
            {description}
          </p>
        )}
      </header>

      {result.items.length === 0 ? (
        <p className="mt-12 text-body-lg text-mute" lang={locale === 'en' ? 'en' : 'ne'}>
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
        basePath={localizeHref(locale, `/topic/${slug}`)}
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
  const { locale: rawLocale, slug } = await params
  const locale: Locale = asLocale(rawLocale)
  const sp = await searchParams
  const page = Number.parseInt(sp.page ?? '1', 10)
  const data = await getTag(slug)
  const prefix = localePrefix(locale)
  const canonical = `${prefix}/topic/${slug}`

  if (!data) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }

  const name = locale === 'en' && data.tag.nameEn ? data.tag.nameEn : data.tag.nameNe
  const opposite = locale === 'en' ? '' : '/en'

  return {
    title: name,
    alternates: {
      canonical,
      languages: { ne: `/topic/${slug}`, en: `${opposite}/topic/${slug}` },
    },
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}
