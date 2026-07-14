import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'Editor feedback', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function JournalistFeedbackPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(localizeHref(locale, '/journalist/login'))
  const feedback = (await listJournalistDraftMeta(session.userId)).filter((item) => item.editorFeedback || item.revisionRequestedAt)
  const roleLabel = ne ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="feedback">
      <main className="newsroom-page"><header className="newsroom-page__header"><div><p className="editorial-kicker" lang="en">Revision desk</p><h1>{ne ? 'सम्पादकीय प्रतिक्रिया' : 'Editor feedback'}</h1><p>{ne ? 'संशोधन माग, स्वीकृति नोट र सामग्रीगत निर्देशन।' : 'Revision requests, approval notes and editorial guidance.'}</p></div></header>
      <div className="feedback-ledger">{feedback.length ? feedback.map((item) => <article key={item.articleSlug}><div><p>{item.categorySlug} · {item.workflowStage}</p><h2>{item.titleNe}</h2><blockquote>{item.editorFeedback}</blockquote><small>{item.revisionRequestedAt ? new Date(item.revisionRequestedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB') : new Date(item.updatedAt).toLocaleString(ne ? 'ne-NP' : 'en-GB')}</small></div>{item.articleId ? <Link href={localizeHref(locale, `/journalist/articles/${item.articleId}/edit`)}>{ne ? 'संशोधन खोल्नुहोस्' : 'Open revision'}</Link> : null}</article>) : <div className="newsroom-empty"><strong>{ne ? 'अहिले नयाँ प्रतिक्रिया छैन' : 'No new feedback'}</strong><p>{ne ? 'सम्पादकले संशोधन वा स्वीकृति नोट पठाएपछि यहाँ देखिन्छ।' : 'Revision and approval notes will appear here when an editor sends them.'}</p></div>}</div></main>
    </JournalistWorkspaceShell>
  )
}
