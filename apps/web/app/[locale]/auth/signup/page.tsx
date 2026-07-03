import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { LogoMark } from '@/components/Logo'
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

  // The ekantipur-style benefit list — same four points as the admin login,
  // rendered compactly under the signup form so the value prop lands.
  const benefits = ne
    ? [
        'समाचार डाइजेस्ट: तपाईले पढ्न छुटाउनुभएका समाचारहरू',
        'संग्रहित समाचार: तपाईले संग्रह गर्नुभएको सामग्री',
        'प्रस्तावित समाचार: तपाईका रुचि अनुसारका कथा',
        'विविध: राशिफल, विनिमय दर, भ्याकेन्सी लगायत',
      ]
    : [
        'News digest: catch up on what you missed',
        'Saved stories: pick up where you left off',
        'Recommended: stories matched to your interests',
        'Utilities: horoscope, forex, vacancies and more',
      ]

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <a href={ne ? '/' : '/en'} className="flex items-center gap-2.5">
            <LogoMark title={`${dict.siteName} / Nagarik Watch`} className="h-11 w-11" />
            <div className="flex flex-col leading-none">
              <span className="font-display text-h1 font-extrabold text-ink" lang="ne">
                {dict.siteName}
              </span>
              <span className="mt-0.5 text-meta font-semibold uppercase tracking-[0.14em] text-mute" lang="en">
                Nagarik Watch
              </span>
            </div>
          </a>
          <h1 className="mt-8 font-display text-display leading-tight text-ink" lang={ne ? 'ne' : 'en'}>
            {ne ? 'खाता बनाउनुहोस्' : 'Create your account'}
          </h1>
          <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
            {ne ? 'निःशुल्क। कुनै क्रेडिट कार्ड आवश्यक छैन।' : 'Free. No credit card required.'}
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-6">
          <ReaderSignupForm locale={locale} />
        </div>

        <ul className="mt-6 space-y-1.5 rounded-md border border-rule bg-surface-raised p-4">
          <li className="text-meta font-semibold uppercase tracking-wide text-brand-strong" lang={ne ? 'ne' : 'en'}>
            {ne ? 'नागरिक वाचमा किन आवद्ध हुने?' : 'Why join Nagarik Watch?'}
          </li>
          {benefits.map((b) => (
            <li key={b} className="flex items-start gap-2 text-caption text-ink-soft" lang={ne ? 'ne' : 'en'}>
              <span className="mt-1 text-brand" aria-hidden="true">
                ✓
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
