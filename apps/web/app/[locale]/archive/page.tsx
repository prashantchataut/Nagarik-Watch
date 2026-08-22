import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { STATIC_HUBS, localizedTitle } from '@/lib/site'
import { InstrumentedStory } from '@/components/ranking/InstrumentedStory'

const hub = STATIC_HUBS.find((item) => item.key === 'archive')!

export const revalidate = 60

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
        className="mt-8 grid gap-4 border-y border-rule bg-surface-raised py-6 sm:grid-cols-2 lg:grid-cols-3"
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
        <ol className="mt-6 border-t border-rule">
          {result.items.map((story) => {
            const title = locale === 'en' && story.titleEn ? story.titleEn : story.titleNe
            const deck = locale === 'en' && story.deckEn ? story.deckEn : story.deckNe
            const published = new Date(story.publishedAt)
            const href = localizeHref(locale, `/${story.category.slug}/${story.slug}`)
            const category =
              locale === 'en' && story.category.nameEn
                ? story.category.nameEn
                : story.category.nameNe
            return (
              <li key={story.id} className="border-b border-rule py-5">
                <InstrumentedStory articleSlug={story.slug} articleCategory={story.category.slug}>
                  <article className="grid gap-3 sm:grid-cols-[7.5rem_minmax(0,1fr)_8.5rem] sm:gap-5">
                    <div className="text-caption font-semibold text-mute">
                      <time dateTime={story.publishedAt}>
                        {Number.isNaN(published.getTime())
                          ? story.publishedAt
                          : new Intl.DateTimeFormat(locale === 'en' ? 'en-NP' : 'ne-NP', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            }).format(published)}
                      </time>
                      <p className="mt-1 text-brand-strong">{category}</p>
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-display text-h3 font-extrabold leading-snug text-ink">
                        <Link href={href} className="hover:text-brand-strong">
                          {title}
                        </Link>
                      </h2>
                      {deck ? (
                        <p className="mt-1.5 line-clamp-2 text-body text-ink-soft">{deck}</p>
                      ) : null}
                      {story.byline ? (
                        <p className="mt-2 text-caption text-mute">{story.byline}</p>
                      ) : null}
                    </div>
                    {story.heroImage?.url && !story.heroImage.url.startsWith('data:') ? (
                      <Link
                        href={href}
                        className="relative hidden aspect-[4/3] overflow-hidden bg-surface-raised sm:block"
                      >
                        <Image
                          src={story.heroImage.url}
                          alt=""
                          fill
                          sizes="136px"
                          className="object-cover"
                        />
                      </Link>
                    ) : (
                      <span className="hidden sm:block" aria-hidden="true" />
                    )}
                  </article>
                </InstrumentedStory>
              </li>
            )
          })}
        </ol>
      ) : (
        <div
          className="mt-8 border-y border-rule bg-brand-tint/35 px-4 py-10 text-body-lg text-ink-soft"
          lang={lang}
        >
          <p className="font-display text-h2 text-ink">
            {locale === 'en' ? 'No matching stories' : 'मिल्ने समाचार छैन'}
          </p>
          <p className="mt-2 max-w-body text-body text-ink-soft">
            {locale === 'en'
              ? 'Try a broader date range, fewer filters, or a shorter search term.'
              : 'अझ फराकिलो मिति, कम फिल्टर वा छोटो खोज शब्द प्रयोग गर्नुहोस्।'}
          </p>
        </div>
      )}

      {result.totalPages > 1 ? (
        <nav
          className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-rule pt-5"
          aria-label={locale === 'en' ? 'Pagination' : 'पृष्ठहरू'}
        >
          <div>
            {page > 1 ? (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="inline-flex min-h-11 items-center border-y border-rule px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong"
              >
                {locale === 'en' ? 'Previous' : 'अघिल्लो'}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
          <span className="text-meta text-ink-soft">
            {page} / {result.totalPages}
          </span>
          <div className="text-right">
            {page < result.totalPages ? (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="inline-flex min-h-11 items-center border-y border-rule px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong"
              >
                {locale === 'en' ? 'Next' : 'अर्को'}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
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
