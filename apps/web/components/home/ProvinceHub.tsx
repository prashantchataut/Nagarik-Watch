import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { SectionHeader } from '@nagarikwatch/ui'
import { PROVINCES } from '@/lib/site'
import { localizeHref } from '@/lib/i18n/locales'

const NE_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९']

function localizeIndex(index: number, locale: Locale): string {
  if (locale !== 'ne') return String(index)
  return String(index).replace(/[0-9]/g, (digit) => NE_DIGITS[Number(digit)] ?? digit)
}

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
        <ul className="flex min-w-max items-stretch sm:min-w-0 sm:grid sm:grid-cols-4 lg:grid-cols-7">
          {PROVINCES.map((province, index) => (
            <li key={province.slug} className={index > 0 ? 'border-l border-rule' : ''}>
              <Link
                href={localizeHref(locale, `/province/${province.slug}`)}
                className="group flex min-h-11 min-w-[8.5rem] items-center gap-2.5 px-3 py-2.5 transition-colors duration-fast ease-out-quint hover:bg-brand-tint focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:min-w-0"
                lang={lang}
              >
                <span
                  className="w-4 shrink-0 text-caption font-bold tabular-nums text-mute transition-colors duration-fast ease-out-quint group-hover:text-brand-strong"
                  aria-hidden="true"
                >
                  {localizeIndex(index + 1, locale)}
                </span>
                <span className="font-display text-meta font-bold text-ink transition-colors duration-fast ease-out-quint group-hover:text-brand-strong sm:text-body">
                  {english ? province.nameEn : province.nameNe}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  )
}
