import type { Metadata } from 'next'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/admin-roles'
import { redirect } from 'next/navigation'
import { getEditorPreferences } from '@/lib/editor-preferences'
import { listContentCategories } from '@/lib/taxonomy-admin'
import { AdminPageHeader, AdminCard } from '@/components/admin/primitives'
import { EditorPreferencesForm } from '@/components/newsroom/EditorPreferencesForm'

export const metadata: Metadata = {
  title: 'सम्पादक प्राथमिकता',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function EditorPreferencesPage() {
  const session = await requireNewsroomSession()
  if (!canEdit(session.newsroomRole)) {
    redirect('/admin/dashboard')
  }
  const [preferences, categories] = await Promise.all([
    getEditorPreferences(session.userId),
    listContentCategories(),
  ])

  return (
    <div>
      <AdminPageHeader subtitle="Desk density, default category, autosave and formatting hints for the article editor" />
      <AdminCard>
        <EditorPreferencesForm
          locale="ne"
          initial={preferences}
          categories={categories}
          variant="admin"
        />
      </AdminCard>
    </div>
  )
}
