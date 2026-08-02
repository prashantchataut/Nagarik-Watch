import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const UTILITY_LINKS = [
  {
    path: '/utilities/calendar',
    ne: 'नेपाली पात्रो',
    en: 'Nepali calendar',
    noteNe: 'पर्व, बिदा र बि.सं. महिना',
    noteEn: 'BS months, festivals and holidays',
  },
  {
    path: '/utilities/date-converter',
    ne: 'मिति रूपान्तरण',
    en: 'Date converter',
    noteNe: 'बि.सं. र इस्वी संवत्',
    noteEn: 'Bikram Sambat and Gregorian',
  },
  {
    path: '/utilities/preeti-unicode',
    ne: 'प्रिती युनिकोड',
    en: 'Preeti Unicode',
    noteNe: 'पुरानो फन्टबाट युनिकोड',
    noteEn: 'Legacy font to Unicode',
  },
  {
    path: '/utilities/currency',
    ne: 'मुद्रा रूपान्तरण',
    en: 'Currency converter',
    noteNe: 'NPR र प्रमुख मुद्राहरू',
    noteEn: 'NPR and major currencies',
  },
  {
    path: '/utilities/age-calculator',
    ne: 'उमेर क्याल्कुलेटर',
    en: 'Age calculator',
    noteNe: 'वर्ष, महिना र दिन',
    noteEn: 'Years, months and days',
  },
  {
    path: '/utilities/unit-converter',
    ne: 'एकाइ रूपान्तरण',
    en: 'Unit converter',
    noteNe: 'लम्बाइ, तौल र तापक्रम',
    noteEn: 'Length, weight and temperature',
  },
] as const

export function UtilityPageShell({
  locale,
  title,
  description,
  currentPath,
  children,
}: {
  locale: Locale
  title: string
  /** @deprecated unused; kept for call-site compatibility */
  eyebrow?: string
  description: string
  currentPath?: string
  children: ReactNode
}) {
  const en = locale === 'en'
  const showToolNav = Boolean(currentPath)

  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader title={title} lead={description} lang={en ? 'en' : 'ne'} />
      {showToolNav ? (
        <div className="utility-workspace">
          <nav aria-label={en ? 'Utility tools' : 'उपयोगी उपकरण'} className="utility-mobile-nav">
            {UTILITY_LINKS.map((item) => {
              const active = currentPath === item.path
              return (
                <Link
                  key={item.path}
                  href={localizeHref(locale, item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={active ? 'is-active' : undefined}
                >
                  {en ? item.en : item.ne}
                </Link>
              )
            })}
          </nav>
          <aside>
            <nav aria-label={en ? 'Utility tools' : 'उपयोगी उपकरण'} className="utility-sidebar">
              <h2>{en ? 'Tools' : 'उपकरण'}</h2>
              <ul>
                {UTILITY_LINKS.map((item) => {
                  const active = currentPath === item.path
                  return (
                    <li key={item.path}>
                      <Link
                        href={localizeHref(locale, item.path)}
                        aria-current={active ? 'page' : undefined}
                        className={active ? 'is-active' : undefined}
                      >
                        <strong>{en ? item.en : item.ne}</strong>
                        <span>{en ? item.noteEn : item.noteNe}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      ) : (
        <div className="mt-8">{children}</div>
      )}
    </div>
  )
}

export function UtilityDirectory({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  return (
    <div className="mt-8">
      <p className="border border-rule bg-surface-raised px-4 py-3 text-meta leading-relaxed text-ink-soft">
        {en
          ? 'Tools run in your browser. Currency rates fetch live NRB reference when you open that tool.'
          : 'उपकरणहरू ब्राउजरमै चल्छन्। मुद्रा दर खोल्दा नेरा सन्दर्भ लाइभ लिइन्छ।'}
      </p>

      <ul className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {UTILITY_LINKS.map((item) => (
          <li key={item.path}>
            <Link
              href={localizeHref(locale, item.path)}
              className="group flex h-full flex-col border border-rule bg-surface-raised px-4 py-3.5 transition-colors duration-fast ease-out-quint hover:border-brand hover:bg-brand-tint/30"
            >
              <h2 className="font-display text-body-lg font-extrabold text-ink group-hover:text-brand-strong sm:text-h3">
                {en ? item.en : item.ne}
              </h2>
              <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden />
              <p className="mt-2 text-meta leading-relaxed text-ink-soft">
                {en ? item.noteEn : item.noteNe}
              </p>
              <span className="mt-auto pt-3 text-caption font-bold text-brand-strong">
                {en ? 'Open tool' : 'खोल्नुहोस्'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
