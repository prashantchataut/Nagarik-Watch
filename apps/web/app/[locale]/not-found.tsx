import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getNavCategories } from '@/lib/content'

/** Bilingual recovery page with search and real editorial entry points. */
export default async function NotFound() {
  const ne = getDictionary('ne')
  const en = getDictionary('en')
  const categories = await getNavCategories().catch(() => [])

  return (
    <main className="mx-auto min-h-[65vh] max-w-page px-4 py-12 sm:py-16">
      <div className="grid gap-10 border-b-2 border-ink pb-10 lg:grid-cols-[12rem_1fr] lg:items-end">
        <p className="font-display text-[clamp(5rem,14vw,10rem)] font-bold leading-none tracking-[-0.08em] text-brand" aria-hidden="true">४०४</p>
        <div>
          <p className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong">Page not found</p>
          <h1 className="mt-2 font-display text-display text-ink" lang="ne">{ne.notFoundHeading}</h1>
          <p className="mt-1 font-display text-h2 text-ink-soft" lang="en">{en.notFoundHeading}</p>
          <div className="mt-4 max-w-body space-y-1 text-body-lg leading-relaxed text-ink-soft">
            <p lang="ne">{ne.notFoundBody}</p>
            <p lang="en">{en.notFoundBody}</p>
          </div>
        </div>
      </div>

      <section className="grid gap-8 py-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <h2 className="font-display text-h1 text-ink" lang="ne">समाचार खोज्नुहोस्</h2>
          <form action="/search" className="mt-4 flex w-full max-w-2xl border-y border-rule">
            <input
              type="search"
              name="q"
              placeholder={ne.searchPlaceholder}
              aria-label={ne.search}
              className="min-h-13 min-w-0 flex-1 bg-surface px-4 text-body text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
              lang="ne"
            />
            <button type="submit" className="min-h-13 shrink-0 border-l border-rule bg-brand px-6 text-meta font-bold text-surface hover:bg-brand-strong" lang="ne">
              {ne.search} →
            </button>
          </form>
        </div>

        <nav aria-label="Popular sections" className="border border-rule bg-surface-raised px-5 py-4">
          <p className="text-caption font-bold uppercase tracking-[0.14em] text-ink-soft">Start again</p>
          <div className="mt-3 grid gap-2">
            <Link href="/" className="border-b border-rule pb-2 text-body font-bold text-ink hover:border-brand hover:text-brand-strong" lang="ne">{ne.notFoundHome} →</Link>
            <Link href="/en" className="border-b border-rule pb-2 text-body font-bold text-ink hover:border-brand hover:text-brand-strong" lang="en">{en.notFoundHome} →</Link>
            {categories.slice(0, 5).map((c) => (
              <Link key={c.slug} href={`/${c.slug}`} className="border-b border-rule pb-2 text-body text-ink-soft hover:border-brand hover:text-brand-strong" lang="ne">{c.nameNe}</Link>
            ))}
          </div>
        </nav>
      </section>
    </main>
  )
}
