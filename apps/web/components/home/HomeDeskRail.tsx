import Link from 'next/link'
import type { Category, Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

type HomeDeskRailProps = {
  locale: Locale
  categories?: Category[]
  className?: string
}

/** Category scan rail only. Latest/Search/Account live in BottomNav. */
export function HomeDeskRail({ locale, categories = [], className }: HomeDeskRailProps) {
  const english = locale === 'en'
  const desks = categories.slice(0, 10)
  if (!desks.length) return null

  return (
    <nav
      id="desks"
      aria-label={english ? 'Sections' : 'विभाग'}
      className={className}
    >
      <ul className="flex gap-0 overflow-x-auto border-y border-rule [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
        {desks.map((category) => (
          <li key={category.slug} className="shrink-0">
            <Link
              href={localizeHref(locale, `/${category.slug}`)}
              className="inline-flex min-h-11 items-center whitespace-nowrap px-3.5 text-meta font-semibold text-ink-soft transition-colors duration-fast ease-out-quint hover:text-brand-strong focus-visible:text-brand-strong"
              lang={english && category.nameEn ? 'en' : 'ne'}
            >
              {english && category.nameEn ? category.nameEn : category.nameNe}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
