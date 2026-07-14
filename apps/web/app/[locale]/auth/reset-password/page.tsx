import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { PasswordResetForm } from '@/components/reader/PasswordResetForm'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false, follow: false } }
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string; error?: string; next?: string }> }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  const locale = raw === 'en' ? 'en' : 'ne'
  const token = typeof query.token === 'string' && query.token.trim() ? query.token.trim() : null
  return <ReaderAuthShell locale={locale} mode="reset"><PasswordResetForm locale={locale} token={token} invalidToken={Boolean(query.error)} next={query.next ?? null} /></ReaderAuthShell>
}
