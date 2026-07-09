import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'

export const metadata: Metadata = { title: 'Journalist Profile' }
export const dynamic = 'force-dynamic'

type Params = { locale: string }

export default async function JournalistProfilePage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(`/${locale === 'en' ? 'en/' : ''}journalist/login`)
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="rounded-2xl border border-rule bg-surface-raised p-6">
        <p className="text-caption font-bold uppercase tracking-wide text-brand-strong">Reporter identity</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,6vw,3rem)] font-black text-ink" lang="ne">मेरो प्रोफाइल</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-rule bg-surface p-4"><p className="text-caption text-mute">Name</p><p className="font-display text-h2 text-ink">{session.displayName ?? session.email}</p></div>
          <div className="rounded-lg border border-rule bg-surface p-4"><p className="text-caption text-mute">Role</p><p className="font-display text-h2 text-ink" lang="ne">{NEWSROOM_ROLE_LABELS_NE[session.newsroomRole]}</p></div>
          <div className="rounded-lg border border-rule bg-surface p-4 md:col-span-2"><p className="text-caption text-mute">Custom byline guidance</p><p className="mt-2 text-meta leading-7 text-ink-soft" lang="ne">लेख submit गर्दा source note, reporting location, homepage teaser र social text भर्नुहोस्। Admin/editor ले feedback यही reporter workspace बाट दिन्छ।</p></div>
        </div>
      </div>
    </main>
  )
}
