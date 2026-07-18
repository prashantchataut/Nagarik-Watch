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

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'My news desk' : 'मेरो समाचार डेस्क',
    description: locale === 'en'
      ? 'Your reading history, saved interests, recommendations and alert controls.'
      : 'तपाईंको पढाइ इतिहास, रुचि, सिफारिस र सूचना नियन्त्रण।',
    alternates: { canonical: localizeHref(locale, '/reader-corner') },
    robots: { index: false, follow: false },
  }
}

export default async function ReaderCornerPage({ params }: { params: Promise<{ locale: string }> }) {
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
    <div className="reader-account-page" lang={english ? 'en' : 'ne'}>
      <div className="reader-account-page__inner">
        <nav className="reader-account-nav" aria-label={english ? 'Reader desk navigation' : 'पाठक डेस्क नेभिगेसन'}>
          <Link href={localizeHref(locale, '/reader-corner')} aria-current="page">{english ? 'My desk' : 'मेरो डेस्क'}</Link>
          <Link href={localizeHref(locale, '/saved')}>{english ? 'Saved' : 'सुरक्षित'}</Link>
          <Link href={localizeHref(locale, '/how-recommendations-work')}>{english ? 'Ranking policy' : 'क्रम नीति'}</Link>
          <Link href={localizeHref(locale, session ? '/auth/profile' : '/auth/login')}>{session ? (english ? 'Account' : 'खाता') : (english ? 'Sign in' : 'लगइन')}</Link>
        </nav>

        <header className="reader-account-hero reader-account-hero--desk">
          <div>
            <p className="editorial-kicker" lang="en">Personal news desk</p>
            <h1>{english ? 'Read with memory, not noise' : 'हल्ला होइन, सम्झनासहित पढ्नुहोस्'}</h1>
            <p>{english
              ? 'Continue unfinished reporting, review your reading trail, follow the desks and journalists that matter, and decide which alerts are allowed to interrupt you.'
              : 'अधुरो समाचार पढाइ जारी राख्नुहोस्, आफ्नो पढाइ यात्रा हेर्नुहोस्, उपयोगी विभाग र पत्रकार पछ्याउनुहोस् र कुन सूचनाले तपाईंलाई रोक्न पाउने हो आफैँ तय गर्नुहोस्।'}</p>
          </div>
          <aside className="reader-account-hero__trust">
            <strong>{session ? (english ? 'Cross-device account sync' : 'उपकरणबीच खाता सिङ्क') : (english ? 'Private on this device' : 'यो उपकरणमा निजी')}</strong>
            <span>{session
              ? (english ? 'Device activity is merged into your signed-in account. You can clear history or change interests at any time.' : 'उपकरणको गतिविधि तपाईंको खातामा जोडिन्छ। इतिहास मेटाउन वा रुचि बदल्न जुनसुकै बेला सकिन्छ।')
              : (english ? 'Your desk works without an account. Sign in only when you want bookmarks, history and preferences to follow you across devices.' : 'खाता नबनाई पनि यो डेस्क चल्छ। bookmark, इतिहास र रुचि अन्य उपकरणमा पनि चाहिँदा मात्र लगइन गर्नुहोस्।')}</span>
            {!session ? <Link href={localizeHref(locale, '/auth/login')} className="text-action">{english ? 'Sign in for sync' : 'सिङ्कका लागि लगइन'}</Link> : null}
          </aside>
        </header>

        <ReaderTopicOnboarding locale={locale} categories={categories} />
        <RecommendedForYou locale={locale} catalog={storyPage.items} className="reader-corner-recommendations" />

        <div className="reader-account-grid reader-account-grid--desk">
          <main className="reader-account-grid__main">
            <ReaderActivityPanel locale={locale} />
            <ReaderPreferencePanel locale={locale} categories={categories} tags={tags} authors={authors} />
          </main>
          <aside className="reader-account-grid__rail">
            <NotificationCenter locale={locale} />
            <section className="reader-shortcuts" aria-labelledby="reader-desk-shortcuts">
              <p className="editorial-kicker" lang="en">Control</p>
              <h2 id="reader-desk-shortcuts">{english ? 'Your data, your decision' : 'तपाईंको डेटा, तपाईंको निर्णय'}</h2>
              <ol>
                <li><span aria-hidden="true">01</span><Link href={localizeHref(locale, '/saved')}><strong>{english ? 'Saved reading queue' : 'सुरक्षित पढाइ सूची'}</strong><small>{english ? 'Open or remove bookmarks.' : 'bookmark खोल्नुहोस् वा हटाउनुहोस्।'}</small></Link></li>
                <li><span aria-hidden="true">02</span><Link href={localizeHref(locale, '/how-recommendations-work')}><strong>{english ? 'Why stories are ranked' : 'समाचार किन यसरी क्रमबद्ध छन्'}</strong><small>{english ? 'See every signal and guardrail.' : 'हरेक संकेत र सीमा बुझ्नुहोस्।'}</small></Link></li>
                <li><span aria-hidden="true">03</span><Link href={localizeHref(locale, session ? '/auth/profile' : '/auth/register')}><strong>{session ? (english ? 'Account and security' : 'खाता र सुरक्षा') : (english ? 'Create a sync account' : 'सिङ्क खाता बनाउनुहोस्')}</strong><small>{session ? (english ? 'Profile, password and sessions.' : 'प्रोफाइल, पासवर्ड र सत्र।') : (english ? 'Optional; this desk already works locally.' : 'वैकल्पिक; यो डेस्क स्थानीय रूपमा चलिसकेको छ।')}</small></Link></li>
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
