import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { Logo } from '@/components/Logo'
import { JournalistLoginForm } from '@/components/journalist/JournalistLoginForm'
import { getAuth } from '@/lib/auth'
import { ensureNewsroomBootAccounts } from '@/lib/auth/boot-accounts'
import { getSession } from '@/lib/auth/session'
import {
  ADMIN_BASE_ROLES,
  JOURNALIST_DESK_ROLES,
  type NewsroomRole,
} from '@/lib/admin-roles'
import { redirect } from 'next/navigation'
import { accountKindLabel, resolveAccountKind, roleDisplayLabel } from '@/lib/account-identity'

export const metadata: Metadata = {
  title: 'Journalist Login',
  robots: { index: false, follow: false },
}

type Params = { locale: string }

function canUseJournalistDesk(role: NewsroomRole) {
  return JOURNALIST_DESK_ROLES.has(role) || role === 'copy_editor' || role === 'fact_checker'
}

export default async function JournalistLoginPage({
  params,
  searchParams,
}: {
  params: Promise<Params>
  searchParams: Promise<{ reason?: string }>
}) {
  const [{ locale: rawLocale }, query] = await Promise.all([params, searchParams])
  const locale: Locale = asLocale(rawLocale)
  const ne = locale === 'ne'

  let authReady = false
  let bootFailed = false
  try {
    const auth = await getAuth()
    const boot = await ensureNewsroomBootAccounts(
      auth as unknown as Parameters<typeof ensureNewsroomBootAccounts>[0],
    )
    authReady = boot.configured > 0 && boot.failed.length === 0
    bootFailed = boot.failed.length > 0
  } catch (error) {
    console.error('[journalist/login] auth/boot failed', error)
  }

  const session = authReady ? await getSession() : null
  const role = (session?.role ?? 'reader') as NewsroomRole

  if (session && ADMIN_BASE_ROLES.has(role) && !JOURNALIST_DESK_ROLES.has(role)) {
    redirect('/admin/dashboard')
  }
  if (session && canUseJournalistDesk(role)) {
    redirect(localizeHref(locale, '/journalist/dashboard'))
  }

  const notStaff = query.reason === 'not_staff' || (session != null && !canUseJournalistDesk(role))
  const kind = session ? resolveAccountKind(session.role) : null

  return (
    <main className="staff-gate" lang={ne ? 'ne' : 'en'}>
      <div className="staff-gate__card staff-gate__card--wide">
        <Link href={localizeHref(locale, '/')} className="staff-gate__brand" aria-label={ne ? 'गृहपृष्ठ' : 'Home'}>
          <Logo siteName={ne ? 'नागरिक वाच' : 'Nagarik Watch'} />
        </Link>

        <header className="staff-gate__header">
          <h1>{ne ? 'पत्रकार लगइन' : 'Journalist login'}</h1>
          <p>
            {ne
              ? 'रिपोर्टर डेस्क — ड्राफ्ट लेख्नुहोस्, प्रमाण नोट राख्नुहोस्, सम्पादकलाई पठाउनुहोस्।'
              : 'Reporter desk — write drafts, attach evidence notes, submit to editors.'}
          </p>
        </header>

        <ul className="staff-gate__tools" aria-label={ne ? 'उपलब्ध उपकरण' : 'Available tools'}>
          <li>{ne ? 'स्टुडियो: शीर्षक, सामग्री, ट्याग' : 'Studio: headline, body, tags'}</li>
          <li>{ne ? 'स्रोत/प्रमाण र स्थान नोट' : 'Source/evidence and location notes'}</li>
          <li>{ne ? 'ढाँचा र लेखन चेकलिस्ट' : 'Story frames and writing checklist'}</li>
          <li>{ne ? 'स्वतः सुरक्षित र समीक्षा पठाउने' : 'Autosave and submit for review'}</li>
        </ul>

        {notStaff ? (
          <div role="status" className="newsroom-login-form__error">
            {ne
              ? `यो खाता ${kind ? accountKindLabel(kind, 'ne') : 'पाठक खाता'} हो (${session ? roleDisplayLabel(session.role, 'ne') : 'पाठक'})। पत्रकार पहुँचका लागि सम्पादक निमन्त्रणा चाहिन्छ।`
              : `Signed in as ${kind ? accountKindLabel(kind, 'en') : 'a reader'} (${session ? roleDisplayLabel(session.role, 'en') : 'Reader'}). Journalist access needs an editor invite.`}
          </div>
        ) : null}

        {!authReady ? (
          <aside className="newsroom-login-form__error" role="status">
            {bootFailed
              ? ne
                ? 'प्रमाणीकरण खाता तयार हुन सकेन। विकास सर्भर पुनः सुरु गर्नुहोस्।'
                : 'Could not provision sign-in accounts. Restart the dev server.'
              : ne
                ? 'प्रमाणीकरण सेवा अहिले उपलब्ध छैन।'
                : 'Authentication is offline right now.'}
          </aside>
        ) : null}

        {authReady && (!session || !notStaff) ? (
          <div data-boot-ready="true">
            <JournalistLoginForm locale={locale} />
          </div>
        ) : null}

        <p className="staff-gate__footer">
          <Link href={localizeHref(locale, '/')}>{ne ? '← गृहपृष्ठ' : '← Home'}</Link>
          <Link href="/admin/login">{ne ? 'एडमिन लगइन' : 'Admin login'}</Link>
          <Link href={localizeHref(locale, '/auth/forgot-password')}>{ne ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}</Link>
        </p>
      </div>
    </main>
  )
}
