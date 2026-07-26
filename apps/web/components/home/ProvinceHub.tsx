import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { PROVINCES } from '@/lib/site'
import { SectionHeader } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

/** Compact province discovery strip. Tall empty tiles read as unfinished. */
export function ProvinceHub({ locale, className }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <section className={className} aria-label={lang === 'ne' ? 'प्रदेश' : 'Provinces'}>
      <SectionHeader title={lang === 'ne' ? 'प्रदेश' : 'Provinces'} locale={locale} />
      <ul
        className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible lg:grid-cols-7"
        role="list"
      >
        {PROVINCES.map((p) => {
          const href = localizeHref(locale, `/province/${p.slug}`)
          const name = lang === 'ne' ? p.nameNe : p.nameEn
          return (
            <li key={p.slug} className="min-w-[7.5rem] shrink-0 sm:min-w-0">
              <Link
                href={href}
                className="group flex min-h-11 items-center justify-between gap-2 border border-rule bg-surface-raised px-3 py-2.5 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={lang}
              >
                <span className="font-display text-meta font-bold leading-snug text-ink group-hover:text-brand-strong sm:text-body">
                  {name}
                </span>
                <span className="text-caption font-semibold text-mute group-hover:text-brand-strong" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
