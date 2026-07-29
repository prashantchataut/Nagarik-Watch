import type { Metadata } from 'next'
import { getNavCategories, getAuthors, getTags } from '@/lib/content'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate } from '@/lib/admin-roles'
import { redirect } from 'next/navigation'
import { AdminPageHeader } from '@/components/admin/primitives'
import { ArticleEditor } from '@/components/admin/ArticleEditor'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { listMediaItems } from '@/lib/media-library'

export const metadata: Metadata = {
  title: 'New Article',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const session = await requireNewsroomSession()
  if (!canCreate(session.newsroomRole)) {
    redirect('/admin/articles')
  }
  if (isPayloadCanonical()) redirect(`${payloadCollectionAdminUrl('articles')}/create`)

  const [categories, tags, authors, mediaLibrary] = await Promise.all([
    getNavCategories(),
    getTags(),
    getAuthors(),
    listMediaItems({ limit: 60 }).catch(() => []),
  ])

  return (
    <div>
      <AdminPageHeader
        subtitle="नयाँ समाचार लेख्न सुरु गर्नुहोस्। ड्राफ्ट बचत गर्न सक्नुहुन्छ।"
      />
      <ArticleEditor
        categories={categories}
        tags={tags}
        authors={authors}
        role={session.newsroomRole}
        isNew
        mediaLibrary={mediaLibrary}
      />
    </div>
  )
}
