import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { ReaderLoginForm } from '@/components/reader/ReaderLoginForm'
import { isGoogleAuthPublicEnabled } from '@/lib/auth/flags'

export const dynamic = 'force-static'

export const metadata: Metadata = {
  title: 'पाठक लगइन',
  robots: { index: false, follow: false },
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="login">
      <ReaderLoginForm locale={locale} googleEnabled={isGoogleAuthPublicEnabled()} />
    </ReaderAuthShell>
  )
}
