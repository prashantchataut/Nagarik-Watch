import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { ChangePasswordForm } from '@/components/reader/ChangePasswordForm'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Change password', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  const session = await getSession()
  if (!session) redirect(locale === 'en' ? '/en/auth/login' : '/auth/login')
  return <ReaderAuthShell locale={locale} mode="change"><ChangePasswordForm locale={locale} /></ReaderAuthShell>
}
