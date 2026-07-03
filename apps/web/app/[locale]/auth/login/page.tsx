import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { LogoMark } from '@/components/Logo'
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
            {ne ? 'पाठक लगइन' : 'Reader login'}
          </h1>
          <p className="mt-2 text-body text-ink-soft" lang={ne ? 'ne' : 'en'}>
            {ne
              ? 'संग्रहित समाचार, पढ्न जारी र प्रस्तावित सामग्रीका लागि लगइन गर्नुहोस्।'
              : 'Sign in for saved stories, continue reading, and personalized picks.'}
          </p>
        </div>

        <div className="rounded-lg border border-rule bg-surface-raised p-6">
          <ReaderLoginForm locale={locale} />
        </div>

        <p className="mt-6 text-center text-caption text-mute" lang={ne ? 'ne' : 'en'}>
          {ne
            ? 'न्युजरुमका लागि छुट्टै लगइन छ।'
            : 'Newsroom staff have a separate login.'}{' '}
          <a href="/admin/login" className="font-semibold text-brand underline-offset-2 hover:underline">
            {ne ? 'न्युजरुम लगइन' : 'Newsroom login'}
          </a>
        </p>
      </div>
    </main>
  )
}
