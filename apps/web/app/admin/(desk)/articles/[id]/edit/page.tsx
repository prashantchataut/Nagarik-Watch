import { staticArticleIdParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getNavCategories, getAuthors, getTags } from '@/lib/content'
import { findArticleForAdmin } from '@/lib/content/store/json-store'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader } from '@/components/admin/primitives'
import { ArticleEditor } from '@/components/admin/ArticleEditor'
import type { ArticleBlock } from '@nagarikwatch/db'
import { isPayloadCanonical, payloadCollectionAdminUrl } from '@/lib/content/payload-admin-client'
import { listMediaItems } from '@/lib/media-library'

export const dynamic = 'force-dynamic'

export function generateStaticParams() {
  return staticArticleIdParams()
}

export const metadata: Metadata = {
  title: 'Edit Article',
  robots: { index: false, follow: false },
}


/**
 * Article edit page. Resolves draft or published stories through the admin
 * store lookup, maps block bodies back to the markdown-shorthand the editor
 * expects, and hands off to ArticleEditor. Drafts must remain editable even
 * before they are visible on the public site.
 */
export default async function EditArticlePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireNewsroomSession()
  const { id } = await params
  if (isPayloadCanonical()) redirect(payloadCollectionAdminUrl('articles', id))

  const [categories, tags, authors, mediaLibrary] = await Promise.all([
    getNavCategories(),
    getTags(),
    getAuthors(),
    listMediaItems({ limit: 60 }).catch(() => []),
  ])
  const article = await findArticleForAdmin(id)

  if (!article) {
    return (
      <div>
        <AdminPageHeader
          subtitle={`"${id}" स्लगको समाचार फेला परेन। नयाँ समाचारको रूपमा बनाउनुहोस्।`}
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

  const bodyText = blocksToShorthand(article.bodyNe)

  return (
    <div>
      <AdminPageHeader subtitle={article.titleNe} />
      <ArticleEditor
        initial={{
          id: article.id,
          slug: article.slug,
          titleNe: article.titleNe,
          titleEn: article.titleEn ?? '',
          deckNe: article.deckNe ?? '',
          deckEn: article.deckEn ?? '',
          bodyNe: bodyText,
          bodyEn: blocksToShorthand(article.bodyEn ?? []),
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
            ? article.featuredExpiresAt.slice(0, 16)
            : '',
          publishedAt: article.publishedAt ? article.publishedAt.slice(0, 16) : '',
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
        }}
        categories={categories}
        tags={tags}
        authors={authors}
        role={session.newsroomRole}
        isNew={false}
        mediaLibrary={mediaLibrary}
      />
    </div>
  )
}

function blocksToShorthand(blocks: ArticleBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading2':
          return `## ${b.text}`
        case 'heading3':
          return `### ${b.text}`
        case 'pullQuote':
          return `> ${b.quoteNe}`
        case 'list':
          return b.items.map((i) => `- ${i}`).join('\n')
        case 'image':
          return `![${b.image.alt ?? ''}](${b.image.url})`
        case 'embed':
          return `[embed:${b.provider}](${b.url})`
        case 'adSlot':
          return `[ad:${b.placementKey}]`
        case 'paragraph':
        default:
          return b.text
      }
    })
    .filter(Boolean)
    .join('\n\n')
}
