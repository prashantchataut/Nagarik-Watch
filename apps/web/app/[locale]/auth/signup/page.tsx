import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { ReaderSignupForm } from '@/components/reader/ReaderSignupForm'
import { isGoogleAuthPublicEnabled } from '@/lib/auth/flags'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'पाठक खाता बनाउनुहोस्',
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
    <ReaderAuthShell locale={locale} mode="signup">
      <ReaderSignupForm
        locale={locale}
        googleEnabled={isGoogleAuthPublicEnabled()}
        next={query.next ?? null}
      />
    </ReaderAuthShell>
  )
}
