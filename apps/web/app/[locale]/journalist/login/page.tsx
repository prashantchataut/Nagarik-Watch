import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistLoginForm } from '@/components/journalist/JournalistLoginForm'
import { getSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, type NewsroomRole } from '@/lib/admin-roles'
import { redirect } from 'next/navigation'
import { accountKindLabel, resolveAccountKind, roleDisplayLabel } from '@/lib/account-identity'

export const metadata: Metadata = {
  title: 'Journalist Login',
  robots: { index: false, follow: false },
}

type Params = { locale: string }

export default async function JournalistLoginPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ reason?: string }>
}) {
  const [{ locale: rawLocale }, query, session] = await Promise.all([params, searchParams, getSession()])
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'

  if (session && CONTRIBUTOR_ROLES.has(session.role as NewsroomRole)) {
    redirect(localizeHref(locale, '/journalist/dashboard'))
  }

  const notStaff = query.reason === 'not_staff' || (session != null && !CONTRIBUTOR_ROLES.has(session.role as NewsroomRole))
  const kind = session ? resolveAccountKind(session.role) : null

  return (
    <main className="staff-gate" lang={ne ? 'ne' : 'en'}>
      <div className="staff-gate__card">
        <Link href={localizeHref(locale, '/')} className="staff-gate__brand" aria-label={ne ? 'गृहपृष्ठ' : 'Home'}>
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        </Link>

        <header className="staff-gate__header">
          <h1>{ne ? 'पत्रकार लगइन' : 'Journalist login'}</h1>
          <p>{ne ? 'रिपोर्टर डेस्कका लागि।' : 'For reporters and contributors.'}</p>
        </header>

        {notStaff ? (
          <div role="status" className="newsroom-login-form__error">
            {ne
              ? `यो खाता ${kind ? accountKindLabel(kind, 'ne') : 'पाठक खाता'} हो (${session ? roleDisplayLabel(session.role, 'ne') : 'पाठक'})। पत्रकार पहुँचका लागि सम्पादक निमन्त्रणा चाहिन्छ।`
              : `Signed in as ${kind ? accountKindLabel(kind, 'en') : 'a reader'} (${session ? roleDisplayLabel(session.role, 'en') : 'Reader'}). Journalist access needs an editor invite.`}
          </div>
        ) : null}

        {!session || !notStaff ? <JournalistLoginForm locale={locale} /> : null}

        <p className="staff-gate__footer">
          <Link href={localizeHref(locale, '/')}>{ne ? '← गृहपृष्ठ' : '← Home'}</Link>
          <Link href={localizeHref(locale, '/auth/forgot-password')}>{ne ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}</Link>
        </p>
      </div>
    </main>
  )
}
