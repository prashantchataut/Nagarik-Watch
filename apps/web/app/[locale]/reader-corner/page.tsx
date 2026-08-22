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
    <div className="mx-auto max-w-page px-4 py-8 sm:py-12" lang={english ? 'en' : 'ne'}>
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
        <nav
          className="mt-4 flex flex-wrap gap-4"
          aria-label={english ? 'Desk links' : 'डेस्क लिंक'}
        >
          <Link
            href={localizeHref(locale, '/saved')}
            className="inline-flex items-center border-b border-rule pb-1 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
          >
            {english ? 'Saved' : 'सुरक्षित'}
          </Link>
          <Link
            href={localizeHref(locale, session ? '/auth/profile' : '/auth/login')}
            className="inline-flex items-center border-b border-rule pb-1 text-meta font-bold text-ink-soft transition-colors hover:border-brand hover:text-brand-strong"
          >
            {session ? (english ? 'Account' : 'खाता') : english ? 'Sign in' : 'लगइन'}
          </Link>
        </nav>
      </div>

      <div className="mt-6 border-y border-rule py-4 text-meta text-ink-soft">
        <p>
          {session
            ? english
              ? 'Your reading tools stay in one place; use the account page only for identity and security settings.'
              : 'पढाइका उपकरण यहीँ रहन्छन्; पहिचान र सुरक्षा सेटिङका लागि मात्र खाता पृष्ठ प्रयोग गर्नुहोस्।'
            : english
              ? 'Device saves and reading history work without an account. Sign in only when you want cross-device sync.'
              : 'खाता बिना पनि उपकरणमा सुरक्षित सूची र पढाइ इतिहास काम गर्छ। उपकरणबीच सिङ्क चाहिँदा मात्र लगइन गर्नुहोस्।'}
        </p>
      </div>

      <div className="mt-8 space-y-10">
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
    </div>
  )
}
