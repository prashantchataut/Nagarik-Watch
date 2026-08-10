import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/**
 * Section heading with hairline rule + short brand title underline (DESIGN.md §4).
 * Avoid full-width heavy ink bars; those read as wireframe section chops.
 */
type SectionHeaderProps = {
  title: string
  locale: Locale
  /** Localized "More" label, e.g. dict.seeAll. Rendered only when href is set. */
  moreLabel?: string
  href?: string
  /** BCP-47 lang for the title text; defaults to the active locale. */
  titleLang?: Locale
  /** Optional id on the heading for aria-labelledby on wrapping sections. */
  id?: string
  className?: string
}

export function SectionHeader({
  title,
  locale,
  moreLabel,
  href,
  titleLang,
  id,
  className,
}: SectionHeaderProps) {
  const lang = titleLang ?? locale
  return (
    <div
      className={cn('flex items-end justify-between gap-4 border-b border-rule pb-2', className)}
    >
      <div className="min-w-0">
        <h2
          id={id}
          className="font-display text-h3 font-extrabold tracking-tight text-ink sm:text-h2"
          lang={lang}
        >
          {title}
        </h2>
        <span className="mt-1.5 block h-0.5 w-12 bg-brand" aria-hidden="true" />
      </div>
      {href && moreLabel && (
        <Link
          href={href}
          className="mb-0.5 shrink-0 text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {moreLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      )}
    </div>
  )
}
