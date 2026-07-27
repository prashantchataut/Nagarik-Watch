import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { ReaderProfileClient } from '@/components/reader/ReaderProfileClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Your Nagarik Watch account and saved stories.',
  robots: { index: false, follow: false },
}

export default async function ReaderProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  return <ReaderProfileClient locale={locale} />
}
