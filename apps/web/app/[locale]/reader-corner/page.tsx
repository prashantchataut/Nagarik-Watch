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
import { HubIndexHeader } from '@/components/HubIndexHeader'

export const dynamic = 'force-static'

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
    <main className="reader-desk mx-auto max-w-page px-4 py-8 sm:py-10" lang={english ? 'en' : 'ne'}>
      <div>
        <HubIndexHeader
          title={english ? 'Reading desk' : 'पढाइ डेस्क'}
          lead={
            session
              ? english
                ? 'Reading history, interests, recommendations and alerts for this account.'
                : 'यो खाताका लागि पढाइ इतिहास, रुचि, सिफारिस र सूचना।'
              : english
                ? 'Reading history and saves on this device. Sign in to sync them across phones.'
                : 'यो उपकरणको पढाइ इतिहास र सुरक्षित सूची। सिङ्कका लागि लगइन गर्नुहोस्।'
          }
          lang={english ? 'en' : 'ne'}
          kicker={english ? 'Reader account' : 'पाठक खाता'}
        />
        <nav className="reader-desk__nav" aria-label={english ? 'Desk links' : 'डेस्क लिंक'}>
          <Link
            href={localizeHref(locale, '/saved')}
            className="reader-desk__nav-link"
          >
            {english ? 'Saved' : 'सुरक्षित'}
          </Link>
          <Link
            href={localizeHref(locale, session ? '/auth/profile' : '/auth/login')}
            className="reader-desk__nav-link"
          >
            {session ? (english ? 'Account' : 'खाता') : english ? 'Sign in' : 'लगइन'}
          </Link>
        </nav>
      </div>

      <div className="reader-desk__content">
        <RecommendedForYou
          locale={locale}
          catalog={storyPage.items}
          className="reader-corner-recommendations"
        />
        <div className="grid gap-10 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
          <div className="space-y-10">
            <ReaderActivityPanel locale={locale} catalog={storyPage.items} />
            <ReaderTopicOnboarding
              locale={locale}
              categories={categories}
              catalog={storyPage.items}
            />
          </div>
          <div className="space-y-10">
            <NotificationCenter locale={locale} />
            <ReaderPreferencePanel
              locale={locale}
              categories={categories}
              tags={tags}
              authors={authors}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
