import { staticArticleIdParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getNavCategories, getAuthors, getTags } from '@/lib/content'
import { findArticleForAdmin } from '@/lib/content/store/json-store'
import { requireNewsroomSession } from '@/lib/auth/session'
import { canEdit } from '@/lib/admin-roles'
import { categories as seedCategories } from '@/lib/content/seed/categories'
import { firstAdminLoadError, safeAdminLoad } from '@/lib/admin/safe-load'
import { AdminLoadErrorBanner, CmsCanonicalBanner } from '@/components/admin/CmsCanonicalBanner'
import { AdminButton, AdminPageHeader } from '@/components/admin/primitives'
import { ArticleEditorClient } from '@/components/admin/ArticleEditorClient'
import { listMediaItems } from '@/lib/media-library'
import { shorthandFromBlocks } from '@/lib/content/blocks'
import {
  isPayloadCanonical,
  isPayloadSourceMisconfigured,
  payloadAdminUrl,
} from '@/lib/content/payload-admin-client'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return staticArticleIdParams()
}

export const metadata: Metadata = {
  title: 'समाचार सम्पादन',
  robots: { index: false, follow: false },
}

export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireNewsroomSession()
  if (isPayloadSourceMisconfigured()) redirect('/admin/launch')
  const payloadCanonical = isPayloadCanonical()
  if (!canEdit(session.newsroomRole)) {
    return (
      <div
        className="rounded-sm border border-breaking/30 bg-brand-tint p-4 text-meta font-semibold text-brand-strong"
        lang="ne"
      >
        यो लेख सम्पादन गर्ने अनुमति छैन।
      </div>
    )
  }
  if (payloadCanonical) {
    return (
      <div>
        <AdminPageHeader subtitle="Payload canonical mode सक्रिय छ" />
        <CmsCanonicalBanner />
        <div className="rounded-sm border border-rule bg-surface-raised p-5">
          <p className="text-meta font-semibold text-ink" lang="ne">
            यो लेख Payload CMS बाट सम्पादन गर्नुहोस् ताकि प्रकाशन परिवर्तन सीधै पाठक-साइटमा लागु
            होस्।
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
  const { id } = await params

  const [categoriesResult, tagsResult, authorsResult, mediaLibrary, articleResult] =
    await Promise.all([
      safeAdminLoad(
        'edit-categories',
        () => getNavCategories(),
        seedCategories.filter((c) => c.showInNav),
      ),
      safeAdminLoad('edit-tags', () => getTags(), []),
      safeAdminLoad('edit-authors', () => getAuthors(), []),
      listMediaItems({ limit: 60 }).catch(() => []),
      safeAdminLoad('edit-article', () => findArticleForAdmin(id), null),
    ])
  const loadError = firstAdminLoadError(categoriesResult, tagsResult, authorsResult, articleResult)
  const article = articleResult.value

  if (!article) {
    return (
      <div>
        <AdminPageHeader subtitle="समाचार फेला परेन" />
        <CmsCanonicalBanner />
        <AdminLoadErrorBanner message={loadError} />
        <div className="admin-panel py-10 text-center">
          <p className="admin-section-title" lang="ne">
            यो पहिचानसँग कुनै समाचार छैन
          </p>
          <p className="mt-2 text-body text-ink-soft" lang="ne">
            <code className="font-mono text-caption" lang="en">
              {id}
            </code>{' '}
            सूचीमा फर्केर फेरि खोल्नुहोस्, वा नयाँ ड्राफ्ट बनाउनुहोस्।
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <AdminButton href="/admin/articles">सूचीमा फर्कनुहोस्</AdminButton>
            <AdminButton href="/admin/articles/new" variant="secondary">
              नयाँ समाचार
            </AdminButton>
          </div>
          <p className="mt-4 text-caption text-mute">
            <Link
              href="/admin/launch"
              className="text-brand-strong underline-offset-2 hover:underline"
            >
              Launch जाँच
            </Link>
          </p>
        </div>
      </div>
    )
  }

  const bodyText = shorthandFromBlocks(article.bodyNe)

  return (
    <div>
      <AdminPageHeader
        subtitle={`${article.titleNe} · ${article.workflowStage} · अपडेट ${new Date(article.updatedAt).toLocaleString('ne-NP')}`}
      />
      <CmsCanonicalBanner />
      <AdminLoadErrorBanner message={loadError} />
      <ArticleEditorClient
        initial={{
          id: article.id,
          slug: article.slug,
          titleNe: article.titleNe,
          titleEn: article.titleEn ?? '',
          deckNe: article.deckNe ?? '',
          deckEn: article.deckEn ?? '',
          bodyNe: bodyText,
          bodyEn: shorthandFromBlocks(article.bodyEn ?? []),
          category: article.categorySlug,
          tagSlugs: article.tagSlugs,
          authorIds: article.authorIds,
          province: article.province ?? '',
          workflowStage: article.workflowStage,
          sourceType: article.sourceType ?? 'original',
          sourceName: article.sourceName ?? '',
          sourceUrl: article.sourceUrl ?? '',
          isBreaking: article.isBreaking,
          featuredState: article.isFeatured,
          featuredExpiresAt: article.featuredExpiresAt
            ? toDatetimeLocalValue(article.featuredExpiresAt)
            : '',
          publishedAt: article.publishedAt ? toDatetimeLocalValue(article.publishedAt) : '',
          seoTitle: article.seoTitleNe ?? '',
          seoDescription: article.seoDescriptionNe ?? '',
          noIndex: article.noIndex ?? false,
          includeInNewsSitemap: article.includeInNewsSitemap ?? false,
          aiSummary: article.aiSummary ?? '',
          premium: article.premium,
          commentsEnabled: article.commentsEnabled,
          heroImageUrl: article.heroImageUrl ?? '',
          heroImageAlt: article.heroImageAlt ?? '',
          heroCaption: article.heroCaptionNe ?? '',
          heroCredit: article.heroCredit ?? '',
          expectedUpdatedAt: article.updatedAt,
        }}
        categories={categoriesResult.value}
        tags={tagsResult.value}
        authors={authorsResult.value}
        role={session.newsroomRole}
        isNew={false}
        mediaLibrary={mediaLibrary}
      />
    </div>
  )
}

function toDatetimeLocalValue(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
