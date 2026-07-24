import type { Metadata } from 'next'
import { ReaderLoginForm } from '@/components/reader/ReaderLoginForm'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { isGoogleAuthConfigured } from '@/lib/auth'

export const metadata: Metadata = {
  title: 'पाठक लगइन',
  robots: { index: false, follow: false },
}
export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ next?: string; reset?: string; invite?: string }> }) {
  const [{ locale: raw }, query] = await Promise.all([params, searchParams])
  const locale = raw === 'en' ? 'en' : 'ne'
  const notice = query.reset === 'success' ? 'reset' : query.invite === 'accepted' ? 'invite' : null
  return <ReaderAuthShell locale={locale} mode="login"><ReaderLoginForm locale={locale} next={query.next ?? null} notice={notice} googleEnabled={isGoogleAuthConfigured()} /></ReaderAuthShell>
}
