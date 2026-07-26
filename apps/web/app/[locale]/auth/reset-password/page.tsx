import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { PasswordResetForm } from '@/components/reader/PasswordResetForm'

export const dynamic = 'force-static'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="reset">
      <PasswordResetForm locale={locale} token={null} invalidToken={false} />
    </ReaderAuthShell>
  )
}
