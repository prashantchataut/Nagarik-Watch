import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistLoginForm } from '@/components/journalist/JournalistLoginForm'

export const metadata: Metadata = {
  title: 'Journalist Login',
  robots: { index: false, follow: false },
}

type Params = { locale: string }

export default async function JournalistLoginPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'

  return (
    <main className="min-h-screen bg-surface px-4 py-10">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_26rem] lg:items-center">
        <section className="rounded-2xl border border-rule bg-surface-raised p-8 shadow-card">
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
          <p className="mt-8 text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={ne ? 'ne' : 'en'}>
            {ne ? 'पत्रकार प्रवेश' : 'Journalist desk'}
          </p>
          <h1 className="mt-2 font-display text-display leading-tight text-ink" lang={ne ? 'ne' : 'en'}>
            {ne ? 'लेख तयार पार्ने सरल ठाउँ।' : 'A focused writing desk, separate from admin.'}
          </h1>
          <p className="mt-4 max-w-body text-body-lg text-ink-soft" lang={ne ? 'ne' : 'en'}>
            {ne
              ? 'पत्रकार, योगदानकर्ता र सम्पादकीय सहयोगीले यहाँबाट आफ्ना ड्राफ्ट लेख्छन्, पेश गर्छन् र प्रोफाइल हेर्छन्। प्रणाली सेटिङ र प्रयोगकर्ता व्यवस्थापन admin panel मै रहन्छ।'
              : 'Journalists, contributors and editorial staff write drafts, submit stories and check their profile here. System settings and user management remain in the admin panel.'}
          </p>
          <Link href={localizeHref(locale, '/login')} className="mt-6 inline-flex text-meta font-semibold text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline">
            {ne ? 'पाठक लगइन चाहिएको हो?' : 'Looking for reader login?'}
          </Link>
        </section>
        <section className="rounded-2xl border border-rule bg-surface-raised p-6 shadow-card">
          <h2 className="font-display text-h1 text-ink" lang={ne ? 'ne' : 'en'}>
            {ne ? 'साइन इन' : 'Sign in'}
          </h2>
          <p className="mt-1 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
            {ne ? 'पत्रकार वा योगदानकर्ता भूमिका भएको खाता प्रयोग गर्नुहोस्।' : 'Use an account with journalist or contributor access.'}
          </p>
          <div className="mt-6">
            <JournalistLoginForm locale={locale} />
          </div>
        </section>
      </div>
    </main>
  )
}
