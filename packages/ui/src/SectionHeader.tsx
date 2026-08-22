import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/**
 * Editorial section heading with a short civic-crimson marker and an optional
 * desktop connector. It intentionally avoids full-width rules on small screens
 * so stacked desks do not look like a wireframe.
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
    <div className={cn('flex min-w-0 items-end gap-3 sm:gap-4', className)}>
      <div className="min-w-0 shrink-0">
        <h2
          id={id}
          className="font-display text-h3 font-extrabold tracking-tight text-ink sm:text-h2"
          lang={lang}
        >
          {title}
        </h2>
        <span className="mt-1.5 block h-0.5 w-11 bg-brand" aria-hidden="true" />
      </div>

      <span className="mb-2 hidden h-px min-w-8 flex-1 bg-rule sm:block" aria-hidden="true" />

      {href && moreLabel ? (
        <Link
          href={href}
          className="mb-0.5 ml-auto shrink-0 text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {moreLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      ) : null}
    </div>
  )
}
