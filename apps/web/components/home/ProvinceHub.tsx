import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { PROVINCES } from '@/lib/site'
import { SectionHeader } from '@nagarikwatch/ui'
import { localizeHref } from '@/lib/i18n/locales'

/** Province discovery: typographic tiles (Civic Crimson system). No rainbow gradients. */
export function ProvinceHub({ locale, className }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <section className={className} aria-label={lang === 'ne' ? 'प्रदेश' : 'Provinces'}>
      <SectionHeader title={lang === 'ne' ? 'प्रदेश' : 'Provinces'} locale={locale} />
      <ul
        className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7 lg:gap-2"
        role="list"
      >
        {PROVINCES.map((p) => {
          const href = localizeHref(locale, `/province/${p.slug}`)
          const name = lang === 'ne' ? p.nameNe : p.nameEn
          return (
            <li key={p.slug}>
              <Link
                href={href}
                className="group flex min-h-[4.25rem] cursor-pointer flex-col justify-between border border-rule bg-surface-raised px-3 py-2.5 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                lang={lang}
              >
                <span className="font-display text-body-lg font-bold leading-snug text-ink group-hover:text-brand-strong">
                  {name}
                </span>
                <span className="mt-2 text-caption font-semibold text-mute group-hover:text-brand-strong" aria-hidden="true">
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
