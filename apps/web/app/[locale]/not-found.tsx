import Link from 'next/link'
import { getDictionary } from '@/lib/i18n/dictionaries'

/**
 * Custom 404. Rendered when a path under a locale has no match (unknown category, article,
 * author, or topic) or when a server component calls notFound().
 *
 * not-found boundaries receive no params and run on the server, so the locale can't be read
 * reliably from the segment here. Rather than guess, the page is shown bilingually: the
 * Nepali and English copy both appear, and there are home links for each locale. This is warm
 * and unambiguous — a reader who landed somewhere we have no page for sees a clear way back in
 * whichever language they read.
 */
export default function NotFound() {
  const ne = getDictionary('ne')
  const en = getDictionary('en')

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-body flex-col justify-center px-4 py-16 text-center">
      <p className="font-display text-7xl font-bold text-brand sm:text-8xl" aria-hidden="true">
        ४०४
      </p>

      <div className="mt-6">
        <h1 className="font-display text-display text-ink" lang="ne">
          {ne.notFoundHeading}
        </h1>
        <p className="mx-auto mt-2 font-display text-h2 text-mute" lang="en">
          {en.notFoundHeading}
        </p>
      </div>

      <div className="mx-auto mt-4 max-w-prose space-y-1">
        <p className="text-body-lg leading-relaxed text-ink-soft" lang="ne">
          {ne.notFoundBody}
        </p>
        <p className="text-body-lg leading-relaxed text-ink-soft" lang="en">
          {en.notFoundBody}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-sm bg-brand px-6 py-3 text-body font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
          lang="ne"
        >
          {ne.notFoundHome}
        </Link>
        <Link
          href="/en"
          className="inline-flex items-center rounded-sm border border-rule px-6 py-3 text-body font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:text-brand-strong"
          lang="en"
        >
          {en.notFoundHome}
        </Link>
      </div>
    </div>
  )
}
