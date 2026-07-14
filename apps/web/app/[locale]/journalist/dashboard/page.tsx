import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { listJournalistDraftMeta } from '@/lib/journalist-workspace'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'Journalist dashboard', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function JournalistDashboard({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  const drafts = await listJournalistDraftMeta(session.userId)
  const roleLabel = ne ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  const review = drafts.filter((item) => item.workflowStage === 'submitted').length
  const revisions = drafts.filter((item) => item.revisionRequestedAt).length
  const latest = drafts.slice(0, 5)
  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="dashboard">
      <main className="newsroom-page">
        <header className="newsroom-page__header newsroom-page__header--hero"><div><p className="editorial-kicker" lang="en">Morning desk</p><h1>{ne ? `नमस्कार, ${session.displayName || 'रिपोर्टर'}` : `Good to see you, ${session.displayName || 'reporter'}`}</h1><p>{ne ? 'आजको लक्ष्य: प्रमाणित, स्पष्ट र सार्वजनिक महत्त्वको समाचार।' : 'Today’s brief: verified, clear, public-interest journalism.'}</p></div><Link href={localizeHref(locale, '/journalist/articles/new')} className="newsroom-primary-action">{ne ? 'नयाँ समाचार लेख्नुहोस्' : 'Write a new story'}</Link></header>
        <section className="newsroom-pulse" aria-label={ne ? 'कार्य स्थिति' : 'Work status'}><div><span>{ne ? 'कुल सामग्री' : 'All stories'}</span><strong>{drafts.length}</strong></div><div><span>{ne ? 'समीक्षामा' : 'In review'}</span><strong>{review}</strong></div><div><span>{ne ? 'संशोधन माग' : 'Revisions'}</span><strong>{revisions}</strong></div><div><span>{ne ? 'प्रकाशन अधिकार' : 'Publish access'}</span><strong>{['publisher','editor_in_chief','admin','super_admin'].includes(session.newsroomRole) ? (ne ? 'छ' : 'Yes') : (ne ? 'छैन' : 'No')}</strong></div></section>
        <div className="newsroom-dashboard-grid">
          <section className="newsroom-dashboard-grid__main"><div className="newsroom-section-title"><div><p className="editorial-kicker" lang="en">Your queue</p><h2>{ne ? 'हालका समाचार' : 'Recent stories'}</h2></div><Link href={localizeHref(locale, '/journalist/assignments')}>{ne ? 'सबै हेर्नुहोस्' : 'View all'}</Link></div>{latest.length ? <ol className="newsroom-recent-list">{latest.map((draft, index) => <li key={draft.articleSlug}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{draft.titleNe}</strong><p>{draft.categorySlug} · {draft.workflowStage}</p></div>{draft.articleId ? <Link href={localizeHref(locale, `/journalist/articles/${draft.articleId}/edit`)}>{ne ? 'सम्पादन' : 'Edit'}</Link> : null}</li>)}</ol> : <div className="newsroom-empty"><strong>{ne ? 'अहिले कुनै ड्राफ्ट छैन' : 'No drafts yet'}</strong><p>{ne ? 'पहिलो रिपोर्ट तयार गर्न नयाँ समाचार खोल्नुहोस्।' : 'Open a new story to start reporting.'}</p></div>}</section>
          <aside className="newsroom-brief"><p className="editorial-kicker" lang="en">Editorial standard</p><h2>{ne ? 'पेश गर्नुअघि चार प्रश्न' : 'Four questions before review'}</h2><ol><li><span>01</span>{ne ? 'समाचारको दाबी कुन प्रमाणमा टिकेको छ?' : 'What evidence supports the central claim?'}</li><li><span>02</span>{ne ? 'सम्बन्धित पक्षलाई प्रतिक्रिया दिन अवसर दिइयो?' : 'Was the affected party offered a response?'}</li><li><span>03</span>{ne ? 'शीर्षकले सामग्रीभन्दा बढी दाबी त गर्दैन?' : 'Does the headline overstate the reporting?'}</li><li><span>04</span>{ne ? 'ट्याग र विभाग सही छन्?' : 'Are the desk and tags accurate?'}</li></ol></aside>
        </div>
      </main>
    </JournalistWorkspaceShell>
  )
}
