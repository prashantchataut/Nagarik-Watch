import type { Metadata } from 'next'
import { ReaderAuthShell } from '@/components/auth/ReaderAuthShell'
import { AcceptNewsroomInvite } from '@/components/auth/AcceptNewsroomInvite'

export const dynamic = 'force-static'
export const metadata: Metadata = { title: 'Newsroom invitation', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: raw } = await params
  const locale = raw === 'en' ? 'en' : 'ne'
  return (
    <ReaderAuthShell locale={locale} mode="invite">
      <AcceptNewsroomInvite locale={locale} token={null} signedIn={false} />
    </ReaderAuthShell>
  )
}
