import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { getSession } from '@/lib/auth/session'
import { ReaderProfileClient } from '@/components/reader/ReaderProfileClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Account',
  description: 'Your Nagarik Watch account and saved stories.',
  robots: { index: false, follow: false },
}

export default async function ReaderProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale: Locale = asLocale((await params).locale)
  const session = await getSession()
  return <ReaderProfileClient locale={locale} session={session} />
}
