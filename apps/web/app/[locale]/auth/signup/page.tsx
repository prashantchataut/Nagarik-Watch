import type { Metadata } from 'next'
import { ReaderSignupForm } from '@/components/reader/ReaderSignupForm'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { isGoogleAuthConfigured } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'पाठक खाता बनाउनुहोस्',
  robots: { index: false, follow: false },
}
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string }> }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  const locale = raw === 'en' ? 'en' : 'ne'
  return <ReaderAuthShell locale={locale} mode="signup"><ReaderSignupForm locale={locale} next={query.next ?? null} googleEnabled={isGoogleAuthConfigured()} /></ReaderAuthShell>
}
