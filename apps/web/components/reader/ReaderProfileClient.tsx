import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import type { ReaderSession } from '@/lib/auth/session'
import { localizeHref } from '@/lib/i18n/locales'
import { ReaderProfileCard } from '@/components/reader/ReaderProfileCard'

/**
 * Reader account surface. Identity/settings stay calm and utilitarian while the
 * surrounding layout uses the same editorial spacing as the public site.
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
  const displayName = session?.displayName || email?.split('@')[0] || null
  const initial = (displayName || (english ? 'R' : 'प')).trim().charAt(0).toUpperCase()

  const links = [
    {
      href: localizeHref(locale, '/reader-corner'),
      eyebrow: english ? 'Reading' : 'पढाइ',
      title: english ? 'Reading desk' : 'पढाइ डेस्क',
      body: english
        ? 'History, recommendations, alerts and topic preferences.'
        : 'इतिहास, सिफारिस, सूचना र विषय प्राथमिकता।',
    },
    {
      href: localizeHref(locale, '/saved'),
      eyebrow: english ? 'Library' : 'संग्रह',
      title: english ? 'Saved stories' : 'सुरक्षित समाचार',
      body: english ? 'Stories you marked to return to.' : 'फेरि पढ्न सुरक्षित गरेका समाचार।',
    },
    {
      href: email
        ? localizeHref(locale, '/auth/change-password')
        : localizeHref(locale, '/auth/login'),
      eyebrow: english ? 'Security' : 'सुरक्षा',
      title: email
        ? english
          ? 'Password and security'
          : 'पासवर्ड र सुरक्षा'
        : english
          ? 'Sign in'
          : 'लगइन',
      body: email
        ? english
          ? 'Change your password and manage sign-in security.'
          : 'पासवर्ड र लगइन सुरक्षा व्यवस्थापन गर्नुहोस्।'
        : english
          ? 'Optional sign-in for sync across devices.'
          : 'उपकरणबीच सिङ्कका लागि वैकल्पिक लगइन।',
    },
  ]

  if (!email) {
    links.push({
      href: localizeHref(locale, '/auth/signup'),
      eyebrow: english ? 'Account' : 'खाता',
      title: english ? 'Create account' : 'खाता बनाउनुहोस्',
      body: english ? 'Free. Reading stays open either way.' : 'निःशुल्क। समाचार पढ्न खाता चाहिँदैन।',
    })
  }

  return (
    <main className="reader-profile-page bg-surface" lang={lang}>
      <div className="mx-auto max-w-page px-3 py-6 sm:px-4 sm:py-8 lg:py-10">
        <header className="border-b border-rule pb-6 sm:pb-8">
          <p className="text-caption font-extrabold text-brand-strong">
            {english ? 'Nagarik Watch account' : 'नागरिक वाच खाता'}
          </p>
          <div className="mt-2 grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h1 className="max-w-[18ch] text-pretty font-display text-[clamp(2.5rem,5vw,4.6rem)] font-black leading-[1.08] text-ink">
                {session
                  ? english
                    ? 'Your reading account'
                    : 'तपाईंको पढाइ खाता'
                  : english
                    ? 'Your reading, even without an account'
                    : 'खाता बिना पनि तपाईंको पढाइ'}
              </h1>
              <p className="mt-3 max-w-[54ch] text-body leading-relaxed text-ink-soft sm:text-body-lg">
                {english
                  ? 'Manage saved stories, preferences and account security. News remains free to read.'
                  : 'सुरक्षित समाचार, रोजाइ र खाता सुरक्षा व्यवस्थापन गर्नुहोस्। समाचार पढ्न सधैं खुला छ।'}
              </p>
            </div>

            {session ? (
              <div className="flex min-w-0 items-center gap-3 border-l border-rule pl-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center bg-brand font-display text-xl font-black text-paper" aria-hidden="true">
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-ink">{displayName}</p>
                  <p className="truncate text-caption text-mute">{email}</p>
                </div>
              </div>
            ) : null}
          </div>
        </header>

        <div className="mt-6 grid gap-7 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)] lg:gap-10">
          <section aria-label={english ? 'Profile settings' : 'प्रोफाइल सेटिङ'}>
            {session ? (
              <div className="account-sheet">
                <ReaderProfileCard session={session} locale={locale} />
              </div>
            ) : (
              <div className="account-guest">
                <p className="text-caption font-extrabold text-brand-strong">
                  {english ? 'Guest on this device' : 'यस उपकरणमा अतिथि'}
                </p>
                <h2 className="mt-2 font-display text-[clamp(1.65rem,3vw,2.4rem)] font-black leading-tight text-ink">
                  {english ? 'Local reading works without sign-in' : 'लगइन बिना पनि पढाइ सूची चल्छ'}
                </h2>
                <p className="mt-2 max-w-[46ch] text-meta leading-relaxed text-ink-soft">
                  {english
                    ? 'Save stories on this device now. Sign in only when you want those choices synced elsewhere.'
                    : 'अहिले यही उपकरणमा समाचार सुरक्षित गर्नुहोस्। अर्को उपकरणमा सिङ्क गर्न चाहिँदा मात्र लगइन गर्नुहोस्।'}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href={localizeHref(locale, '/auth/login')} className="account-btn account-btn--primary">
                    {english ? 'Sign in' : 'लगइन'}
                  </Link>
                  <Link href={localizeHref(locale, '/auth/signup')} className="account-btn account-btn--ghost">
                    {english ? 'Create account' : 'खाता बनाउनुहोस्'}
                  </Link>
                </div>
              </div>
            )}
          </section>

          <nav className="reader-profile-links" aria-label={english ? 'Account links' : 'खाता लिंक'}>
            <p className="mb-2 text-caption font-extrabold text-mute">
              {english ? 'ACCOUNT DESK' : 'खाता डेस्क'}
            </p>
            {links.map((item, index) => (
              <Link key={item.href + item.title} href={item.href} className="reader-profile-link">
                <span className="reader-profile-link__index" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="min-w-0">
                  <span className="reader-profile-link__eyebrow">{item.eyebrow}</span>
                  <span className="reader-profile-link__title">{item.title}</span>
                  <span className="reader-profile-link__body">{item.body}</span>
                </span>
                <span className="reader-profile-link__arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </main>
  )
}
