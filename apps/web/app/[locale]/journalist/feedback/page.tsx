import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES } from '@/lib/admin-roles'

export const metadata: Metadata = { title: 'Editor Feedback' }
export const dynamic = 'force-dynamic'

type Params = { locale: string }

export default async function JournalistFeedbackPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(`/${locale === 'en' ? 'en/' : ''}journalist/login`)
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="rounded-2xl border border-rule bg-surface-raised p-6">
        <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">Editor feedback</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] font-black text-ink" lang="ne">सम्पादकीय प्रतिक्रिया</h1>
        <div className="mt-6 rounded-xl border border-dashed border-rule p-10 text-center">
          <p className="font-display text-h2 text-ink" lang="ne">अहिले नयाँ feedback छैन</p>
          <p className="mt-2 text-meta text-mute" lang="ne">Editor ले revision request, approval note वा rejection reason पठाएपछि यहाँ देखिन्छ।</p>
        </div>
      </div>
    </main>
  )
}
