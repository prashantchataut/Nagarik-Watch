import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
import { PROVINCES } from '@/lib/site'
import { localizeHref } from '@/lib/i18n/locales'

export function ProvinceHub({ locale, className }: { locale: Locale; className?: string }) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <section className={className} aria-labelledby="home-provinces-title">
      <SectionHeader
        id="home-provinces-title"
        title={english ? 'Across Nepal' : 'प्रदेशबाट'}
        locale={locale}
        href={localizeHref(locale, '/province')}
        moreLabel={english ? 'All provinces' : 'सबै प्रदेश'}
      />
      <nav
        aria-label={english ? 'Province news' : 'प्रदेश समाचार'}
        className="mt-3 overflow-x-auto border-y border-rule [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <ul className="flex min-w-max items-center sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-7">
          {PROVINCES.map((province, index) => (
            <li
              key={province.slug}
              className={index > 0 ? 'border-l border-rule' : ''}
            >
              <Link
                href={localizeHref(locale, `/province/${province.slug}`)}
                className="flex min-h-11 min-w-[8rem] items-center justify-between gap-3 px-3 py-2.5 font-display text-meta font-bold text-ink transition-colors duration-fast ease-out-quint hover:bg-brand-tint hover:text-brand-strong sm:min-w-0 sm:text-body"
                lang={lang}
              >
                <span>{english ? province.nameEn : province.nameNe}</span>
                <span className="text-mute" aria-hidden="true">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
