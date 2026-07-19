import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { scoreAssignment } from '@/lib/journalist/desk-scoring'
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
  const scoredDrafts = [...drafts]
    .map((draft) => {
      const hoursSinceUpdate = Math.max(
        0,
        (Date.now() - Date.parse(draft.updatedAt)) / 3_600_000,
      )
      const desk = scoreAssignment({
        deadlineHours: draft.revisionRequestedAt ? 6 : draft.workflowStage === 'submitted' ? 12 : 36,
        coverageGap: draft.revisionRequestedAt ? 0.9 : draft.workflowStage === 'submitted' ? 0.6 : 0.3,
        checklistRemaining: draft.revisionRequestedAt ? 3 : draft.workflowStage === 'submitted' ? 1 : 0,
        hoursLeft: Math.max(1, 48 - hoursSinceUpdate),
      })
      return { draft, desk }
    })
    .sort((a, b) => b.desk.deskScore - a.desk.deskScore)
  const grouped = {
    revision: drafts.filter((item) => item.revisionRequestedAt),
    review: drafts.filter((item) => item.workflowStage === 'submitted' && !item.revisionRequestedAt),
    draft: drafts.filter((item) => item.workflowStage !== 'submitted' && !item.revisionRequestedAt),
  }

  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="assignments">
      <main className="newsroom-page">
        <header className="newsroom-page__header">
          <h1>{ne ? 'मेरा समाचार' : 'My stories'}</h1>
        </header>

        <dl className="newsroom-queue-summary" aria-label={ne ? 'कतार सारांश' : 'Queue summary'}>
          <div>
            <dt>{ne ? 'ड्राफ्ट' : 'Drafts'}</dt>
            <dd>{grouped.draft.length}</dd>
          </div>
          <div>
            <dt>{ne ? 'समीक्षामा' : 'In review'}</dt>
            <dd>{grouped.review.length}</dd>
          </div>
          <div>
            <dt>{ne ? 'संशोधन' : 'Revisions'}</dt>
            <dd>{grouped.revision.length}</dd>
          </div>
        </dl>

        <div className="newsroom-story-list">
          {scoredDrafts.length ? scoredDrafts.map(({ draft, desk }, index) => (
            <article key={draft.articleSlug} data-stage={draft.revisionRequestedAt ? 'revision' : draft.workflowStage}>
              <span className="newsroom-story-list__index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <p className="newsroom-story-list__meta">
                  {draft.categorySlug || (ne ? 'विभाग नखुलेको' : 'No desk')} · {draft.workflowStage} · {ne ? 'प्राथमिकता' : 'priority'} {desk.deskScore.toFixed(2)}
                </p>
                <h2>{draft.titleNe || draft.articleSlug}</h2>
                <p>{draft.editorFeedback || draft.editorPitch || (ne ? 'सम्पादकीय नोट छैन।' : 'No editorial note yet.')}</p>
                <small>{ne ? 'अन्तिम परिवर्तन' : 'Last changed'} {new Date(draft.updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}</small>
              </div>
              {draft.articleId ? (
                <Link href={localizeHref(locale, `/journalist/articles/${draft.articleId}/edit`)}>{ne ? 'खोल्नुहोस्' : 'Open'}</Link>
              ) : (
                <span className="newsroom-story-list__legacy">{ne ? 'Legacy draft' : 'Legacy draft'}</span>
              )}
            </article>
          )) : (
            <div className="newsroom-empty">
              <strong>{ne ? 'पहिलो समाचारबाट सुरु गर्नुहोस्' : 'Start with your first story'}</strong>
              <p>{ne ? 'रिपोर्टिङ नोटसहित ड्राफ्ट लेख्नुहोस् र समीक्षामा पठाउनुहोस्।' : 'Write a sourced draft and submit it for editorial review.'}</p>
            </div>
          )}
        </div>
      </main>
    </JournalistWorkspaceShell>
  )
}
