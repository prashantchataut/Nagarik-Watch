import Link from 'next/link'
import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getSession } from '@/lib/auth/session'
import { ReaderProfileCard } from '@/components/reader/ReaderProfileCard'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Your Nagarik Watch account and security settings.',
  robots: { index: false, follow: false },
}

export default async function ReaderProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const dict = getDictionary(locale)
  const session = await getSession()
  const english = locale === 'en'
  if (!session) {
    redirect(
      `${localizeHref(locale, '/auth/login')}?next=${encodeURIComponent(localizeHref(locale, '/auth/profile'))}`,
    )
  }

  const cards = [
    {
      href: localizeHref(locale, '/reader-corner'),
      title: english ? 'Personal news desk' : 'व्यक्तिगत समाचार डेस्क',
      body: english
        ? 'History, interests, recommendations and alerts.'
        : 'इतिहास, रुचि, सिफारिस र सूचना।',
    },
    {
      href: localizeHref(locale, '/saved'),
      title: dict.navSaved,
      body: english ? 'Your cross-device reading queue.' : 'उपकरणहरूबीच सिङ्क हुने पढाइ सूची।',
    },
    {
      href: localizeHref(locale, '/auth/change-password'),
      title: english ? 'Password and sessions' : 'पासवर्ड र सत्र',
      body: english
        ? 'Change your password and close other sessions.'
        : 'पासवर्ड परिवर्तन गरी अन्य सत्र बन्द गर्नुहोस्।',
    },
  ]

  return (
    <div className="reader-account-page" lang={english ? 'en' : 'ne'}>
      <div className="reader-account-page__inner">
        <nav
          aria-label={english ? 'Account navigation' : 'खाता नेभिगेसन'}
          className="reader-account-nav"
        >
          <Link href={localizeHref(locale, '/')}>
            {english ? 'News home' : 'समाचार गृह'}
          </Link>
          <Link href={localizeHref(locale, '/auth/profile')} aria-current="page">
            {english ? 'Account' : 'खाता'}
          </Link>
          <Link href={localizeHref(locale, '/reader-corner')}>
            {english ? 'My news desk' : 'मेरो समाचार डेस्क'}
          </Link>
          <Link href={localizeHref(locale, '/saved')}>{dict.navSaved}</Link>
          <Link href={localizeHref(locale, '/auth/change-password')}>
            {english ? 'Security' : 'सुरक्षा'}
          </Link>
        </nav>

        <header className="reader-account-hero">
          <div>
            <h1>{english ? 'Your account' : 'तपाईंको खाता'}</h1>
            <p>
              {english
                ? 'Profile details and password live here. Saved stories and reading preferences are on your news desk.'
                : 'प्रोफाइल र पासवर्ड यहाँ छन्। संग्रह र पढाइ रुचि समाचार डेस्कमा छन्।'}
            </p>
          </div>
        </header>

        <div className="reader-account-grid reader-account-grid--profile">
          <main className="reader-account-grid__main">
            <ReaderProfileCard session={session} locale={locale} />
          </main>
          <aside className="reader-account-grid__rail">
            <section className="reader-shortcuts" aria-labelledby="account-shortcuts-title">
              <h2 id="account-shortcuts-title">
                {english ? 'Also in your account' : 'खातामा अरू'}
              </h2>
              <ul>
                {cards.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href}>
                      <strong>{item.title}</strong>
                      <small>{item.body}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
