import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getAuth } from '@/lib/auth'
import { getNewsroomSession } from '@/lib/auth/session'
import { ensureNewsroomBootAccounts, getBootLoginHint } from '@/lib/auth/boot-accounts'
import { StaffAuthShell } from '@/components/auth/StaffAuthShell'
import { AdminLoginForm } from './AdminLoginForm'
import { probeDatabase } from '@/lib/db-url'

export const metadata: Metadata = {
  title: 'Newsroom Login · नागरिक वाच',
  description: 'Staff-only sign in to the Nagarik Watch newsroom.',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>
}) {
  let authReady = false
  let bootFailed = false
  try {
    const auth = await getAuth()
    authReady = true
    // Do not bcrypt/rewrite every configured staff password on every login
    // page render. `getAuth()` already schedules normal boot provisioning after
    // the response. Operators can explicitly request a blocking repair when
    // rotating an env password by setting AUTH_BOOT_REPAIR_ON_LOGIN=true for
    // one deployment/request window.
    if (
      process.env.NODE_ENV !== 'production' ||
      process.env.AUTH_BOOT_REPAIR_ON_LOGIN === 'true'
    ) {
      await ensureNewsroomBootAccounts(
        auth as unknown as Parameters<typeof ensureNewsroomBootAccounts>[0],
        { forcePassword: process.env.AUTH_BOOT_REPAIR_ON_LOGIN === 'true' },
      )
    }
  } catch (error) {
    bootFailed = true
    console.error('[admin/login] auth/boot failed', error)
  }

  const [session, query, boot, databaseProbe] = await Promise.all([
    getNewsroomSession(),
    searchParams,
    getBootLoginHint(),
    bootFailed ? probeDatabase() : Promise.resolve(null),
  ])
  if (session) redirect('/admin/dashboard')

  const showBootHint =
    process.env.NODE_ENV !== 'production' &&
    authReady &&
    boot.configured &&
    boot.emails.length > 0

  return (
    <StaffAuthShell
      kind="admin"
      locale="ne"
      title="सम्पादकीय लगइन"
      lede="सम्पादक, प्रकाशक र एडमिन यहाँबाट प्रकाशन, भूमिका र लाइभ डेस्क चलाउँछन्। रिपोर्टिङ ड्राफ्ट पत्रकार डेस्कमा हुन्छ।"
      formTitle="साइन इन"
      formLede="स्टाफ खाता मात्र। सार्वजनिक साइनअपबाट एडमिन भूमिका मिल्दैन।"
      points={['प्रकाशन कतार र CMS', 'भूमिका, निमन्त्रणा, अडिट', 'लाइभ ब्लग र विजेट']}
      footer={
        <>
          <Link href="/">गृहपृष्ठ</Link>
          <Link href="/journalist/login">पत्रकार डेस्क</Link>
          <Link href="/auth/forgot-password?next=%2Fadmin%2Flogin">पासवर्ड बिर्सनुभयो?</Link>
        </>
      }
    >
      {!authReady || bootFailed ? (
        <aside className="newsroom-login-form__error" role="status">
          <strong>लगइन सेवा अफलाइन।</strong>
          <span className="mt-1.5 block">
            {databaseProbe?.detail ?? 'DATABASE_URL र NEWSROOM_* env जाँच्नुहोस्, त्यसपछि पृष्ठ रिफ्रेस गर्नुहोस्।'}
          </span>
        </aside>
      ) : null}

      {authReady && !bootFailed && boot.lastError ? (
        <aside className="newsroom-login-form__error" role="status">
          <strong>खाता मर्मत अधुरो।</strong>
          <span className="mt-1.5 block">
            NEWSROOM_SUPERADMIN_EMAIL / PASSWORD जाँच्नुहोस्।
          </span>
        </aside>
      ) : null}

      {showBootHint ? (
        <aside className="newsroom-login-form__ok" lang="ne">
          <strong className="block">विकास वातावरण: यी इमेल प्रयोग गर्नुहोस्</strong>
          <span className="mt-1.5 block break-all">{boot.emails.join(' · ')}</span>
        </aside>
      ) : null}

      {authReady && !bootFailed ? (
        <AdminLoginForm
          resetComplete={query.reset === 'success'}
          databaseOnline={authReady}
          expectedEmails={boot.emails}
        />
      ) : null}
    </StaffAuthShell>
  )
}
