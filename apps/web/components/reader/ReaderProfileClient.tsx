import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import type { ReaderSession } from '@/lib/auth/session'
import { localizeHref } from '@/lib/i18n/locales'
import { HubIndexHeader } from '@/components/HubIndexHeader'
import { ReaderProfileCard } from '@/components/reader/ReaderProfileCard'

/**
 * Reader account desk: signed-in edit sheet or honest guest, dense link list,
 * Option A free-to-read. Session is resolved on the server.
 */
export function ReaderProfileClient({
  locale,
  session,
}: {
  locale: Locale
  session: ReaderSession | null
}) {
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'
  const email = session?.email ?? null

  const links = [
    {
      href: localizeHref(locale, '/reader-corner'),
      title: english ? 'Reading desk' : 'पढाइ डेस्क',
      body: english
        ? 'History, recommendations, alerts and preferences in one place.'
        : 'इतिहास, सिफारिस, सूचना र रोजाइ एकै ठाउँमा।',
    },
    {
      href: localizeHref(locale, '/saved'),
      title: english ? 'Saved stories' : 'सुरक्षित समाचार',
      body: english
        ? 'Bookmarks and reads you want to return to.'
        : 'फेरि पढ्न चाहेका बुकमार्क र पढाइ।',
    },
    {
      href: email
        ? localizeHref(locale, '/auth/change-password')
        : localizeHref(locale, '/auth/login'),
      title: email
        ? english
          ? 'Password and security'
          : 'पासवर्ड र सुरक्षा'
        : english
          ? 'Sign in'
          : 'लगइन',
      body: email
        ? english
          ? 'Manage sign-in security for this account.'
          : 'यो खाताको लगइन सुरक्षा व्यवस्थापन गर्नुहोस्।'
        : english
          ? 'Optional sign-in for sync across devices.'
          : 'उपकरणबीच सिङ्कका लागि वैकल्पिक लगइन।',
    },
  ]
  if (!email) {
    links.push({
      href: localizeHref(locale, '/auth/signup'),
      title: english ? 'Create account' : 'खाता बनाउनुहोस्',
      body: english ? 'Free. Reading stays open either way.' : 'निःशुल्क। पढाइ सधैं खुला रहन्छ।',
    })
  }

  return (
    <div
      className="account-page account-page--wide mx-auto max-w-page px-3 py-4 sm:px-4 sm:py-5"
      lang={lang}
    >
      <HubIndexHeader
        title={english ? 'Account' : 'खाता'}
        lead={
          english
            ? 'Saved stories, reading preferences and optional sync. Reading stays free.'
            : 'सुरक्षित समाचार, पढाइ रोजाइ र वैकल्पिक सिङ्क। पढाइ सधैं खुला।'
        }
        lang={lang}
      />

      {session ? (
        <section className="account-sheet mt-4" aria-label={english ? 'Profile' : 'प्रोफाइल'}>
          <ReaderProfileCard session={session} locale={locale} />
        </section>
      ) : (
        <section
          className="account-guest mt-4"
          aria-label={english ? 'Account status' : 'खाता स्थिति'}
        >
          <p className="text-caption font-bold text-brand-strong">
            {english ? 'Guest on this device' : 'यस उपकरणमा अतिथि'}
          </p>
          <span className="mt-1.5 block h-0.5 w-8 bg-brand" aria-hidden="true" />
          <p className="mt-2 font-display text-body font-bold text-ink sm:text-body-lg">
            {english ? 'Local reading desk' : 'स्थानीय पढाइ डेस्क'}
          </p>
          <p className="mt-1 text-meta text-ink-soft">
            {english
              ? 'You can save stories here without an account.'
              : 'खाता बिना पनि यहाँ समाचार सुरक्षित गर्न सकिन्छ।'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={localizeHref(locale, '/auth/login')}
              className="account-btn account-btn--primary"
            >
              {english ? 'Sign in' : 'लगइन'}
            </Link>
            <Link
              href={localizeHref(locale, '/auth/signup')}
              className="account-btn account-btn--ghost"
            >
              {english ? 'Create account' : 'खाता बनाउनुहोस्'}
            </Link>
          </div>
        </section>
      )}

      <nav className="account-page__links" aria-label={english ? 'Account links' : 'खाता लिंक'}>
        {links.map((item) => (
          <Link key={item.href + item.title} href={item.href} className="account-page__link">
            <span className="account-page__link-title">{item.title}</span>
            <span className="account-page__link-body">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
