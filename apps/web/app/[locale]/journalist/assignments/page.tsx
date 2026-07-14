import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'My newsroom stories', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function JournalistAssignmentsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  const drafts = await listJournalistDraftMeta(session.userId)
  const roleLabel = ne ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  const grouped = {
    revision: drafts.filter((item) => item.revisionRequestedAt),
    review: drafts.filter((item) => item.workflowStage === 'submitted' && !item.revisionRequestedAt),
    draft: drafts.filter((item) => item.workflowStage !== 'submitted' && !item.revisionRequestedAt),
  }
  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="assignments">
      <main className="newsroom-page">
        <header className="newsroom-page__header"><div><p className="editorial-kicker" lang="en">Story queue</p><h1>{ne ? 'मेरा समाचार' : 'My stories'}</h1><p>{ne ? 'ड्राफ्ट, समीक्षामा रहेका सामग्री र संशोधन माग एउटै ठाउँमा।' : 'Drafts, stories in review and revision requests in one place.'}</p></div><Link href={localizeHref(locale, '/journalist/articles/new')} className="newsroom-primary-action">{ne ? 'नयाँ समाचार' : 'New story'}</Link></header>
        <section className="newsroom-queue-summary"><div><strong>{grouped.draft.length}</strong><span>{ne ? 'ड्राफ्ट' : 'Drafts'}</span></div><div><strong>{grouped.review.length}</strong><span>{ne ? 'समीक्षामा' : 'In review'}</span></div><div><strong>{grouped.revision.length}</strong><span>{ne ? 'संशोधन' : 'Revisions'}</span></div></section>
        <div className="newsroom-story-list">
          {drafts.length ? drafts.map((draft, index) => (
            <article key={draft.articleSlug} data-stage={draft.revisionRequestedAt ? 'revision' : draft.workflowStage}>
              <span className="newsroom-story-list__index">{String(index + 1).padStart(2, '0')}</span>
              <div><p className="newsroom-story-list__meta">{draft.categorySlug || (ne ? 'विभाग नखुलेको' : 'No desk')} · {draft.workflowStage}</p><h2>{draft.titleNe || draft.articleSlug}</h2><p>{draft.editorFeedback || draft.editorPitch || (ne ? 'सम्पादकीय नोट छैन।' : 'No editorial note yet.')}</p><small>{ne ? 'अन्तिम परिवर्तन' : 'Last changed'} {new Date(draft.updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}</small></div>
              {draft.articleId ? <Link href={localizeHref(locale, `/journalist/articles/${draft.articleId}/edit`)}>{ne ? 'खोल्नुहोस्' : 'Open'}</Link> : <span className="newsroom-story-list__legacy">{ne ? 'Legacy draft' : 'Legacy draft'}</span>}
            </article>
          )) : <div className="newsroom-empty"><strong>{ne ? 'पहिलो समाचारबाट सुरु गर्नुहोस्' : 'Start with your first story'}</strong><p>{ne ? 'रिपोर्टिङ नोटसहित ड्राफ्ट लेख्नुहोस् र समीक्षामा पठाउनुहोस्।' : 'Write a sourced draft and submit it for editorial review.'}</p><Link href={localizeHref(locale, '/journalist/articles/new')}>{ne ? 'नयाँ ड्राफ्ट' : 'Create draft'}</Link></div>}
        </div>
      </main>
    </JournalistWorkspaceShell>
  )
}
