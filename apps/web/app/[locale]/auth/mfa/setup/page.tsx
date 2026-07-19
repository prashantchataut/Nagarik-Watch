import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { StaffMfaSetup } from '@/components/auth/StaffMfaSetup'
import { getUnverifiedNewsroomSession } from '@/lib/auth/session'
import { asLocale } from '@/lib/i18n/locales'
import { twoFactorConfigured } from '@/lib/security/mfa'

export const metadata: Metadata = {
  title: 'Newsroom MFA setup',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function StaffMfaSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const session = await getUnverifiedNewsroomSession()
  if (!session) redirect(locale === 'en' ? '/en/auth/login' : '/auth/login')
  if (!twoFactorConfigured()) redirect('/admin/dashboard')
  if (session.twoFactorEnabled) redirect('/admin/dashboard')

  return (
    <main className="mx-auto max-w-xl px-5 py-16" lang={locale}>
      <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
        Newsroom security
      </p>
      <h1 className="mt-3 font-display text-display text-ink">
        {locale === 'ne' ? 'दुई चरणीय प्रमाणीकरण सेटअप' : 'Set up two-factor authentication'}
      </h1>
      <div className="mt-8 rounded-lg border border-rule bg-surface-raised p-6">
        <StaffMfaSetup locale={locale} />
      </div>
    </main>
  )
}
