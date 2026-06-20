import Link from 'next/link'
import type { AuthorRef, Locale, SourceAttribution } from '@nagarikwatch/db'
import { Dateline } from './Dateline'
import { cn } from './cn'

/**
 * Byline: author links + date. Per editorial-workflow §3 the attribution line depends on
 * the source type:
 *  - original: "श्रीजना कार्की · ५ असार २०८३"
 *  - aggregated: "<Outlet>बाट संकलित" linking to the source URL
 *  - wire: "एजेन्सी रिपोर्ट" (no individual author link)
 * The separator is a middle dot, never a banned em dash.
 */
type BylineProps = {
  authors: AuthorRef[]
  locale: Locale
  publishedAt: string
  source?: SourceAttribution
  authorPathPrefix?: string
  className?: string
}

const SEP = ' \u00b7 '

export function Byline({
  authors,
  locale,
  publishedAt,
  source,
  authorPathPrefix = '/author',
  className,
}: BylineProps) {
  const prefix = locale === 'en' ? '/en' : ''
  const authorBase = `${prefix}${authorPathPrefix}`

  let attribution: React.ReactNode
  if (source) {
    if (source.sourceType === 'wire') {
      const wireText = locale === 'en' ? 'Agency report' : 'एजेन्सी रिपोर्ट'
      attribution = (
        <span lang={locale === 'en' ? 'en' : 'ne'} className="font-semibold">
          {wireText}
        </span>
      )
    } else {
      const label = locale === 'en' ? ', aggregated from' : 'बाट संकलित'
      attribution = (
        <>
          {source.sourceUrl ? (
            <a
              href={source.sourceUrl}
              rel="noopener noreferrer nofollow"
              className="font-semibold hover:underline"
              lang={locale === 'en' ? 'en' : 'ne'}
            >
              {source.sourceName}
            </a>
          ) : (
            <span className="font-semibold" lang={locale === 'en' ? 'en' : 'ne'}>
              {source.sourceName}
            </span>
          )}
          <span lang={locale === 'en' ? 'en' : 'ne'}>{label}</span>
        </>
      )
    }
  } else {
    attribution = authors.map((a, i) => (
      <span key={a.slug}>
        {i > 0 && SEP}
        <Link href={`${authorBase}/${a.slug}`} className="font-semibold hover:underline">
          <span lang={locale === 'en' ? 'en' : 'ne'}>{a.name}</span>
        </Link>
      </span>
    ))
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-1 text-meta text-ink-soft', className)}>
      {attribution}
      <span aria-hidden="true">{SEP}</span>
      <Dateline iso={publishedAt} locale={locale} />
    </div>
  )
}
