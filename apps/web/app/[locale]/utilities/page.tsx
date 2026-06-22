import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { UtilityWidgetRail } from '@/components/live/LiveWidgets'
import { UtilityTools } from '@/components/utilities/UtilityTools'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

const utilityGroups = [
  {
    titleEn: 'Live data',
    titleNe: 'लाइभ डाटा',
    itemsEn: [
      'Weather by city',
      'AQI by city',
      'Forex rates',
      'Gold and silver',
      'NEPSE dashboard',
    ],
    itemsNe: ['शहरअनुसार मौसम', 'शहरअनुसार AQI', 'विदेशी मुद्रा', 'सुनचाँदी', 'NEPSE ड्यासबोर्ड'],
  },
  {
    titleEn: 'Results and public records',
    titleNe: 'नतिजा र सार्वजनिक अभिलेख',
    itemsEn: [
      'SEE results',
      'Grade XII results',
      'Election results',
      'Public notices',
      'Archive by Nepali date',
    ],
    itemsNe: [
      'SEE नतिजा',
      'कक्षा १२ नतिजा',
      'निर्वाचन नतिजा',
      'सार्वजनिक सूचना',
      'नेपाली मितिबाट अभिलेख',
    ],
  },
  {
    titleEn: 'Calculators and converters',
    titleNe: 'क्याल्कुलेटर र कनभर्टर',
    itemsEn: [
      'AD to BS',
      'BS to AD',
      'Preeti to Unicode',
      'Nepali typing helper',
      'Age calculator',
    ],
    itemsNe: ['AD बाट BS', 'BS बाट AD', 'Preeti बाट Unicode', 'नेपाली टाइपिङ', 'उमेर क्याल्कुलेटर'],
  },
  {
    titleEn: 'Sports and civic hubs',
    titleNe: 'खेलकुद र नागरिक हब',
    itemsEn: [
      'Cricket scorecards',
      'Football fixtures',
      'Festival calendar',
      'Holiday calendar',
      'Trending topics',
    ],
    itemsNe: [
      'क्रिकेट स्कोरकार्ड',
      'फुटबल फिक्स्चर',
      'चाडपर्व पात्रो',
      'बिदा पात्रो',
      'ट्रेन्डिङ विषय',
    ],
  },
]

export default async function UtilitiesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  return (
    <div className="mx-auto max-w-page px-4 py-8" lang={lang}>
      <header className="border-b border-rule pb-6">
        <p className="text-meta font-semibold uppercase tracking-wide text-brand-strong">
          {locale === 'en' ? 'Utility Portal' : 'उपयोगी सेवा'}
        </p>
        <h1 className="mt-1 font-display text-display text-ink">
          {locale === 'en' ? 'Daily tools for Nepali readers' : 'नेपाली पाठकका दैनिक उपकरण'}
        </h1>
        <p className="mt-3 max-w-body text-body-lg text-ink-soft">
          {locale === 'en'
            ? 'A production entry point for calendar, results, market, weather, typing and converter utilities. Provider-backed widgets show demo labels until credentials are added.'
            : 'पात्रो, नतिजा, बजार, मौसम, टाइपिङ र कनभर्टरका लागि उत्पादन प्रवेश बिन्दु। प्रदायक नजोडिएसम्म विजेटले नमुना लेबल देखाउँछ।'}
        </p>
      </header>

      <div className="mt-8">
        <UtilityWidgetRail />
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {utilityGroups.map((group) => (
          <div key={group.titleEn} className="rounded-lg border border-rule bg-surface-raised p-5">
            <h2 className="font-display text-h2 text-ink">
              {locale === 'en' ? group.titleEn : group.titleNe}
            </h2>
            <ul className="mt-4 grid gap-2 text-body text-ink-soft">
              {(locale === 'en' ? group.itemsEn : group.itemsNe).map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-brand" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <UtilityTools locale={locale} />
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Utilities' : 'उपयोगी सेवा',
    alternates: { canonical: localizeHref(locale, '/utilities') },
  }
}
