import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistLoginForm } from '@/components/journalist/JournalistLoginForm'
import { StaffAuthShell } from '@/components/auth/StaffAuthShell'
import { getAuth } from '@/lib/auth'
import { ensureNewsroomBootAccounts } from '@/lib/auth/boot-accounts'
import { getSession } from '@/lib/auth/session'
import { ADMIN_BASE_ROLES, JOURNALIST_DESK_ROLES, type NewsroomRole } from '@/lib/admin-roles'
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
      { forcePassword: true },
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

  const points = ne
    ? [
        'शीर्षक, शरीर, ट्याग',
        'स्रोत र प्रमाण नोट',
        'ढाँचा र चेकलिस्ट',
        'स्वतः सुरक्षित, त्यसपछि समीक्षा',
      ]
    : [
        'Headline, body, tags',
        'Source and evidence notes',
        'Frames and checklist',
        'Autosave, then review',
      ]

  return (
    <StaffAuthShell
      kind="journalist"
      locale={ne ? 'ne' : 'en'}
      title={ne ? 'पत्रकार डेस्कमा स्वागत छ' : 'Welcome to the reporter desk'}
      lede={
        ne
          ? 'असाइनमेन्ट हेर्नुहोस्, ड्राफ्ट लेख्नुहोस्, स्रोत नोट सुरक्षित गर्नुहोस् र समीक्षा लागि सम्पादकलाई पठाउनुहोस्।'
          : 'Review assignments, write drafts, keep source notes, and send work to an editor for review.'
      }
      formTitle={ne ? 'आफ्नो डेस्क खोल्नुहोस्' : 'Open your desk'}
      formLede={
        ne
          ? 'सम्पादकले दिएको इमेल र पासवर्ड प्रयोग गर्नुहोस्।'
          : 'Use the email and password your editor provisioned.'
      }
      points={points}
      footer={
        <>
          <Link href={localizeHref(locale, '/')}>{ne ? 'गृहपृष्ठ' : 'Home'}</Link>
          <Link href={localizeHref(locale, '/auth/signup')}>
            {ne ? 'पाठक खाता बनाउनुहोस्' : 'Create a reader account'}
          </Link>
          <Link href="/admin/login">{ne ? 'एडमिन लगइन' : 'Admin login'}</Link>
          <Link href={localizeHref(locale, '/auth/forgot-password')}>
            {ne ? 'पासवर्ड बिर्सनुभयो?' : 'Forgot password?'}
          </Link>
        </>
      }
    >
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
    </StaffAuthShell>
  )
}
