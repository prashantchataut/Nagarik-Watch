import { staticLocaleArticleIdParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { Locale } from '@nagarikwatch/db'
import { getNavCategories, getTags } from '@/lib/content'
import { getNewsroomSession } from '@/lib/auth/session'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import {
  CONTRIBUTOR_ROLES,
  NEWSROOM_ROLE_LABELS_EN,
  NEWSROOM_ROLE_LABELS_NE,
} from '@/lib/admin-roles'
import { getJournalistDraftMeta, listJournalistDraftRevisions } from '@/lib/journalist-workspace'
import { revisionSimilarity } from '@/lib/journalist/desk-scoring'
import { findArticleForAdmin } from '@/lib/content/store/json-store'
import { getPayloadJournalistDraft, isPayloadCanonical } from '@/lib/content/payload-admin-client'
import { shorthandFromBlocks } from '@/lib/content/blocks'
import { JournalistWorkspaceShell } from '@/components/journalist/JournalistWorkspaceShell'
import { JournalistArticleDraftForm } from '@/components/journalist/JournalistArticleDraftForm'

export function generateStaticParams() {
  return staticLocaleArticleIdParams()
}

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Edit journalist draft',
  robots: { index: false, follow: false },
}

export default async function JournalistEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { locale: rawLocale, id: rawId } = await params
  const locale: Locale = asLocale(rawLocale)
  const session = await getNewsroomSession()
  if (!session) redirect(localizeHref(locale, '/journalist/login'))
  if (!CONTRIBUTOR_ROLES.has(session.newsroomRole))
    redirect(`${localizeHref(locale, '/journalist/login')}?reason=not_staff`)
  const id = decodeURIComponent(rawId)
  const meta = await getJournalistDraftMeta(id, session.userId)
  if (!meta) notFound()
  const [categories, tags, article, revisions] = await Promise.all([
    getNavCategories(),
    getTags(),
    isPayloadCanonical()
      ? meta.articleId
        ? getPayloadJournalistDraft(meta.articleId)
        : null
      : findArticleForAdmin(meta.articleId || meta.articleSlug),
    listJournalistDraftRevisions(meta.articleId || meta.articleSlug, session.userId),
  ])
  if (!article) notFound()
  const roleLabel =
    locale === 'ne'
      ? NEWSROOM_ROLE_LABELS_NE[session.newsroomRole]
      : NEWSROOM_ROLE_LABELS_EN[session.newsroomRole]
  const bodyNe = shorthandFromBlocks(article.bodyNe)
  const articleTags = 'tagSlugs' in article ? article.tagSlugs : []
  return (
    <JournalistWorkspaceShell
      locale={locale}
      name={session.displayName || session.email}
      roleLabel={roleLabel}
      active="new"
    >
      <JournalistArticleDraftForm
        locale={locale}
        categories={categories}
        tags={tags}
        mode="edit"
        articleId={meta.articleId || meta.articleSlug}
        revisions={revisions.map((revision, index) => {
          const previous = revisions[index + 1]
          const similarity = previous
            ? revisionSimilarity(previous.snapshot.bodyNe, revision.snapshot.bodyNe)
            : undefined
          return {
            id: revision.id,
            actorRole: revision.actorRole,
            action: revision.action,
            stage: revision.stage,
            createdAt: revision.createdAt,
            contentHash: revision.contentHash,
            titleNe: revision.snapshot.titleNe,
            deckNe: revision.snapshot.deckNe,
            bodyNe: revision.snapshot.bodyNe,
            similarityToPrevious: similarity,
          }
        })}
        initial={{
          titleNe: article.titleNe,
          titleEn: article.titleEn || '',
          slug: article.slug,
          categorySlug: article.categorySlug || meta.categorySlug,
          deckNe: article.deckNe || '',
          bodyNe,
          tagSlugs: articleTags,
          heroImageUrl:
            ('heroImageUrl' in article && article.heroImageUrl
              ? article.heroImageUrl
              : undefined) ||
            ('mediaReferenceUrl' in article ? article.mediaReferenceUrl : undefined) ||
            meta.mediaReferenceUrl ||
            '',
          reportingLocation:
            ('reportingLocation' in article ? article.reportingLocation : undefined) ||
            meta.reportingLocation ||
            '',
          sourceNote:
            ('sourceNote' in article ? article.sourceNote : undefined) || meta.sourceNote || '',
          editorPitch:
            ('editorPitch' in article ? article.editorPitch : undefined) || meta.editorPitch || '',
          customHomepageText:
            ('homepageTeaserNe' in article ? article.homepageTeaserNe : undefined) ||
            meta.customHomepageText ||
            '',
          customSocialText:
            ('socialCopyNe' in article ? article.socialCopyNe : undefined) ||
            meta.customSocialText ||
            '',
          notificationMode: meta.notificationMode,
          notificationTags: meta.notificationTags,
          workflowStage: meta.workflowStage,
        }}
      />
    </JournalistWorkspaceShell>
  )
}
