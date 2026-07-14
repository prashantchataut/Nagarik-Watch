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
  if (!session) redirect(localizeHref(locale, '/auth/login'))

  const cards = [
    {
      href: localizeHref(locale, '/reader-corner'),
      title: english ? 'Personal news desk' : 'व्यक्तिगत समाचार डेस्क',
      body: english ? 'History, interests, recommendations and alerts.' : 'इतिहास, रुचि, सिफारिस र सूचना।',
      index: '01',
    },
    {
      href: localizeHref(locale, '/saved'),
      title: dict.navSaved,
      body: english ? 'Your cross-device reading queue.' : 'उपकरणहरूबीच सिङ्क हुने पढाइ सूची।',
      index: '02',
    },
    {
      href: localizeHref(locale, '/auth/change-password'),
      title: english ? 'Password and sessions' : 'पासवर्ड र सत्र',
      body: english ? 'Change your password and close other sessions.' : 'पासवर्ड परिवर्तन गरी अन्य सत्र बन्द गर्नुहोस्।',
      index: '03',
    },
  ]

  return (
    <div className="reader-account-page" lang={english ? 'en' : 'ne'}>
      <div className="reader-account-page__inner">
        <nav aria-label={english ? 'Account navigation' : 'खाता नेभिगेसन'} className="reader-account-nav">
          <Link href={localizeHref(locale, '/auth/profile')} aria-current="page">{english ? 'Account' : 'खाता'}</Link>
          <Link href={localizeHref(locale, '/reader-corner')}>{english ? 'My news desk' : 'मेरो समाचार डेस्क'}</Link>
          <Link href={localizeHref(locale, '/saved')}>{dict.navSaved}</Link>
          <Link href={localizeHref(locale, '/auth/change-password')}>{english ? 'Security' : 'सुरक्षा'}</Link>
        </nav>

        <header className="reader-account-hero">
          <div>
            <p className="editorial-kicker" lang="en">Reader account</p>
            <h1>{english ? 'Identity and security' : 'पहिचान र सुरक्षा'}</h1>
            <p>{english
              ? 'Keep account administration separate from the news you read. Personalization and alert controls live in your news desk; credentials and profile details live here.'
              : 'खाता प्रशासन र पढ्ने समाचार छुट्टै राखिएको छ। व्यक्तिगत सिफारिस र सूचना नियन्त्रण समाचार डेस्कमा हुन्छ; परिचय र सुरक्षा यहाँ हुन्छ।'}</p>
          </div>
          <aside className="reader-account-hero__trust">
            <strong>{english ? 'Signed-in sync is active' : 'लगइन सिङ्क सक्रिय छ'}</strong>
            <span>{english
              ? 'Bookmarks, reading history and preferences can follow this account across devices. You remain able to clear or change them from the reader desk.'
              : 'bookmark, पढाइ इतिहास र रुचि यो खातासँग अन्य उपकरणमा पनि सिङ्क हुन सक्छन्। पाठक डेस्कबाट तिनलाई बदल्न वा मेटाउन सकिन्छ।'}</span>
          </aside>
        </header>

        <div className="reader-account-grid reader-account-grid--profile">
          <main className="reader-account-grid__main">
            <ReaderProfileCard session={session} locale={locale} />
          </main>
          <aside className="reader-account-grid__rail">
            <section className="reader-shortcuts" aria-labelledby="account-shortcuts-title">
              <p className="editorial-kicker" lang="en">Account map</p>
              <h2 id="account-shortcuts-title">{english ? 'Choose the right workspace' : 'सही कार्यक्षेत्र छान्नुहोस्'}</h2>
              <ol>
                {cards.map((item) => (
                  <li key={item.href}>
                    <span aria-hidden="true">{item.index}</span>
                    <Link href={item.href}><strong>{item.title}</strong><small>{item.body}</small></Link>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}
