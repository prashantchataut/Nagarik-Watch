import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getSession } from '@/lib/auth/session'
import { getAuthors, getNavCategories, getStories, getTags } from '@/lib/content'
import { ReaderActivityPanel } from '@/components/reader/ReaderActivityPanel'
import { ReaderPreferencePanel } from '@/components/reader/ReaderPreferencePanel'
import { NotificationCenter } from '@/components/reader/NotificationCenter'
import { RecommendedForYou } from '@/components/reader/RecommendedForYou'
import { ReaderTopicOnboarding } from '@/components/reader/ReaderTopicOnboarding'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Reading desk' : 'पढाइ डेस्क',
    description:
      locale === 'en'
        ? 'Your reading history, interests, recommendations and alerts.'
        : 'तपाईंको पढाइ इतिहास, रुचि, सिफारिस र सूचना।',
    alternates: { canonical: localizeHref(locale, '/reader-corner') },
    robots: { index: false, follow: false },
  }
}

export default async function ReaderCornerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale: Locale = asLocale((await params).locale)
  const english = locale === 'en'
  const [session, categories, tags, authors, storyPage] = await Promise.all([
    getSession(),
    getNavCategories(),
    getTags(),
    getAuthors(),
    getStories({ locale, perPage: 60 }),
  ])

  return (
    <div className="account-page account-page--wide" lang={english ? 'en' : 'ne'}>
      <header className="account-page__header">
        <h1>{english ? 'Reading desk' : 'पढाइ डेस्क'}</h1>
        <p className="account-page__email" style={{ wordBreak: 'normal' }}>
          {session
            ? english
              ? 'History, interests, and alerts for this account.'
              : 'यो खाताको इतिहास, रुचि र सूचना।'
            : english
              ? 'Works on this device. Sign in to sync across phones.'
              : 'यो उपकरणमा चल्छ। सिङ्कका लागि लगइन गर्नुहोस्।'}
        </p>
        <nav className="account-page__subnav" aria-label={english ? 'Desk links' : 'डेस्क लिंक'}>
          <Link href={localizeHref(locale, '/saved')}>{english ? 'Saved' : 'सुरक्षित'}</Link>
          <Link href={localizeHref(locale, session ? '/auth/profile' : '/auth/login')}>
            {session ? (english ? 'Account' : 'खाता') : english ? 'Sign in' : 'लगइन'}
          </Link>
        </nav>
      </header>

      <ReaderTopicOnboarding locale={locale} categories={categories} catalog={storyPage.items} />
      <RecommendedForYou
        locale={locale}
        catalog={storyPage.items}
        className="reader-corner-recommendations"
      />

      <div className="account-desk-stack">
        <ReaderActivityPanel locale={locale} catalog={storyPage.items} />
        <NotificationCenter locale={locale} />
        <ReaderPreferencePanel
          locale={locale}
          categories={categories}
          tags={tags}
          authors={authors}
        />
      </div>
    </div>
  )
}
