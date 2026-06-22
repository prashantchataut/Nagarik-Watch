import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localizeHref, localePrefix } from '@/lib/i18n/locales'

type Params = { locale: string }

/**
 * Saved / bookmarks. Reader accounts and bookmarking are owned by the backend/account agent
 * and are not built yet, so this is an honest, designed empty state rather than a 404 (the
 * bottom-nav "Saved" tab always lands somewhere coherent). When accounts + the BookmarkButton
 * ship, this page renders the reader's saved stories instead.
 *
 * The copy is written like a product team would: it explains what the feature will do, sets
 * expectations honestly ("coming soon"), and offers a real next action (browse Latest), so
 * the empty state is useful, not a dead end.
 */
export default async function SavedPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'

  const heading = locale === 'ne' ? 'सुरक्षित समाचार' : 'Saved stories'
  const body =
    locale === 'ne'
      ? 'पछि पढ्न समाचार सुरक्षित गर्ने सुविधा चाँडै आउँदैछ। खाता बनाएपछि तपाईंले मन परेका लेख यहाँ जम्मा गर्न सक्नुहुनेछ।'
      : 'Saving stories to read later is coming soon. Once you have an account, the articles you bookmark will collect here.'
  const cta = locale === 'ne' ? 'ताजा समाचार हेर्नुहोस्' : 'Browse the latest'

  return (
    <div className="mx-auto flex max-w-body flex-col items-center px-4 py-20 text-center">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-tint text-brand-strong"
        aria-hidden="true"
      >
        <svg
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 4h12a1 1 0 0 1 1 1v15l-7-4-7 4V5a1 1 0 0 1 1-1Z" />
        </svg>
      </span>
      <h1 className="mt-6 font-display text-h1 text-ink" lang={lang}>
        {heading}
      </h1>
      <p className="mt-3 max-w-md text-body-lg text-ink-soft" lang={lang}>
        {body}
      </p>
      <a
        href={localizeHref(locale, '/latest')}
        className="mt-7 inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-body font-semibold text-surface transition-colors duration-fast ease-out-quint hover:bg-brand-strong"
        lang={lang}
      >
        {cta}
      </a>
      <p className="sr-only">{dict.navSaved}</p>
    </div>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)
  return {
    title: dict.navSaved,
    robots: { index: false },
    alternates: { canonical: `${prefix}/saved`, languages: { ne: '/saved', en: '/en/saved' } },
  }
}
