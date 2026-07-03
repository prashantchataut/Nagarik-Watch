import type { Metadata } from 'next'
import { getArticleBySlug, getNavCategories } from '@/lib/content'
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
 * Article edit page. Resolves the article by slug (via the content façade,
 * so it works against seed or Payload), maps its block body back to the
 * markdown-shorthand the editor expects, and hands off to ArticleEditor.
 *
 * Note: until the Payload write path is wired, saving updates the in-memory
 * draft only (the editor posts to /api/admin/articles which writes to the
 * configured store). For the seed-backed dev site this means the editor is a
 * real, functional surface that demonstrates the workflow — the actual
 * persistence lands when PAYLOAD_CONTENT_SOURCE=payload and the DB is live.
 */
export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await requireNewsroomSession()
  const { id } = await params

  // Try the content façade first (works for seed + Payload). The `id` param
  // is actually the slug in the seed-backed path; Payload would use the doc id.
  const [categories, tags] = await Promise.all([getNavCategories(), Promise.resolve(seedTags)])

  // We don't know the category from the URL, so search across categories.
  let article = null
  for (const cat of categories) {
    article = await getArticleBySlug(cat.slug, id, 'ne')
    if (article) break
  }

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
          category: article.category.slug,
          sourceType: article.source?.sourceType ?? 'original',
          sourceName: article.source?.sourceName ?? '',
          sourceUrl: article.source?.sourceUrl ?? '',
          isBreaking: article.isBreaking,
          seoTitle: article.seoTitleNe ?? '',
          seoDescription: article.seoDescriptionNe ?? '',
          noIndex: article.noindex ?? false,
          includeInNewsSitemap: true,
          heroImageUrl: article.heroImage?.url ?? '',
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
