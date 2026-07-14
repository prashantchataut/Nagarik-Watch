import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNavCategories, getTags } from '@/lib/content'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { CONTRIBUTOR_ROLES, NEWSROOM_ROLE_LABELS_EN, NEWSROOM_ROLE_LABELS_NE } from '@/lib/admin-roles'
import { JournalistArticleDraftForm } from '@/components/journalist/JournalistArticleDraftForm'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'New journalist article', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

export default async function JournalistNewArticle({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const session = await getNewsroomSession()
  if (!session || !CONTRIBUTOR_ROLES.has(session.newsroomRole)) redirect(localizeHref(locale, '/journalist/login'))
  const [categories, tags] = await Promise.all([getNavCategories(), getTags()])
  const roleLabel = locale === 'ne' ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="new">
      <JournalistArticleDraftForm locale={locale} categories={categories} tags={tags} />
    </JournalistWorkspaceShell>
  )
}
