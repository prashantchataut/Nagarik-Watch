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
  eyebrow,
  description,
  currentPath,
  children,
}: {
  locale: Locale
  title: string
  eyebrow: string
  description: string
  currentPath?: string
  children: ReactNode
}) {
  const en = locale === 'en'
  return (
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12">
      <HubIndexHeader kicker={eyebrow} title={title} lead={description} lang={en ? 'en' : 'ne'} />
      <div className="utility-workspace mt-8">
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
    </div>
  )
}

export function UtilityDirectory({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  return (
    <div className="utility-directory">
      {UTILITY_LINKS.map((item, index) => (
        <article key={item.path}>
          <p className="utility-index">{String(index + 1).padStart(2, '0')}</p>
          <div>
            <h2>
              <Link href={localizeHref(locale, item.path)}>{en ? item.en : item.ne}</Link>
            </h2>
            <p>{en ? item.noteEn : item.noteNe}</p>
          </div>
          <span aria-hidden="true">→</span>
        </article>
      ))}
    </div>
  )
}
