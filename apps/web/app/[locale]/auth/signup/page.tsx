import type { Metadata } from 'next'
import { ReaderSignupForm } from '@/components/reader/ReaderSignupForm'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'

export const metadata: Metadata = { title: 'Create reader account', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return <ReaderAuthShell locale={locale} mode="signup"><ReaderSignupForm locale={locale} /></ReaderAuthShell>
}
