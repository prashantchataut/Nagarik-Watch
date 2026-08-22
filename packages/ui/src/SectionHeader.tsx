import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { cn } from './cn'

/** Editorial desk heading: one compact rule, one title, one optional way forward. */
type SectionHeaderProps = {
  title: string
  locale: Locale
  moreLabel?: string
  href?: string
  titleLang?: Locale
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
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      <span className="h-[2px] w-7 shrink-0 bg-brand sm:w-9" aria-hidden="true" />
      <h2
        id={id}
        className={cn(
          'min-w-0 font-display text-h3 font-extrabold text-ink sm:text-h2',
          lang === 'en' ? 'tracking-tight' : 'tracking-normal',
        )}
        lang={lang}
      >
        {title}
      </h2>

      {href && moreLabel ? (
        <Link
          href={href}
          className="ml-auto shrink-0 text-meta font-bold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          lang={locale === 'en' ? 'en' : 'ne'}
        >
          {moreLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      ) : null}
    </div>
  )
}
