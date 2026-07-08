import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getNavCategories } from '@/lib/content'

/**
 * Custom 404. Bilingual heading + body, a search box, and quick links to
 * popular sections so a lost reader finds their way back fast.
 */
export default async function NotFound() {
  const ne = getDictionary('ne')
  const en = getDictionary('en')
  const categories = await getNavCategories().catch(() => [])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-page flex-col justify-center px-4 py-12 sm:py-16">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-brand sm:text-8xl" aria-hidden="true">
          ४०४
        </p>
        <div className="mt-6">
          <h1 className="font-display text-h1 text-ink sm:text-display" lang="ne">
            {ne.notFoundHeading}
          </h1>
          <p className="mx-auto mt-2 font-display text-h2 text-ink-soft" lang="en">
            {en.notFoundHeading}
          </p>
        </div>
        <div className="mx-auto mt-4 max-w-prose space-y-1">
          <p className="text-body leading-relaxed text-ink-soft sm:text-body-lg" lang="ne">
            {ne.notFoundBody}
          </p>
          <p className="text-body leading-relaxed text-ink-soft sm:text-body-lg" lang="en">
            {en.notFoundBody}
          </p>
        </div>
      </div>

      {/* Search */}
      <form action="/search" className="mx-auto mt-8 flex w-full max-w-md gap-2">
        <input
          type="search"
          name="q"
          placeholder={ne.searchPlaceholder}
          aria-label={ne.search}
          className="w-full rounded-full border border-rule bg-surface px-5 py-3 text-body text-ink placeholder:text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand-tint"
          lang="ne"
        />
        <button
          type="submit"
          className="inline-flex h-12 shrink-0 items-center rounded-full bg-brand px-5 text-meta font-semibold text-surface hover:bg-brand-strong"
          lang="ne"
        >
          {ne.search}
        </button>
      </form>

      {/* Quick links */}
      <nav
        aria-label="Popular sections"
        className="mx-auto mt-8 flex flex-wrap items-center justify-center gap-2"
      >
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-brand px-5 py-2.5 text-meta font-semibold text-surface hover:bg-brand-strong"
          lang="ne"
        >
          {ne.notFoundHome}
        </Link>
        <Link
          href="/en"
          className="inline-flex items-center rounded-full border border-rule px-5 py-2.5 text-meta font-semibold text-ink hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
          lang="en"
        >
          {en.notFoundHome}
        </Link>
        {categories.slice(0, 5).map((c) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="inline-flex items-center rounded-full border border-rule px-4 py-2 text-meta font-medium text-ink-soft hover:border-brand hover:text-brand-strong"
            lang="ne"
          >
            {c.nameNe}
          </Link>
        ))}
      </nav>
    </div>
  )
}
