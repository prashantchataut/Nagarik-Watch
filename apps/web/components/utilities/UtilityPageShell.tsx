import Link from 'next/link'
import type { ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const UTILITY_LINKS = [
  { path: '/patro', ne: 'नेपाली पात्रो', en: 'Nepali calendar', noteNe: 'पर्व, बिदा र बि.सं. महिना', noteEn: 'BS months, festivals and holidays' },
  { path: '/utilities/date-converter', ne: 'मिति रूपान्तरण', en: 'Date converter', noteNe: 'बि.सं. र इस्वी संवत्', noteEn: 'Bikram Sambat and Gregorian' },
  { path: '/preeti-unicode', ne: 'प्रिती युनिकोड', en: 'Preeti Unicode', noteNe: 'पुरानो फन्टबाट युनिकोड', noteEn: 'Legacy font to Unicode' },
  { path: '/market', ne: 'सेयर बजार र सुनचाँदी', en: 'Markets & Gold', noteNe: 'NEPSE, सुनचाँदी र विनिमय दर', noteEn: 'NEPSE, Bullion and Forex' },
  { path: '/rashifal', ne: 'दैनिक राशिफल', en: 'Daily Horoscope', noteNe: '१२ राशिको दैनिक भविष्यवाणी', noteEn: '12-Zodiac sign forecasts' },
  { path: '/utilities/currency', ne: 'मुद्रा रूपान्तरण', en: 'Currency converter', noteNe: 'NPR र प्रमुख मुद्राहरू', noteEn: 'NPR and major currencies' },
  { path: '/utilities/age-calculator', ne: 'उमेर क्याल्कुलेटर', en: 'Age calculator', noteNe: 'वर्ष, महिना र दिन', noteEn: 'Years, months and days' },
  { path: '/utilities/unit-converter', ne: 'एकाइ रूपान्तरण', en: 'Unit converter', noteNe: 'लम्बाइ, तौल र तापक्रम', noteEn: 'Length, weight and temperature' },
] as const

export function UtilityPageShell({
  locale,
  title,
  description,
  currentPath,
  children,
}: {
  locale: Locale
  eyebrow?: string
  title: string
  description: string
  currentPath?: string
  children: ReactNode
}) {
  const en = locale === 'en'

  return (
    <div className="mx-auto max-w-page px-4 py-9 sm:py-14">
      <HubIndexHeader
        title={title}
        lead={description}
        lang={en ? 'en' : 'ne'}
        kicker={en ? 'Reader utilities' : 'पाठक उपयोगी सेवा'}
      />
      {currentPath ? (
        <nav
          aria-label={en ? 'Utility tools' : 'उपयोगी उपकरण'}
          className="utility-tool-rail mt-6 flex gap-2 overflow-x-auto border-b border-rule pb-3 sm:mt-8"
        >
          {UTILITY_LINKS.map((item) => {
            const active = currentPath === item.path
            return (
              <Link
                key={item.path}
                href={localizeHref(locale, item.path)}
                aria-current={active ? 'page' : undefined}
                className={active ? 'is-active' : undefined}
              >
                <strong>{en ? item.en : item.ne}</strong>
                <span>{en ? item.noteEn : item.noteNe}</span>
              </Link>
            )
          })}
        </nav>
      ) : null}
      <div className={currentPath ? 'mt-7 min-w-0 sm:mt-9' : 'mt-8'}>{children}</div>
    </div>
  )
}

export function UtilityDirectory({ locale }: { locale: Locale }) {
  const en = locale === 'en'
  return (
    <div className="mt-7">
      <p className="mx-auto max-w-[68ch] text-center text-body leading-[1.7] text-ink-soft">
        {en
          ? 'Most tools run locally in your browser. Live rates and market references show their source and freshness when data is available.'
          : 'धेरै उपकरण ब्राउजरमै चल्छन्। लाइभ दर र बजार सन्दर्भ उपलब्ध हुँदा स्रोत र अद्यावधिक समय स्पष्ट देखाइन्छ।'}
      </p>

      <ul className="utility-directory mt-7 grid gap-x-8 sm:grid-cols-2">
        {UTILITY_LINKS.map((item, index) => (
          <li key={item.path} className="min-w-0">
            <Link href={localizeHref(locale, item.path)} className="group">
              <span className="font-sans text-caption font-bold tabular-nums text-brand-strong" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <strong className="block font-display text-body-lg font-extrabold leading-tight text-ink transition-colors group-hover:text-brand-strong">
                  {en ? item.en : item.ne}
                </strong>
                <span className="mt-1 block text-meta leading-relaxed text-ink-soft">{en ? item.noteEn : item.noteNe}</span>
              </span>
              <span className="text-body font-black text-brand-strong" aria-hidden="true">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
