import type { Metadata } from 'next'
import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Newsroom MFA setup',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-static'

/** MFA setup needs a live auth host; keep a clear static page instead of a dead redirect. */
export default async function StaffMfaSetupPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  return (
    <main className="mx-auto max-w-xl px-5 py-16" lang={locale === 'en' ? 'en' : 'ne'}>
      <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">
        {ne ? 'समाचारकक्ष सुरक्षा' : 'Newsroom security'}
      </p>
      <h1 className="mt-3 font-display text-display text-ink">
        {ne ? 'दुई चरणीय प्रमाणीकरण' : 'Two-factor authentication'}
      </h1>
      <p className="mt-4 text-body text-ink-soft">
        {ne
          ? 'MFA सेटअप पूर्ण एप होस्टमा मात्र चल्छ। पाठक लगइन र सुरक्षित समाचार अझै उपलब्ध छन्।'
          : 'MFA setup runs on the full app host only. Reader sign-in and saved stories remain available.'}
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={localizeHref(locale, '/auth/login')}
          className="inline-flex min-h-11 items-center bg-brand px-4 text-meta font-bold text-paper hover:bg-brand-strong"
        >
          {ne ? 'पाठक लगइन' : 'Reader sign-in'}
        </Link>
        <Link
          href={localizeHref(locale, '/')}
          className="inline-flex min-h-11 items-center border border-rule px-4 text-meta font-bold text-ink hover:border-brand"
        >
          {ne ? 'गृहपृष्ठ' : 'Home'}
        </Link>
      </div>
    </main>
  )
}
