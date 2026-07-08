import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { Logo } from '@/components/Logo'
import { ReaderSignupForm } from '@/components/reader/ReaderSignupForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a Nagarik Watch reader account.',
  robots: { index: false, follow: false },
}

export default async function ReaderSignupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const ne = locale === 'ne'
  const lang = ne ? 'ne' : 'en'
  const benefits = ne
    ? ['समाचार संग्रह', 'पढाइ इतिहास', 'रुचि अनुसारका सुझाव', 'दैनिक उपयोगी सेवामा छिटो पहुँच']
    : [
        'Saved stories',
        'Reading history',
        'Interest-based picks',
        'Quick access to daily utilities',
      ]

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid min-h-screen max-w-page lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-rule bg-surface-raised px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <Link
            href={localizeHref(locale, '/')}
            className="inline-flex w-fit rounded-md"
            aria-label={dict.siteName}
          >
            <Logo siteName={dict.siteName} />
          </Link>
          <div className="max-w-md">
            <p
              className="text-meta font-bold uppercase tracking-wide text-brand-strong"
              lang={lang}
            >
              {ne ? 'निःशुल्क पाठक खाता' : 'Free reader account'}
            </p>
            <h1
              className="mt-4 font-display text-[3rem] font-extrabold leading-[1.05] text-ink"
              lang={lang}
            >
              {ne
                ? 'पढ्न बाँकी समाचार सुरक्षित राख्नुहोस्।'
                : 'Save the stories you want to finish.'}
            </h1>
            <ul className="mt-6 grid gap-2 text-body text-ink-soft" lang={lang}>
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-caption text-mute" lang={lang}>
            {ne
              ? 'कुनै पेवाल छैन। खाता केवल सुविधा र सम्झनाका लागि।'
              : 'No paywall. The account is for convenience and memory.'}
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            <Link
              href={localizeHref(locale, '/')}
              className="mx-auto mb-8 flex w-fit rounded-md lg:hidden"
              aria-label={dict.siteName}
            >
              <Logo siteName={dict.siteName} />
            </Link>
            <div>
              <p
                className="text-meta font-bold uppercase tracking-wide text-brand-strong"
                lang={lang}
              >
                {ne ? 'खाता बनाउनुहोस्' : 'Create account'}
              </p>
              <h2
                className="mt-2 font-display text-h1 font-extrabold leading-tight text-ink"
                lang={lang}
              >
                {ne ? 'पाठक सुविधा सुरु गर्नुहोस्' : 'Start reader tools'}
              </h2>
              <p className="mt-2 text-body text-ink-soft" lang={lang}>
                {ne
                  ? 'निःशुल्क। पेवाल होइन। विज्ञापन र सामग्री पढ्न खाता चाहिँदैन।'
                  : 'Free. Not a paywall. Reading the news does not require an account.'}
              </p>
            </div>

            <div className="mt-7 rounded-lg border border-rule bg-surface-raised p-5 shadow-card sm:p-6">
              <ReaderSignupForm locale={locale} />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
