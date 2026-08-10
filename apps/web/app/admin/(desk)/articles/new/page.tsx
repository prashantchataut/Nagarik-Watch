import type { Metadata } from 'next'
import { getNavCategories, getAuthors, getTags } from '@/lib/content'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canCreate } from '@/lib/admin-roles'
import { redirect } from 'next/navigation'
import { categories as seedCategories } from '@/lib/content/seed/categories'
import { safeAdminLoad, firstAdminLoadError } from '@/lib/admin/safe-load'
import { AdminLoadErrorBanner, CmsCanonicalBanner } from '@/components/admin/CmsCanonicalBanner'
import { AdminPageHeader } from '@/components/admin/primitives'
import { ArticleEditorClient } from '@/components/admin/ArticleEditorClient'
import { listMediaItems } from '@/lib/media-library'
import {
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
  payloadAdminUrl,
} from '@/lib/content/payload-admin-client'

export const metadata: Metadata = {
  title: 'नयाँ समाचार',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

export default async function NewArticlePage() {
  const session = await requireNewsroomSession()
  if (isPayloadSourceMisconfigured()) redirect('/admin/launch')
  const payloadCanonical = isPayloadCanonical()
  if (!canCreate(session.newsroomRole)) {
    redirect('/admin/articles')
  }
  if (payloadCanonical) {
    return (
      <div>
        <AdminPageHeader subtitle="Payload canonical mode सक्रिय छ" />
        <CmsCanonicalBanner />
        <div className="rounded-lg border border-rule bg-surface-raised p-5">
          <p className="text-meta font-semibold text-ink" lang="ne">
            नयाँ लेख Payload CMS बाट बनाउनुहोस् ताकि प्रकाशित सामग्री सीधै पाठक-साइटमा देखियोस्।
          </p>
          <p className="mt-2 text-caption text-ink-soft">
            <a
              href={payloadAdminUrl()}
              className="text-brand-strong underline-offset-2 hover:underline"
            >
              {payloadAdminUrl()}
            </a>
          </p>
        </div>
      </div>
    )
  }

  const [categoriesResult, tagsResult, authorsResult, mediaLibrary] = await Promise.all([
    safeAdminLoad(
      'new-categories',
      () => getNavCategories(),
      seedCategories.filter((c) => c.showInNav),
    ),
    safeAdminLoad('new-tags', () => getTags(), []),
    safeAdminLoad('new-authors', () => getAuthors(), []),
    listMediaItems({ limit: 60 }).catch(() => []),
  ])
  const loadError = firstAdminLoadError(categoriesResult, tagsResult, authorsResult)

  return (
    <div>
      <AdminPageHeader subtitle="शीर्षक र मूल भाग लेख्नुहोस्। साइडबारबाट विभाग, फोटो र प्रकाशन चरण मिलाउनुहोस्।" />
      <CmsCanonicalBanner />
      <AdminLoadErrorBanner message={loadError} />
      <ArticleEditorClient
        categories={categoriesResult.value}
        tags={tagsResult.value}
        authors={authorsResult.value}
        role={session.newsroomRole}
        isNew
        mediaLibrary={mediaLibrary}
      />
    </div>
  )
}
