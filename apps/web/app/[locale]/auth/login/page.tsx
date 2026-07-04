import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { Logo } from '@/components/Logo'
import { ReaderLoginForm } from '@/components/reader/ReaderLoginForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reader Login',
  description: 'Sign in to your Nagarik Watch reader account.',
  robots: { index: false, follow: false },
}

export default async function ReaderLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const ne = locale === 'ne'
  const lang = ne ? 'ne' : 'en'

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto grid min-h-screen max-w-page lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden border-r border-rule bg-surface-raised px-8 py-10 lg:flex lg:flex-col lg:justify-between">
          <Link href={localizeHref(locale, '/')} className="inline-flex w-fit rounded-md" aria-label={dict.siteName}>
            <Logo siteName={dict.siteName} />
          </Link>
          <div className="max-w-md">
            <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang={lang}>
              {ne ? 'पाठक खाता' : 'Reader account'}
            </p>
            <h1 className="mt-4 font-display text-[3rem] font-extrabold leading-[1.05] text-ink" lang={lang}>
              {ne ? 'समाचार पढ्ने ठाउँलाई आफ्नै बनाउनुहोस्।' : 'Make the reading desk yours.'}
            </h1>
            <p className="mt-5 text-body-lg leading-relaxed text-ink-soft" lang={lang}>
              {ne
                ? 'संग्रहित समाचार, पढाइ इतिहास र पछि फर्केर आउने सामग्रीका लागि पाठक लगइन प्रयोग हुन्छ। सम्पादकीय न्युजरुम लगइन यसबाट अलग छ।'
                : 'Use reader login for saved stories, reading history, and return-to-read flows. Staff newsroom access is separate.'}
            </p>
          </div>
          <p className="text-caption text-mute" lang={lang}>
            {ne ? 'नागरिक वाच, नागरिककेन्द्रित पत्रकारिता।' : 'Nagarik Watch, civic-first journalism.'}
          </p>
        </section>

        <section className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-md">
            <Link href={localizeHref(locale, '/')} className="mx-auto mb-8 flex w-fit rounded-md lg:hidden" aria-label={dict.siteName}>
              <Logo siteName={dict.siteName} />
            </Link>
            <div>
              <p className="text-meta font-bold uppercase tracking-wide text-brand-strong" lang={lang}>
                {ne ? 'पाठक लगइन' : 'Reader login'}
              </p>
              <h2 className="mt-2 font-display text-h1 font-extrabold leading-tight text-ink" lang={lang}>
                {ne ? 'फर्केर पढ्न सजिलो बनाउनुहोस्' : 'Return to what matters'}
              </h2>
              <p className="mt-2 text-body text-ink-soft" lang={lang}>
                {ne
                  ? 'यो पाठकका लागि हो। न्युजरुम प्रवेश केवल सम्पादकीय कर्मचारीका लागि हो।'
                  : 'This is for readers. Newsroom entry is only for editorial staff.'}
              </p>
            </div>

            <div className="mt-7 rounded-lg border border-rule bg-surface-raised p-5 shadow-card sm:p-6">
              <ReaderLoginForm locale={locale} />
            </div>

            <p className="mt-5 text-center text-caption text-mute" lang={lang}>
              {ne ? 'सम्पादकीय कर्मचारी?' : 'Editorial staff?'}{' '}
              <a href="/admin/login" className="font-semibold text-ink-soft underline-offset-2 hover:text-brand-strong hover:underline">
                {ne ? 'स्टाफ लगइन' : 'Staff login'}
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
