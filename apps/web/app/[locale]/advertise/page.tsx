import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { AdSlot } from '@/components/AdSlot'
import { AD_PLACEMENTS } from '@/lib/ads'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import Link from 'next/link'

function adSalesEmail(): string {
  const configured = process.env.NEXT_PUBLIC_AD_SALES_EMAIL?.trim()
  if (configured && configured.includes('@')) return configured
  return 'ads@nagarikwatch.com'
}

export default async function AdvertisePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'
  const placements = Object.values(AD_PLACEMENTS)
  const salesEmail = adSalesEmail()
  const featured = placements.filter((p) =>
    ['home-top', 'home-billboard', 'article-sidebar-sticky', 'mobile-sticky'].includes(p.key),
  )

  return (
    <div className="mx-auto max-w-page px-4 py-10" lang={lang}>
      <header className="border-b border-rule pb-8">
        <h1 className="font-display text-h1 text-ink sm:text-display">
          {en ? 'Advertise with Nagarik Watch' : 'नागरिक वाचमा विज्ञापन'}
        </h1>
        <p className="mt-4 max-w-body text-body-lg leading-relaxed text-ink-soft">
          {en
            ? 'Commercial campaigns stay separate from editorial work. Every ad and sponsored package is labelled before readers see it.'
            : 'व्यावसायिक अभियान सम्पादकीय कामबाट अलग रहन्छ। हरेक विज्ञापन र प्रायोजित सामग्री पाठकले देख्नुअघि लेबल हुन्छ।'}
        </p>
        <p className="mt-4 text-body text-ink">
          <a href={`mailto:${salesEmail}`} className="font-semibold text-brand-strong">
            {salesEmail}
          </a>
          <span className="text-ink-soft">
            {en
              ? ' · Send dates, target surface, creative size and billing details.'
              : ' · अभियान मिति, लक्षित सतह, रचना आकार र बिलिङ विवरण पठाउनुहोस्।'}
          </span>
        </p>
      </header>

      <section className="mt-10 border-y border-rule py-8" aria-label={en ? 'Principles' : 'नियम'}>
        <h2 className="font-display text-h2 text-ink">{en ? 'How we sell' : 'हामी कसरी बेच्छौं'}</h2>
        <ul className="mt-4 max-w-body space-y-4 text-body text-ink-soft">
          <li>
            <strong className="text-ink">{en ? 'Clear labels. ' : 'स्पष्ट लेबल। '}</strong>
            {en
              ? 'Advertisement and sponsored units are never disguised as newsroom copy.'
              : 'विज्ञापन र प्रायोजित सामग्री न्यूजरुम सामग्री जस्तो लुकाइँदैन।'}
          </li>
          <li>
            <strong className="text-ink">{en ? 'Reserved sizes. ' : 'सुरक्षित आकार। '}</strong>
            {en
              ? 'Slots reserve width and height before campaigns load, reducing layout shift.'
              : 'अभियान लोड हुनुअघि स्लटको चौडाइ र उचाइ सुरक्षित हुन्छ।'}
          </li>
          <li>
            <strong className="text-ink">{en ? 'Shared keys. ' : 'साझा कुञ्जी। '}</strong>
            {en
              ? 'Sales and delivery use the same placement keys for reporting.'
              : 'बिक्री र डेलिभरीले रिपोर्टिङका लागि एउटै प्लेसमेन्ट कुञ्जी प्रयोग गर्छन्।'}
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-h2 text-ink">
          {en ? 'Featured placements' : 'मुख्य प्लेसमेन्ट'}
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[36rem] border-collapse text-left text-meta">
            <thead>
              <tr className="border-b border-ink">
                <th className="py-3 pr-4 font-semibold text-ink">
                  {en ? 'Surface' : 'सतह'}
                </th>
                <th className="py-3 pr-4 font-semibold text-ink">{en ? 'Size' : 'आकार'}</th>
                <th className="py-3 font-semibold text-ink">{en ? 'Notes' : 'नोट'}</th>
              </tr>
            </thead>
            <tbody>
              {featured.map((p) => (
                <tr key={p.key} className="border-b border-rule">
                  <td className="py-3 pr-4 text-ink">{en ? p.label : p.descriptionNe.split('।')[0] || p.label}</td>
                  <td className="py-3 pr-4 tabular-nums text-ink-soft">
                    {p.width}×{p.height}
                  </td>
                  <td className="py-3 text-ink-soft">
                    {en ? p.descriptionEn : p.descriptionNe}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-12 border-t border-rule pt-8">
        <h2 className="font-display text-h2 text-ink">{en ? 'Sample slot' : 'नमूना स्लट'}</h2>
        <div className="mt-4">
          <AdSlot locale={locale} placementKey="home-billboard" variant="billboard" />
        </div>
        <p className="mt-6">
          <Link href={localizeHref(locale, '/contact')} className="font-semibold text-brand-strong">
            {en ? 'Contact the newsroom →' : 'न्यूजरुमलाई सम्पर्क गर्नुहोस् →'}
          </Link>
        </p>
      </section>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Advertise' : 'विज्ञापन',
    alternates: { canonical: localizeHref(locale, '/advertise') },
  }
}
