import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { PasswordResetRequestForm } from '@/components/reader/PasswordResetRequestForm'

export const dynamic = 'force-static'

export const metadata: Metadata = { title: 'Reset password', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="recover">
      <PasswordResetRequestForm locale={locale} />
    </ReaderAuthShell>
  )
}
