import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNavCategories, getTags } from '@/lib/content'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import {
  JOURNALIST_DESK_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
  type NewsroomRole,
} from '@/lib/admin-roles'
import { JournalistArticleDraftForm } from '@/components/journalist/JournalistArticleDraftForm'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'

export const metadata: Metadata = { title: 'New journalist article', robots: { index: false, follow: false } }
export const dynamic = 'force-dynamic'

const TEMPLATES: Record<string, string> = {
  spot: '## के भयो\n\n[घटनाको मुख्य तथ्य: को, के, कहिले, कहाँ]\n\n## किन महत्त्वपूर्ण\n\n[पाठकलाई किन चासो]\n\n## के भन्छन् सम्बन्धित पक्ष\n\n> [उद्धरण]\n\n## अगाडि के हुन्छ\n\n[अर्को कदम / अनुसन्धान बाँकी]',
  explain: '## प्रश्न\n\n[पाठकको मुख्य प्रश्न]\n\n## छोटो उत्तर\n\n[२–३ वाक्य]\n\n## पृष्ठभूमि\n\n[आवश्यक सन्दर्भ]\n\n## के जाँच गर्नुपर्छ\n\n- [बिन्दु १]\n- [बिन्दु २]',
  interview: '## परिचय\n\n[अतिथि को हुन्, किन अहिले]\n\n## प्रश्न १\n\n> उत्तर…\n\n## प्रश्न २\n\n> उत्तर…\n\n## अन्तिम टिप्पणी\n\n[सम्पादकीय नोट: वैकल्पिक]',
}

function canWrite(role: NewsroomRole) {
  return JOURNALIST_DESK_ROLES.has(role) || role === 'copy_editor' || role === 'fact_checker'
}

export default async function JournalistNewArticle({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ template?: string }>
}) {
  const locale: Locale = asLocale((await params).locale)
  const { template } = await searchParams
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!canWrite(session.newsroomRole)) redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  const [categories, tags] = await Promise.all([getNavCategories(), getTags()])
  const roleLabel = locale === 'ne' ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole] : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  const bodyNe = template && TEMPLATES[template] ? TEMPLATES[template] : undefined
  return (
    <JournalistWorkspaceShell locale={locale} name={session.displayName || session.email} roleLabel={roleLabel} active="new">
      <JournalistArticleDraftForm
        locale={locale}
        categories={categories}
        tags={tags}
        initial={bodyNe ? { bodyNe } : undefined}
      />
    </JournalistWorkspaceShell>
  )
}
