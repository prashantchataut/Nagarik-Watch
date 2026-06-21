import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { cn } from '@nagarikwatch/ui'

type PaginationProps = {
  page: number
  totalPages: number
  /** Base path without query string, e.g. "/politics" or "/en/society". */
  basePath: string
  locale: Locale
  className?: string
}

/**
 * Page navigation for a list. Generates real <a> links to ?page=N so the controls are
 * crawlable and work without JS. Page 1 links to the bare path (canonical, no query) so
 * the first page does not duplicate itself under ?page=1. The current page is marked
 * aria-current="page" and rendered as non-interactive text.
 */
export function Pagination({ page, totalPages, basePath, locale, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const dict = getDictionary(locale)

  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`)
  const pages = pageRange(page, totalPages)

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label={dict.page}>
      {page > 1 && (
        <Link
          href={hrefFor(page - 1)}
          rel="prev"
          className="inline-flex items-center rounded-full border border-rule px-3.5 py-1.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          ← {dict.prevPage}
        </Link>
      )}
      <ul className="flex items-center gap-1">
        {pages.map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="px-2 text-mute" aria-hidden="true">
              …
            </li>
          ) : p === page ? (
            <li key={p}>
              <span
                aria-current="page"
                className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full bg-brand px-2 py-1.5 text-meta font-bold text-surface"
              >
                {p}
              </span>
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                className="inline-flex min-w-[2.25rem] items-center justify-center rounded-full border border-rule px-2 py-1.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      {page < totalPages && (
        <Link
          href={hrefFor(page + 1)}
          rel="next"
          className="inline-flex items-center rounded-full border border-rule px-3.5 py-1.5 text-meta font-semibold text-ink transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {dict.nextPage} →
        </Link>
      )}
    </nav>
  )
}

/** Compact page list with leading/trailing ellipses, e.g. 1 … 4 5 [6] 7 8 … 12. */
function pageRange(current: number, total: number): (number | null)[] {
  const out: (number | null)[] = []
  const add = (n: number | null) => out.push(n)
  const window = 1
  const first = 1
  const last = total

  for (let p = first; p <= last; p++) {
    const nearCurrent = Math.abs(p - current) <= window
    const nearEdge = p === first || p === last
    if (nearCurrent || nearEdge) {
      add(p)
    } else {
      // Insert a single ellipsis for a run of hidden pages.
      const prev = out[out.length - 1]
      if (prev !== null) add(null)
    }
  }
  return out
}
