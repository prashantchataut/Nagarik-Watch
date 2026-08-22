import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { AcceptNewsroomInvite } from '@/components/auth/AcceptNewsroomInvite'
import { getSession } from '@/lib/auth/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Newsroom invitation',
  robots: { index: false, follow: false },
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const [{ locale: raw }, query, session] = await Promise.all([params, searchParams, getSession()])
  const locale = raw === 'en' ? 'en' : 'ne'
  const token = typeof query.token === 'string' && query.token.trim() ? query.token.trim() : null

  return (
    <ReaderAuthShell locale={locale} mode="invite">
      <AcceptNewsroomInvite locale={locale} token={token} signedIn={Boolean(session)} />
    </ReaderAuthShell>
  )
}
