import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { PasswordResetRequestForm } from '@/components/reader/PasswordResetRequestForm'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ next?: string }>
}) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  const locale = raw === 'en' ? 'en' : 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="recover">
      <PasswordResetRequestForm locale={locale} next={query.next ?? null} />
    </ReaderAuthShell>
  )
}
