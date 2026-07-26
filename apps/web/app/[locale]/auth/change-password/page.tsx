import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { ChangePasswordForm } from '@/components/reader/ChangePasswordForm'
import Link from 'next/link'
import { localizeHref } from '@/lib/i18n/locales'

export const dynamic = 'force-static'

export const metadata: Metadata = { title: 'Change password', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  const ne = locale === 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="change">
      <p className="mb-4 text-meta text-ink-soft" lang={ne ? 'ne' : 'en'}>
        {ne
          ? 'पासवर्ड बदल्न लगइन आवश्यक छ। API उपलब्ध नभए फारम असफल हुन सक्छ।'
          : 'Sign-in is required to change password. The form may fail when the auth API is offline.'}{' '}
        <Link href={localizeHref(locale, '/auth/login')} className="font-bold text-brand-strong underline-offset-2 hover:underline">
          {ne ? 'लगइन' : 'Sign in'}
        </Link>
      </p>
      <ChangePasswordForm locale={locale} />
    </ReaderAuthShell>
  )
}
