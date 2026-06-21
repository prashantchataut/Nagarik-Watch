import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/**
 * Section heading with a hairline rule below (DESIGN.md §5). The h2 carries the section
 * title in the brand color; an optional "थप →" / "More →" link sits to the right and
 * points at the section landing page. The link is hidden from assistive tech when no
 * href is supplied, so the rule still renders as a pure divider.
 */
type SectionHeaderProps = {
  title: string
  locale: Locale
  /** Localized "More" label, e.g. dict.seeAll. Rendered only when href is set. */
  moreLabel?: string
  href?: string
  /** BCP-47 lang for the title text; defaults to the active locale. */
  titleLang?: Locale
  className?: string
}

export function SectionHeader({
  title,
  locale,
  moreLabel,
  href,
  titleLang,
  className,
}: SectionHeaderProps) {
  const lang = titleLang ?? locale
  return (
    <div
      className={cn('flex items-end justify-between gap-4 border-b-2 border-brand pb-2', className)}
    >
      <h2 className="font-display text-h2 font-bold text-ink" lang={lang}>
        {title}
      </h2>
      {href && moreLabel && (
        <Link
          href={href}
          className="shrink-0 rounded-full px-3 py-1 text-meta font-semibold text-brand transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {moreLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      )}
    </div>
  )
}
