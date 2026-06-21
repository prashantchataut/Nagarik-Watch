import type { Locale, SourceAttribution } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { cn } from '@nagarikwatch/ui'

type AttributionLineProps = {
  source: SourceAttribution
  locale: Locale
  className?: string
}

/**
 * Reader-facing provenance line for aggregated/wire stories (editorial-workflow.md §3).
 * Three modes, all locale-aware:
 *  - wire: a neutral-tinted "एजेन्सी रिपोर्ट / Agency report" pill.
 *  - aggregated: "स्रोत: [Outlet]" linking the original, opened in a new tab with
 *    rel=noopener,noreferrer,nofollow.
 *  - original: the component is not rendered at all (the call site guards on sourceType).
 * No side-stripe borders, no glassmorphism — a tinted surface or inline text only.
 */
export function AttributionLine({ source, locale, className }: AttributionLineProps) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  if (source.sourceType === 'wire') {
    return (
      <p className={cn('text-meta text-ink-soft', className)} lang={lang}>
        <span className="inline-flex items-center rounded-full bg-brand-tint px-2.5 py-1 font-semibold text-brand-strong">
          {dict.agencyReport}
        </span>
      </p>
    )
  }

  return (
    <p className={cn('text-meta text-ink-soft', className)} lang={lang}>
      {dict.sourcePrefix}:{' '}
      <a
        href={source.sourceUrl}
        target="_blank"
        rel="noopener noreferrer nofollow"
        className="inline-flex items-center gap-1 font-semibold text-ink underline decoration-rule underline-offset-2 transition-colors duration-fast ease-out-quint hover:text-brand-strong hover:decoration-brand"
      >
        {source.sourceName}
        <ExternalIcon />
        <span className="sr-only">{dict.aggregatedFrom}</span>
      </a>
    </p>
  )
}

function ExternalIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
