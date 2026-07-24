'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const locale = asLocale(typeof params?.locale === 'string' ? params.locale : 'ne')
  const en = locale === 'en'
  void error

  return (
    <div className="mx-auto max-w-page px-4 py-16" role="alert" lang={en ? 'en' : 'ne'}>
      <h1 className="font-display text-h1 text-ink">
        {en ? 'Something went wrong' : 'केही गडबड भयो'}
      </h1>
      <p className="mt-3 max-w-body text-body text-ink-soft">
        {en
          ? 'This page could not be loaded. Try again, or return home.'
          : 'यो पृष्ठ लोड हुन सकेन। फेरि प्रयास गर्नुहोस्, वा गृहपृष्ठमा फर्कनुहोस्।'}
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center bg-brand px-4 text-meta font-bold text-surface hover:bg-brand-strong"
        >
          {en ? 'Try again' : 'फेरि प्रयास'}
        </button>
        <Link
          href={localizeHref(locale, '/')}
          className="inline-flex min-h-10 items-center text-meta font-semibold text-brand-strong"
        >
          {en ? 'Home' : 'गृहपृष्ठ'}
        </Link>
      </div>
    </div>
  )
}
