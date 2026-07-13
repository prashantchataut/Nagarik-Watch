import Link from 'next/link'
import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getSession } from '@/lib/auth/session'
import { ReaderProfileCard } from '@/components/reader/ReaderProfileCard'
import { ReaderActivityPanel } from '@/components/reader/ReaderActivityPanel'
import { NotificationCenter } from '@/components/reader/NotificationCenter'

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
  const lang = locale === 'en' ? 'en' : 'ne'

  if (!session) {
    redirect(locale === 'en' ? '/en/auth/login' : '/auth/login')
  }

  const cards = [
    {
      href: localizeHref(locale, '/saved'),
      title: dict.navSaved,
      body: locale === 'en' ? 'Stories you saved to read later.' : 'पछि पढ्न संग्रह गरेका समाचार।',
    },
    {
      href: localizeHref(locale, '/latest'),
      title: locale === 'en' ? 'Continue reading' : 'पढ्न जारी',
      body:
        locale === 'en'
          ? 'Return to the latest desk and keep reading.'
          : 'ताजा डेस्कमा फर्किएर पढ्न जारी राख्नुहोस्।',
    },
    {
      href: localizeHref(locale, '/trending'),
      title: dict.navTrending,
      body:
        locale === 'en'
          ? 'See what readers are following now.'
          : 'अहिले पाठकले के पछ्याइरहेका छन् हेर्नुहोस्।',
    },
    {
      href: locale === 'en' ? '/' : '/en',
      title: locale === 'en' ? 'नेपाली संस्करण' : 'English edition',
      body: locale === 'en' ? 'Switch to the Nepali edition.' : 'English edition मा जानुहोस्।',
    },
  ]

  return (
    <div className="mx-auto max-w-page px-4 py-10">
      <nav
        aria-label={locale === 'en' ? 'Account navigation' : 'खाता नेभिगेसन'}
        className="mb-6 flex flex-wrap gap-2"
        lang={lang}
      >
        <Link
          href={localizeHref(locale, '/auth/profile')}
          aria-current="page"
          className="rounded-full bg-brand px-3.5 py-2 text-meta font-bold text-surface"
        >
          {locale === 'en' ? 'Profile' : 'प्रोफाइल'}
        </Link>
        <Link
          href={localizeHref(locale, '/saved')}
          className="rounded-full border border-rule px-3.5 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
        >
          {dict.navSaved}
        </Link>
        <Link
          href={localizeHref(locale, '/auth/login')}
          className="rounded-full border border-rule px-3.5 py-2 text-meta font-semibold text-ink-soft hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
        >
          {locale === 'en' ? 'Login' : 'लगइन'}
        </Link>
      </nav>

      <header className="grid gap-5 border-b border-rule pb-7 lg:grid-cols-[1fr_0.5fr] lg:items-end">
        <div>
          <h1 className="font-display text-display text-ink" lang={lang}>
            {locale === 'en' ? 'Your profile' : 'तपाईंको प्रोफाइल'}
          </h1>
          <p className="mt-2 max-w-2xl text-body text-ink-soft" lang={lang}>
            {locale === 'en'
              ? 'Manage your reader account, saved stories, reading path and language access from one place.'
              : 'तपाईंको पाठक खाता, सुरक्षित समाचार, पढाइ बाटो र भाषा पहुँच एउटै ठाउँबाट हेर्नुहोस्।'}
          </p>
        </div>
        <div className="rounded-lg border border-rule bg-surface-raised p-4 text-meta text-ink-soft" lang={lang}>
          {locale === 'en'
            ? 'Reading history remains on this device; signed-in bookmarks also sync through the engagement store.'
            : 'पढाइ इतिहास यो उपकरणमै रहन्छ; लगइन गरिएको bookmark engagement store मार्फत पनि सिंक हुन्छ।'}
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.42fr)]">
        <div className="grid gap-6">
          <ReaderProfileCard session={session} locale={locale} />
          <ReaderActivityPanel locale={locale} />
        </div>
        <div className="grid content-start gap-6">
          <aside className="rounded-lg border border-rule bg-surface-raised p-5" lang={lang}>
          <p
            className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong"
            lang="en"
          >
            Reader shortcuts
          </p>
          <ul className="mt-4 grid gap-3">
            {cards.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-rule bg-surface p-3 transition hover:border-brand hover:bg-brand-tint/40"
                >
                  <span className="font-display text-h3 text-ink">{item.title}</span>
                  <span className="mt-1 block text-meta text-ink-soft">{item.body}</span>
                </Link>
              </li>
            ))}
          </ul>
          </aside>
          <NotificationCenter locale={locale} />
        </div>
      </div>
    </div>
  )
}
