import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = {
  title: 'My drafts',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function JournalistAssignmentsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole)) {
    redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  }
  const drafts = await listJournalistDraftMeta(session.userId)
  const roleLabel = ne
    ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole]
    : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]

  const sorted = [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const grouped = {
    revision: drafts.filter((item) => item.revisionRequestedAt),
    review: drafts.filter((item) => item.workflowStage === 'submitted' && !item.revisionRequestedAt),
    draft: drafts.filter((item) => item.workflowStage !== 'submitted' && !item.revisionRequestedAt),
  }

  return (
    <JournalistWorkspaceShell
      locale={locale}
      name={session.displayName || session.email}
      roleLabel={roleLabel}
      active="assignments"
    >
      <main className="newsroom-page">
        <header className="newsroom-page__header">
          <div>
            <h1>{ne ? 'मेरा ड्राफ्ट' : 'My drafts'}</h1>
            <p>
              {ne
                ? 'तपाईंका ड्राफ्ट, समीक्षामा रहेका र संशोधन अनुरोध भएका कथा।'
                : 'Your drafts, stories in review, and pieces with revision requests.'}
            </p>
          </div>
          <div className="newsroom-page__header-actions">
            <Link
              className="newsroom-primary-action"
              href={localizeHref(locale, '/journalist/articles/new')}
            >
              {ne ? 'नयाँ ड्राफ्ट' : 'New draft'}
            </Link>
          </div>
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
          {sorted.length ? (
            sorted.map((draft, index) => (
              <article
                key={draft.articleSlug}
                data-stage={draft.revisionRequestedAt ? 'revision' : draft.workflowStage}
              >
                <span className="newsroom-story-list__index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div>
                  <p className="newsroom-story-list__meta">
                    {draft.categorySlug || (ne ? 'विभाग नखुलेको' : 'No desk')}
                    {' · '}
                    {stageLabel(draft.workflowStage, ne)}
                    {draft.revisionRequestedAt
                      ? ne
                        ? ' · संशोधन अनुरोध'
                        : ' · revision requested'
                      : ''}
                  </p>
                  <h2>{draft.titleNe || draft.articleSlug}</h2>
                  <p>
                    {draft.editorFeedback ||
                      draft.editorPitch ||
                      (ne ? 'सम्पादकीय नोट छैन।' : 'No editorial note yet.')}
                  </p>
                  <small>
                    {ne ? 'अन्तिम परिवर्तन' : 'Last changed'}{' '}
                    {new Date(draft.updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}
                  </small>
                </div>
                {draft.articleId ? (
                  <Link
                    href={localizeHref(locale, `/journalist/articles/${draft.articleId}/edit`)}
                  >
                    {ne ? 'खोल्नुहोस्' : 'Open'}
                  </Link>
                ) : (
                  <span className="newsroom-story-list__legacy">
                    {ne ? 'पुरानो ड्राफ्ट' : 'Legacy draft'}
                  </span>
                )}
              </article>
            ))
          ) : (
            <p className="newsroom-empty">
              {ne
                ? 'अहिले ड्राफ्ट छैन। नयाँ कथा सुरु गर्नुहोस्।'
                : 'No drafts yet. Start a new story.'}
            </p>
          )}
        </div>
      </main>
    </JournalistWorkspaceShell>
  )
}

function stageLabel(stage: string, ne: boolean) {
  if (stage === 'submitted') return ne ? 'समीक्षामा' : 'In review'
  if (stage === 'published') return ne ? 'प्रकाशित' : 'Published'
  return ne ? 'ड्राफ्ट' : 'Draft'
}
