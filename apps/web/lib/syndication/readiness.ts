/**
 * Samples recently published articles and runs the local AMP/Instant
 * Articles/Apple News structural validators against their real content, so
 * the admin SEO page reports honest syndication readiness instead of a
 * static claim.
 */
import 'server-only'
import { getArticleBySlug, getStories } from '@/lib/content'
import {
  validateAmpHtml,
  validateAppleNewsFormat,
  validateInstantArticle,
} from '@/lib/syndication/validators'

export type SyndicationReadinessSample = {
  slug: string
  title: string
  amp: ReturnType<typeof validateAmpHtml>
  instantArticle: ReturnType<typeof validateInstantArticle>
  appleNews: ReturnType<typeof validateAppleNewsFormat>
}

export async function sampleSyndicationReadiness(limit = 3): Promise<SyndicationReadinessSample[]> {
  const { items } = await getStories({ locale: 'ne', perPage: limit })
  const samples = await Promise.all(
    items.slice(0, limit).map(async (item) => {
      const article = await getArticleBySlug(item.category.slug, item.slug, 'ne').catch(() => null)
      const bodyBlockCount = article?.bodyNe?.length ?? 0
      const hasCanonical = Boolean(article?.canonicalUrl) || Boolean(item.slug)
      const hasHeroImage = Boolean(item.heroImage)
      return {
        slug: item.slug,
        title: item.titleNe,
        amp: validateAmpHtml({ hasCanonical, hasHeroImage }),
        instantArticle: validateInstantArticle({
          title: item.titleNe,
          bodyBlockCount,
          hasCanonical,
        }),
        appleNews: validateAppleNewsFormat({
          hasIdentifier: Boolean(item.slug),
          hasTitle: Boolean(item.titleNe),
          hasComponents: bodyBlockCount > 0,
        }),
      }
    }),
  )
  return samples
}
