import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import {
  CONTRIBUTOR_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
} from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = {
  title: 'Journalist dashboard',
  robots: { index: false, follow: false },
}
export const dynamic = 'force-dynamic'

export default async function JournalistDashboard({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole))
    redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  const drafts = await listJournalistDraftMeta(session.userId)
  const roleLabel = ne
    ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole]
    : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  const review = drafts.filter((item) => item.workflowStage === 'submitted').length
  const revisions = drafts.filter((item) => item.revisionRequestedAt).length
  const latest = drafts.slice(0, 5)
  const canPublish = ['publisher', 'editor_in_chief', 'admin', 'super_admin'].includes(
    session.newsroomRole,
  )

  return (
    <JournalistWorkspaceShell
      locale={locale}
      name={session.displayName || session.email}
      roleLabel={roleLabel}
      active="dashboard"
    >
      <main className="newsroom-page">
        <header className="newsroom-page__header">
          <div>
            <h1>{ne ? 'समाचार डेस्क' : 'News desk'}</h1>
            <p>
              {ne
                ? 'तपाईंका ड्राफ्ट, समीक्षा र सम्पादकीय प्रतिक्रियाको आजको कार्यदृश्य।'
                : 'Your current view of drafts, review status and editorial feedback.'}
            </p>
          </div>
          <div className="newsroom-page__header-actions">
            <Link
              className="newsroom-primary-action"
              href={localizeHref(locale, '/journalist/articles/new')}
            >
              {ne ? 'नयाँ ड्राफ्ट' : 'New draft'}
            </Link>
            <Link
              className="newsroom-inline-link"
              href={localizeHref(locale, '/journalist/feedback')}
            >
              {ne ? 'प्रतिक्रिया' : 'Feedback'}
            </Link>
          </div>
        </header>

        <dl className="newsroom-pulse" aria-label={ne ? 'कार्य स्थिति' : 'Work status'}>
          <div>
            <dt>{ne ? 'कुल सामग्री' : 'All stories'}</dt>
            <dd>{drafts.length}</dd>
          </div>
          <div>
            <dt>{ne ? 'समीक्षामा' : 'In review'}</dt>
            <dd>{review}</dd>
          </div>
          <div>
            <dt>{ne ? 'संशोधन माग' : 'Revisions'}</dt>
            <dd>{revisions}</dd>
          </div>
          {canPublish ? (
            <div>
              <dt>{ne ? 'भूमिका' : 'Role'}</dt>
              <dd>{roleLabel}</dd>
            </div>
          ) : (
            <div>
              <dt>{ne ? 'अर्को कदम' : 'Next step'}</dt>
              <dd>{ne ? 'ड्राफ्ट' : 'Draft'}</dd>
            </div>
          )}
        </dl>

        <div className="newsroom-dashboard-grid">
          <section className="newsroom-dashboard-grid__main">
            <div className="newsroom-section-title">
              <h2>{ne ? 'हालका समाचार' : 'Recent stories'}</h2>
              <Link href={localizeHref(locale, '/journalist/assignments')}>
                {ne ? 'सबै' : 'View all'}
              </Link>
            </div>
            {latest.length ? (
              <ol className="newsroom-recent-list">
                {latest.map((draft, index) => (
                  <li key={draft.articleSlug}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{draft.titleNe}</strong>
                      <p>
                        {draft.categorySlug} · {stageLabel(draft.workflowStage, ne)}
                      </p>
                    </div>
                    {draft.articleId ? (
                      <Link
                        href={localizeHref(locale, `/journalist/articles/${draft.articleId}/edit`)}
                      >
                        {ne ? 'सम्पादन' : 'Edit'}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="newsroom-empty">
                <strong>{ne ? 'अहिले कुनै ड्राफ्ट छैन' : 'No drafts yet'}</strong>
                <p>
                  {ne
                    ? 'साइडबार वा मोबाइल बारबाट नयाँ ड्राफ्ट खोल्नुहोस्।'
                    : 'Open a new draft from the sidebar or mobile bar.'}
                </p>
              </div>
            )}
          </section>

          <aside className="newsroom-brief">
            <h2>{ne ? 'यस सिफ्टका काम' : 'This shift'}</h2>
            <ol>
              <li>
                <span>{ne ? 'उपकरण' : 'Tools'}</span>
                <Link href={localizeHref(locale, '/journalist/tools')}>
                  {ne ? 'ढाँचा, शैली नोट र चेकलिस्ट' : 'Templates, style notes and checklists'}
                </Link>
              </li>
              <li>
                <span>{ne ? 'स्थलगत' : 'Spot'}</span>
                <Link href={localizeHref(locale, '/journalist/articles/new?template=spot')}>
                  {ne ? 'छिटो फाइलिङका लागि स्थलगत ड्राफ्ट' : 'Start a fast field filing draft'}
                </Link>
              </li>
              <li>
                <span>{ne ? 'व्याख्या' : 'Explainer'}</span>
                <Link href={localizeHref(locale, '/journalist/articles/new?template=explain')}>
                  {ne ? 'प्रसंगसहित व्याख्यात्मक ड्राफ्ट' : 'Open an explainer with context blocks'}
                </Link>
              </li>
              <li>
                <span>{ne ? 'प्रतिक्रिया' : 'Feedback'}</span>
                <Link href={localizeHref(locale, '/journalist/feedback')}>
                  {ne
                    ? 'सम्पादक प्रतिक्रिया र संशोधन हेर्नुहोस्'
                    : 'Review editor feedback and revisions'}
                </Link>
              </li>
            </ol>
          </aside>
        </div>
      </main>
    </JournalistWorkspaceShell>
  )
}

function stageLabel(stage: string, ne: boolean) {
  if (stage === 'submitted') return ne ? 'समीक्षामा' : 'In review'
  if (stage === 'published') return ne ? 'प्रकाशित' : 'Published'
  if (stage === 'updated') return ne ? 'अद्यावधिक' : 'Updated'
  return ne ? 'ड्राफ्ट' : 'Draft'
}
