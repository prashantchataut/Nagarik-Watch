import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { StoryCard } from '@nagarikwatch/ui'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { STATIC_HUBS, localizedTitle } from '@/lib/site'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

const hub = STATIC_HUBS.find((item) => item.key === 'archive')!

export const dynamic = 'force-static'

type Search = {
  q?: string
  category?: string
  author?: string
  tag?: string
  from?: string
  to?: string
  page?: string
}

export default async function ArchivePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<Search>
}) {
  const locale: Locale = asLocale((await params).locale)
  const query = await searchParams
  const page = Math.max(1, Number(query.page) || 1)
  const lang = locale === 'en' ? 'en' : 'ne'

  const [categories, authors, tags, result] = await Promise.all([
    getNavCategories(),
    getAuthors(),
    getTags(),
    getStories({
      locale,
      page,
      perPage: 12,
      q: query.q?.trim() || undefined,
      category: query.category || undefined,
      author: query.author || undefined,
      tag: query.tag || undefined,
      dateFrom: query.from || undefined,
      dateTo: query.to || undefined,
    }),
  ])

  const basePath = localizeHref(locale, '/archive')
  const buildHref = (overrides: Search) => {
    const params = new URLSearchParams()
    const merged = { ...query, ...overrides }
    for (const [key, value] of Object.entries(merged)) {
      if (value && key !== 'page') params.set(key, value)
      if (key === 'page' && value && value !== '1') params.set('page', value)
    }
    const qs = params.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader
        title={localizedTitle(locale, hub)}
        lead={locale === 'en' ? hub.leadEn : hub.leadNe}
        lang={lang}
      />

      <form
        method="get"
        action={basePath}
        className="mt-8 grid gap-4 border-y border-rule py-6 sm:grid-cols-2 lg:grid-cols-3"
        lang={lang}
      >
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'Search' : 'खोज'}
          <input
            name="q"
            defaultValue={query.q ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          />
        </label>
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'Section' : 'विभाग'}
          <select
            name="category"
            defaultValue={query.category ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          >
            <option value="">{locale === 'en' ? 'All sections' : 'सबै विभाग'}</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {locale === 'en' && c.nameEn ? c.nameEn : c.nameNe}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'Author' : 'लेखक'}
          <select
            name="author"
            defaultValue={query.author ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          >
            <option value="">{locale === 'en' ? 'All authors' : 'सबै लेखक'}</option>
            {authors.map((a) => (
              <option key={a.slug} value={a.slug}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'Topic' : 'विषय'}
          <select
            name="tag"
            defaultValue={query.tag ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          >
            <option value="">{locale === 'en' ? 'All topics' : 'सबै विषय'}</option>
            {tags.map((t) => (
              <option key={t.slug} value={t.slug}>
                {locale === 'en' && t.nameEn ? t.nameEn : t.nameNe}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'From' : 'देखि'}
          <input
            type="date"
            name="from"
            defaultValue={query.from ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          />
        </label>
        <label className="block text-meta font-semibold text-ink-soft">
          {locale === 'en' ? 'To' : 'सम्म'}
          <input
            type="date"
            name="to"
            defaultValue={query.to ?? ''}
            className="mt-1 w-full border border-rule bg-surface px-3 py-2 text-body text-ink"
          />
        </label>
        <div className="flex items-end gap-3 sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="inline-flex min-h-10 items-center bg-brand px-4 text-meta font-bold text-surface hover:bg-brand-strong"
          >
            {locale === 'en' ? 'Browse archive' : 'अभिलेख हेर्नुहोस्'}
          </button>
          <Link href={basePath} className="text-meta font-semibold text-brand-strong">
            {locale === 'en' ? 'Clear filters' : 'फिल्टर हटाउनुहोस्'}
          </Link>
        </div>
      </form>

      <p className="mt-6 text-meta text-ink-soft" lang={lang}>
        {locale === 'en'
          ? `${result.total} stories match these filters.`
          : `यी फिल्टरमा ${result.total} समाचार मिल्छन्।`}
      </p>

      {result.items.length > 0 ? (
        <ul className="mt-6 grid gap-8 md:grid-cols-2">
          {result.items.map((story) => (
            <li key={story.id}>
              <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                <StoryCard story={story} locale={locale} variant="horizontal" />
              </InstrumentedStory>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 border-y border-rule py-10 text-body-lg text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'No stories match these filters yet.'
            : 'यी फिल्टरमा अहिले कुनै समाचार मिल्दैन।'}
        </p>
      )}

      {result.totalPages > 1 ? (
        <nav className="mt-10 flex gap-4" aria-label={locale === 'en' ? 'Pagination' : 'पृष्ठहरू'}>
          {page > 1 ? (
            <Link
              href={buildHref({ page: String(page - 1) })}
              className="text-meta font-semibold text-brand-strong"
            >
              {locale === 'en' ? 'Previous' : 'अघिल्लो'}
            </Link>
          ) : null}
          <span className="text-meta text-ink-soft">
            {page} / {result.totalPages}
          </span>
          {page < result.totalPages ? (
            <Link
              href={buildHref({ page: String(page + 1) })}
              className="text-meta font-semibold text-brand-strong"
            >
              {locale === 'en' ? 'Next' : 'अर्को'}
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: localizedTitle(locale, hub),
    alternates: { canonical: localizeHref(locale, hub.path) },
  }
}
