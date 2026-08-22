'use client'

import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { localizeHref } from '@/lib/i18n/locales'

export function PublicErrorState({
  locale,
  code,
  title,
  body,
  onRetry,
  showSearch = false,
}: {
  locale: Locale
  code: string
  title: string
  body: string
  onRetry?: () => void
  showSearch?: boolean
}) {
  const en = locale === 'en'
  const lang = en ? 'en' : 'ne'

  return (
    <main className="mx-auto grid min-h-[62vh] max-w-page content-center px-3 py-10 sm:px-4 sm:py-14" lang={lang}>
      <div className="grid gap-7 border-y border-rule py-8 lg:grid-cols-[10rem_minmax(0,1fr)] lg:items-start lg:gap-10 lg:py-10">
        <p className="font-sans text-[clamp(3.5rem,9vw,7rem)] font-black leading-none tabular-nums text-brand-strong" aria-hidden="true">
          {code}
        </p>
        <div className="max-w-2xl">
          <p className="text-caption font-extrabold text-brand-strong">{en ? 'Nagarik Watch' : 'नागरिक वाच'}</p>
          <h1 className="mt-2 text-pretty font-display text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.1] text-ink">
            {title}
          </h1>
          <p className="mt-3 max-w-[55ch] text-body leading-relaxed text-ink-soft">{body}</p>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex min-h-11 items-center bg-brand px-4 text-meta font-extrabold text-paper transition-colors hover:bg-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {en ? 'Try again' : 'फेरि प्रयास'}
              </button>
            ) : null}
            <Link
              href={localizeHref(locale, '/')}
              className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-bold text-ink transition-colors hover:border-brand hover:text-brand-strong focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {en ? 'Go home' : 'गृहपृष्ठ'}
            </Link>
            <Link
              href={localizeHref(locale, '/latest')}
              className="inline-flex min-h-11 items-center px-2 text-meta font-bold text-brand-strong hover:underline"
            >
              {en ? 'Latest news' : 'ताजा समाचार'}
            </Link>
          </div>

          {showSearch ? (
            <form action={localizeHref(locale, '/search')} className="mt-7 flex w-full max-w-xl border border-rule bg-surface">
              <label htmlFor="recovery-search" className="sr-only">{en ? 'Search Nagarik Watch' : 'नागरिक वाचमा खोज्नुहोस्'}</label>
              <input
                id="recovery-search"
                name="q"
                type="search"
                placeholder={en ? 'Search stories' : 'समाचार खोज्नुहोस्'}
                className="min-h-12 min-w-0 flex-1 bg-transparent px-3.5 text-body text-ink placeholder:text-mute focus:outline-none"
              />
              <button type="submit" className="min-h-12 border-l border-rule px-4 text-meta font-extrabold text-brand-strong hover:bg-brand-tint">
                {en ? 'Search' : 'खोज'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </main>
  )
}
