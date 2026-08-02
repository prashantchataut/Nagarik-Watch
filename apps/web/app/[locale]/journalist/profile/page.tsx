import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'Journalist profile', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function JournalistProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole)) {
    redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  }
  const roleLabel = ne
    ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole]
    : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]

  return (
    <JournalistWorkspaceShell
      locale={locale}
      name={session.displayName || session.email}
      roleLabel={roleLabel}
      active="profile"
    >
      <main className="newsroom-page">
        <header className="newsroom-page__header">
          <div>
            <h1>{ne ? 'प्रोफाइल' : 'Profile'}</h1>
            <p>
              {ne
                ? 'न्युजरुम पहिचान र सार्वजनिक byline कहाँ व्यवस्थापन हुन्छ।'
                : 'Where newsroom identity and the public byline are managed.'}
            </p>
          </div>
        </header>

        <section className="journalist-profile-sheet">
          <dl>
            <div>
              <dt>{ne ? 'नाम' : 'Name'}</dt>
              <dd>{session.displayName || (ne ? 'सेट गरिएको छैन' : 'Not set')}</dd>
            </div>
            <div>
              <dt>{ne ? 'न्युजरुम इमेल' : 'Newsroom email'}</dt>
              <dd>{session.email}</dd>
            </div>
            <div>
              <dt>{ne ? 'भूमिका' : 'Role'}</dt>
              <dd>{roleLabel}</dd>
            </div>
            <div>
              <dt>{ne ? 'भाषा' : 'Language'}</dt>
              <dd>{session.locale === 'en' ? 'English' : 'नेपाली'}</dd>
            </div>
          </dl>
          <div>
            <h2>{ne ? 'सार्वजनिक लेखक प्रोफाइल' : 'Public author profile'}</h2>
            <p>
              {ne
                ? 'Byline फोटो, जीवनी, beat र सार्वजनिक लिंक Authors collection बाट व्यवस्थापन हुन्छ। न्युजरुम इमेल सार्वजनिक हुँदैन।'
                : 'Byline photo, biography, beats and public links live in the Authors collection. Your newsroom email stays private.'}
            </p>
            <div className="journalist-profile-sheet__actions">
              <Link
                className="journalist-profile-sheet__btn journalist-profile-sheet__btn--primary"
                href={localizeHref(locale, '/auth/change-password')}
              >
                {ne ? 'पासवर्ड र सत्र' : 'Password and sessions'}
              </Link>
              <Link
                className="journalist-profile-sheet__btn"
                href={localizeHref(locale, '/journalist/dashboard')}
              >
                {ne ? 'डेस्कमा फर्कनुहोस्' : 'Back to desk'}
              </Link>
            </div>
          </div>
        </section>
      </main>
    </JournalistWorkspaceShell>
  )
}
