import type { Metadata } from 'next'
import { ReaderLoginForm } from '@/components/reader/ReaderLoginForm'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'

export const metadata: Metadata = { title: 'Reader login', robots: { index: false, follow: false } }
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return <ReaderAuthShell locale={locale} mode="login"><ReaderLoginForm locale={locale} /></ReaderAuthShell>
}
