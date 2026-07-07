import type { Metadata } from 'next'
import { getNavCategories } from '@/lib/content'
import { findArticleForAdmin } from '@/lib/content/store/json-store'
import { seedTags } from '@/lib/content/seed-source'
import { requireNewsroomSession } from '@/lib/auth/session'
import { AdminPageHeader } from '@/components/admin/primitives'
import { ArticleEditor } from '@/components/admin/ArticleEditor'
import type { ArticleBlock } from '@nagarikwatch/db'

export const metadata: Metadata = {
  title: 'Edit Article',
  robots: { index: false, follow: false },
}

export const dynamic = 'force-dynamic'

/**
 * Article edit page. Resolves draft or published stories through the admin
 * store lookup, maps block bodies back to the markdown-shorthand the editor
 * expects, and hands off to ArticleEditor. Drafts must remain editable even
 * before they are visible on the public site.
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireNewsroomSession()
  const { id } = await params

  const [categories, tags] = await Promise.all([getNavCategories(), Promise.resolve(seedTags)])
  const article = await findArticleForAdmin(id)

  if (!article) {
    // Fallback: render the editor with empty state so the editor can still
    // create new content rather than 404ing on a stale slug.
    return (
      <div>
        <AdminPageHeader
          title="समाचार भेटिएन"
          subtitle={`"${id}" स्लगको समाचार फेला परेन। नयाँ समाचारको रूपमा बनाउनुहोस्।`}
        />
        <ArticleEditor categories={categories} tags={tags} role={session.newsroomRole} isNew />
      </div>
    )
  }

  const bodyText = blocksToShorthand(article.bodyNe)

  return (
    <div>
      <AdminPageHeader
        title="समाचार सम्पादन"
        subtitle={article.titleNe}
      />
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
          workflowStage: article.workflowStage,
          sourceType: article.sourceType ?? 'original',
          sourceName: article.sourceName ?? '',
          sourceUrl: article.sourceUrl ?? '',
          isBreaking: article.isBreaking,
          featuredState: article.isFeatured,
          seoTitle: article.seoTitleNe ?? '',
          seoDescription: article.seoDescriptionNe ?? '',
          noIndex: article.noIndex ?? false,
          includeInNewsSitemap: article.includeInNewsSitemap ?? false,
          premium: article.premium,
          commentsEnabled: article.commentsEnabled,
          heroImageUrl: article.heroImageUrl ?? '',
          heroCaption: article.heroCaptionNe ?? '',
          heroCredit: article.heroCredit ?? '',
        }}
        categories={categories}
        tags={tags}
        role={session.newsroomRole}
        isNew={false}
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
