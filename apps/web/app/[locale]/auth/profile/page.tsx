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

  const links = [
    {
      href: localizeHref(locale, '/saved'),
      title: dict.navSaved,
      body: english ? 'Stories you bookmarked.' : 'तपाईंले सुरक्षित गरेका समाचार।',
    },
    {
      href: localizeHref(locale, '/reader-corner'),
      title: english ? 'Reading desk' : 'पढाइ डेस्क',
      body: english ? 'History, interests, and alerts.' : 'इतिहास, रुचि र सूचना।',
    },
    {
      href: localizeHref(locale, '/auth/change-password'),
      title: english ? 'Change password' : 'पासवर्ड परिवर्तन',
      body: english ? 'Update password and end other sessions.' : 'पासवर्ड बदल्नुहोस् र अन्य सत्र बन्द गर्नुहोस्।',
    },
  ]

  return (
    <div className="account-page" lang={english ? 'en' : 'ne'}>
      <header className="account-page__header">
        <h1>{english ? 'Account' : 'खाता'}</h1>
        <p className="account-page__email" lang="en">
          {session.email}
        </p>
      </header>

      <ReaderProfileCard session={session} locale={locale} />

      <nav className="account-page__links" aria-label={english ? 'Account links' : 'खाता लिंक'}>
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="account-page__link">
            <span className="account-page__link-title">{item.title}</span>
            <span className="account-page__link-body">{item.body}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
