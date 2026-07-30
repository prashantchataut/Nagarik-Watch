import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getNavCategories } from '@/lib/content'

/** Quiet recovery page: brand present, one locale voice, no theatrical display vanity. */
export default async function NotFound() {
  const ne = getDictionary('ne')
  const categories = await getNavCategories().catch(() => [])

  return (
    <main className="mx-auto min-h-[70vh] max-w-page px-4 py-8 sm:py-10">
      <header className="border-b border-rule pb-4">
        <Link href="/" className="inline-flex items-center gap-3 text-ink hover:text-brand-strong" lang="ne">
          <Logo className="h-8 w-auto" />
          <span className="sr-only">नागरिक वाच</span>
        </Link>
      </header>

      <div className="max-w-body py-6">
        <p className="text-meta font-extrabold text-brand-strong" lang="ne">
          पृष्ठ फेला परेन
        </p>
        <h1 className="mt-1.5 font-display text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold tracking-tight text-ink text-wrap-balance" lang="ne">
          {ne.notFoundHeading}
        </h1>
        <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
        <p className="mt-3 text-body leading-relaxed text-ink-soft" lang="ne">
          {ne.notFoundBody}
        </p>
      </div>

      <section className="grid gap-8 border-t border-rule py-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div>
          <h2 className="font-display text-h2 font-bold text-ink" lang="ne">
            समाचार खोज्नुहोस्
          </h2>
          <form action="/search" className="mt-4 flex w-full max-w-2xl border border-rule">
            <input
              type="search"
              name="q"
              placeholder={ne.searchPlaceholder}
              aria-label={ne.search}
              className="min-h-12 min-w-0 flex-1 bg-surface px-4 text-body text-ink placeholder:text-mute focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand"
              lang="ne"
            />
            <button
              type="submit"
              className="min-h-12 shrink-0 border-l border-rule bg-brand px-5 text-meta font-bold text-surface hover:bg-brand-strong"
              lang="ne"
            >
              {ne.search}
            </button>
          </form>
        </div>

        <nav aria-label="खण्डहरू" className="space-y-3" lang="ne">
          <p className="text-meta font-semibold text-ink">यहाँबाट सुरु गर्नुहोस्</p>
          <div className="grid gap-2">
            <Link href="/" className="text-body font-bold text-brand-strong hover:underline">
              {ne.notFoundHome}
            </Link>
            <Link href="/en" className="text-body text-ink-soft hover:text-brand-strong" lang="en">
              English home
            </Link>
            {categories.slice(0, 6).map((c) => (
              <Link
                key={c.slug}
                href={`/${c.slug}`}
                className="text-body text-ink-soft hover:text-brand-strong"
              >
                {c.nameNe}
              </Link>
            ))}
          </div>
        </nav>
      </section>
    </main>
  )
}
