import { staticTopicParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { CategoryRef, Locale } from '@nagarikwatch/db'
import { notFound } from 'next/navigation'
import { StoryGrid } from '@nagarikwatch/ui'
import { getStories, getTag } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'
import { Pagination } from '@/components/Pagination'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticTopicParams()
}

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

  const data = await getTag(slug, locale)
  if (!data) notFound()

  // Fetch the full paginated list for this locale so /en honours the same visibility rules
  // as the rest of the site (ADR-007). getTag returns page 1 only; getStories paginates.
  const result = await getStories({ tag: slug, page, locale })
  const dict = getDictionary(locale)
  const { tag } = data
  const lang = locale === 'en' ? 'en' : 'ne'
  const name = locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe
  const nameLang = locale === 'en' && tag.nameEn ? 'en' : 'ne'
  const description = locale === 'en' ? tag.descriptionEn : tag.descriptionNe

  // Most common category across this topic's stories — the parent section the reader is
  // most likely to have come from, so the back-link points somewhere useful rather than home.
  const parentCategory = mostCommonCategory(result.items.map((s) => s.category))

  return (
    <div className="mx-auto max-w-page px-4 py-8">
      <header className="border-b border-rule pb-6">
        <p
          className="text-meta font-semibold uppercase tracking-wide text-brand-strong"
          lang={lang}
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
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span
            className="inline-flex items-center rounded-sm bg-brand-tint px-2.5 py-1 text-meta font-bold text-brand-strong"
            lang={nameLang}
          >
            {dict.storyCountTopic(result.total)}
          </span>
          {parentCategory && (
            <Link
              href={localizeHref(locale, `/${parentCategory.slug}`)}
              lang={lang}
              className="inline-flex items-center border-b border-rule pb-1 text-meta font-semibold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
            >
              {dict.topicBackToCategory}
            </Link>
          )}
        </div>
      </header>

      {result.items.length === 0 ? (
        <p className="mt-12 text-body-lg text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'No published stories on this topic yet.'
            : 'यस विषयमा अझै प्रकाशित समाचार छैन।'}
        </p>
      ) : (
        <div className="mt-8">
          <StoryGrid stories={result.items} locale={locale} />
        </div>
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

/**
 * Returns the category that appears most often in a list of story categories, or null when
 * the list is empty. Ties resolve to the first-seen category so the back-link is stable.
 */
function mostCommonCategory(cats: CategoryRef[]): CategoryRef | null {
  if (cats.length === 0) return null
  const counts = new Map<string, { ref: CategoryRef; n: number }>()
  for (const c of cats) {
    const entry = counts.get(c.slug)
    if (entry) entry.n += 1
    else counts.set(c.slug, { ref: c, n: 1 })
  }
  let best: { ref: CategoryRef; n: number } | null = null
  for (const entry of counts.values()) {
    if (!best || entry.n > best.n) best = entry
  }
  return best?.ref ?? null
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
  const data = await getTag(slug, locale)
  const prefix = localePrefix(locale)
  const canonical = `${prefix}/topic/${slug}`

  if (!data) {
    return { title: getDictionary(locale).notFoundHeading, robots: { index: false } }
  }

  const name = locale === 'en' && data.tag.nameEn ? data.tag.nameEn : data.tag.nameNe
  return {
    title: name,
    alternates: {
      canonical,
      languages: { ne: `/topic/${slug}`, en: `/en/topic/${slug}` },
    },
    robots: page > 1 ? { index: false, follow: true } : { index: true, follow: true },
  }
}
