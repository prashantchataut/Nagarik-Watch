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

/** Crawlable, no-JavaScript page navigation with a restrained editorial treatment. */
export function Pagination({ page, totalPages, basePath, locale, className }: PaginationProps) {
  if (totalPages <= 1) return null
  const dict = getDictionary(locale)
  const hrefFor = (p: number) => (p <= 1 ? basePath : `${basePath}?page=${p}`)
  const pages = pageRange(page, totalPages)
  const directionClass =
    'inline-flex min-h-11 items-center border-y border-rule px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong'

  return (
    <nav
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-t-2 border-ink pt-5',
        className,
      )}
      aria-label={dict.page}
    >
      <div>
        {page > 1 ? (
          <Link
            href={hrefFor(page - 1)}
            rel="prev"
            className={directionClass}
            lang={locale === 'en' ? 'en' : 'ne'}
          >
            ← {dict.prevPage}
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
      <ul className="flex items-center gap-1" aria-label={`${dict.page} ${page} / ${totalPages}`}>
        {pages.map((p, i) =>
          p === null ? (
            <li key={`gap-${i}`} className="px-2 text-mute" aria-hidden="true">
              …
            </li>
          ) : p === page ? (
            <li key={p}>
              <span
                aria-current="page"
                className="inline-flex min-h-10 min-w-10 items-center justify-center border-b-4 border-brand bg-ink px-2 text-meta font-bold text-surface"
              >
                {p}
              </span>
            </li>
          ) : (
            <li key={p}>
              <Link
                href={hrefFor(p)}
                className="inline-flex min-h-10 min-w-10 items-center justify-center border-b border-rule px-2 text-meta font-semibold text-ink transition-colors hover:border-brand hover:text-brand-strong"
              >
                {p}
              </Link>
            </li>
          ),
        )}
      </ul>
      <div className="text-right">
        {page < totalPages ? (
          <Link
            href={hrefFor(page + 1)}
            rel="next"
            className={directionClass}
            lang={locale === 'en' ? 'en' : 'ne'}
          >
            {dict.nextPage} →
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </nav>
  )
}

function pageRange(current: number, total: number): (number | null)[] {
  const out: (number | null)[] = []
  for (let p = 1; p <= total; p++) {
    const visible = Math.abs(p - current) <= 1 || p === 1 || p === total
    if (visible) out.push(p)
    else if (out[out.length - 1] !== null) out.push(null)
  }
  return out
}
