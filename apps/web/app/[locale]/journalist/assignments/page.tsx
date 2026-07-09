import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'

export const metadata: Metadata = { title: 'Journalist Assignments' }
export const dynamic = 'force-dynamic'

type Params = { locale: string }

export default async function JournalistAssignmentsPage({ params }: { params: Promise<Params> }) {
  const { locale } = await params
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(`/${locale === 'en' ? 'en/' : ''}journalist/login`)
  const drafts = await listJournalistDraftMeta(session.userId)
  return (
    <main className="mx-auto max-w-page px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-caption font-bold uppercase tracking-wide text-brand-strong">Reporter desk</p><h1 className="font-display text-[clamp(2rem,6vw,3rem)] font-black text-ink" lang="ne">मेरो असाइनमेन्ट</h1></div>
        <Link href={`/${locale === 'en' ? 'en/' : ''}journalist/articles/new`} className="rounded-md bg-brand px-4 py-2 text-meta font-bold text-surface hover:bg-brand-strong">New article</Link>
      </div>
      <div className="mt-6 grid gap-3">
        {drafts.length ? drafts.map((draft) => <article key={draft.articleSlug} className="rounded-xl border border-rule bg-surface-raised p-5"><h2 className="font-display text-h2 text-ink">{draft.articleSlug}</h2><p className="mt-2 text-meta text-ink-soft">{draft.reportingLocation || 'No location'} · updated {new Date(draft.updatedAt).toLocaleString()}</p><p className="mt-2 text-meta text-mute">{draft.editorPitch || 'No editor pitch yet.'}</p></article>) : <div className="rounded-xl border border-dashed border-rule p-10 text-center"><p className="font-display text-h2 text-ink" lang="ne">अझै draft छैन</p><p className="mt-2 text-meta text-mute" lang="ne">पहिलो story draft गरेर editor लाई submit गर्नुहोस्।</p></div>}
      </div>
    </main>
  )
}
