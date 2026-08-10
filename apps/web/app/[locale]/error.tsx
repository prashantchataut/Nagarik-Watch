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
    <div className="mx-auto max-w-page px-4 py-8 sm:py-10" role="alert" lang={en ? 'en' : 'ne'}>
      <p className="text-meta font-extrabold text-brand-strong">{en ? 'Error' : 'त्रुटि'}</p>
      <h1 className="mt-1.5 font-display text-[clamp(1.5rem,3.5vw,2.1rem)] font-extrabold text-ink">
        {en ? 'Something went wrong' : 'केही गडबड भयो'}
      </h1>
      <span className="mt-1.5 block h-0.5 w-10 bg-brand" aria-hidden="true" />
      <p className="mt-3 max-w-body text-body text-ink-soft">
        {en
          ? 'This page could not be loaded. Try again, or return home.'
          : 'यो पृष्ठ लोड हुन सकेन। फेरि प्रयास गर्नुहोस्, वा गृहपृष्ठमा फर्कनुहोस्।'}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-10 items-center rounded-md bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
        >
          {en ? 'Try again' : 'फेरि प्रयास'}
        </button>
        <Link
          href={localizeHref(locale, '/')}
          className="inline-flex min-h-10 items-center text-meta font-semibold text-brand-strong underline-offset-2 hover:underline"
        >
          {en ? 'Home' : 'गृहपृष्ठ'}
        </Link>
      </div>
    </div>
  )
}
