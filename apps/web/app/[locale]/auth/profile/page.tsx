import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { redirect } from 'next/navigation'
import { asLocale } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getSession } from '@/lib/auth/session'
import { ReaderProfileCard } from '@/components/reader/ReaderProfileCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'Your Nagarik Watch reader profile.',
  robots: { index: false, follow: false },
}

export default async function ReaderProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const session = await getSession()

  if (!session) {
    redirect(locale === 'en' ? '/en/auth/login' : '/auth/login')
  }

  return (
    <div className="mx-auto max-w-body px-4 py-10">
      <h1 className="font-display text-display text-ink" lang={locale === 'en' ? 'en' : 'ne'}>
        {locale === 'en' ? 'Your profile' : 'तपाईंको प्रोफाइल'}
      </h1>
      <p className="mt-2 text-body text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
        {locale === 'en'
          ? 'Manage your reader account, bookmarks, and reading history.'
          : 'तपाईंको पाठक खाता, संग्रह र पढ्ने इतिहास व्यवस्थापन गर्नुहोस्।'}
      </p>

      <div className="mt-8">
        <ReaderProfileCard session={session} locale={locale} />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <a
          href={locale === 'en' ? '/en/saved' : '/saved'}
          className="rounded-lg border border-rule bg-surface-raised p-5 transition-shadow duration-fast ease-out-quint hover:shadow-card"
        >
          <p className="font-display text-h2 text-ink" lang={locale === 'en' ? 'en' : 'ne'}>
            {dict.navSaved}
          </p>
          <p className="mt-1 text-body text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
            {locale === 'en' ? 'Stories you saved to read later.' : 'पछि पढ्न संग्रह गरेका समाचार।'}
          </p>
        </a>
        <a
          href={locale === 'en' ? '/en/latest' : '/latest'}
          className="rounded-lg border border-rule bg-surface-raised p-5 transition-shadow duration-fast ease-out-quint hover:shadow-card"
        >
          <p className="font-display text-h2 text-ink" lang={locale === 'en' ? 'en' : 'ne'}>
            {locale === 'en' ? 'Continue reading' : 'पढ्न जारी'}
          </p>
          <p className="mt-1 text-body text-ink-soft" lang={locale === 'en' ? 'en' : 'ne'}>
            {locale === 'en' ? 'Pick up where you left off.' : 'छाडेको ठाउँबाट पढ्न जारी राख्नुहोस्।'}
          </p>
        </a>
      </div>
    </div>
  )
}
