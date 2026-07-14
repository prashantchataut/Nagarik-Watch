/**
 * Safe development seed for Nagarik Watch.
 *
 * Default behavior seeds taxonomy and desk identities only. It does not create
 * publishable journalism. Use `--demo-articles` to add unmistakably labelled
 * draft fixtures for UI/workflow testing. Demo fixtures are always draft,
 * no-index, excluded from recommendations, and blocked from `--publish`.
 *
 * Run:
 *   pnpm --filter @nagarikwatch/admin seed
 *   pnpm --filter @nagarikwatch/admin seed -- --reset
 *   pnpm --filter @nagarikwatch/admin seed -- --demo-articles
 */
import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import configPromise from '../payload.config'

import { categories } from '../../../web/lib/content/seed/categories'
import { authors } from '../../../web/lib/content/seed/authors'
import { tags } from '../../../web/lib/content/seed/tags'
import { demoArticleFixtures } from './fixtures'

const RESET = process.argv.includes('--reset')
const DEMO_ARTICLES = process.argv.includes('--demo-articles')
const PUBLISH = process.argv.includes('--publish')

type SlugToId = Map<string, number | string>

async function main() {
  if (PUBLISH) {
    throw new Error(
      'The development seed cannot publish articles. Create or import reviewed reporting through Payload CMS.',
    )
  }

  const payload = await getPayload({ config: configPromise })

  if (RESET) await resetContent(payload)

  const categoryIds = await seedCategories(payload)
  const authorIds = await seedAuthors(payload)
  const tagIds = await seedTags(payload)

  if (DEMO_ARTICLES) {
    await seedDemoArticles(payload, { categoryIds, authorIds, tagIds })
  }

  payload.logger.info(
    DEMO_ARTICLES
      ? 'Seed complete: taxonomy, desk identities and non-public demo drafts are ready.'
      : 'Seed complete: taxonomy and desk identities are ready. No articles were created.',
  )
  process.exit(0)
}

async function resetContent(payload: BasePayload) {
  payload.logger.info('--reset: wiping articles, tags, authors, categories and media')
  for (const collection of ['articles', 'tags', 'authors', 'categories', 'media'] as const) {
    const { docs } = await payload.find({ collection, limit: 1000, depth: 0, overrideAccess: true })
    for (const doc of docs) {
      await payload.delete({ collection, id: doc.id, overrideAccess: true })
    }
  }
}

async function seedCategories(payload: BasePayload): Promise<SlugToId> {
  const ids: SlugToId = new Map()
  for (const category of categories) {
    const existing = await findBySlug(payload, 'categories', category.slug)
    const data = {
      nameNe: category.nameNe,
      nameEn: category.nameEn,
      slug: category.slug,
      description: category.descriptionNe,
      navOrder: category.navOrder,
      showInNav: category.showInNav,
    }
    const doc = existing
      ? await payload.update({ collection: 'categories', id: existing.id, data, overrideAccess: true })
      : await payload.create({ collection: 'categories', data, overrideAccess: true })
    ids.set(category.slug, doc.id)
  }
  return ids
}

async function seedAuthors(payload: BasePayload): Promise<SlugToId> {
  const ids: SlugToId = new Map()
  for (const author of authors) {
    const existing = await findBySlug(payload, 'authors', author.slug)
    const data = {
      name: author.name,
      slug: author.slug,
      role: author.role,
      bio: author.bioNe,
      email: author.email,
      isActive: author.isActive,
    }
    const doc = existing
      ? await payload.update({ collection: 'authors', id: existing.id, data, overrideAccess: true })
      : await payload.create({ collection: 'authors', data, overrideAccess: true })
    ids.set(author.slug, doc.id)
  }
  return ids
}

async function seedTags(payload: BasePayload): Promise<SlugToId> {
  const ids: SlugToId = new Map()
  for (const tag of tags) {
    const existing = await findBySlug(payload, 'tags', tag.slug)
    const data = {
      nameNe: tag.nameNe,
      nameEn: tag.nameEn,
      slug: tag.slug,
      description: tag.descriptionNe,
    }
    const doc = existing
      ? await payload.update({ collection: 'tags', id: existing.id, data, overrideAccess: true })
      : await payload.create({ collection: 'tags', data, overrideAccess: true })
    ids.set(tag.slug, doc.id)
  }
  return ids
}

async function seedDemoArticles(
  payload: BasePayload,
  refs: { categoryIds: SlugToId; authorIds: SlugToId; tagIds: SlugToId },
) {
  for (const fixture of demoArticleFixtures) {
    const category = refs.categoryIds.get(fixture.categorySlug)
    const author = refs.authorIds.get(fixture.authorSlug)
    if (!category || !author) {
      throw new Error(`Demo fixture ${fixture.slug} has an unresolved category or author.`)
    }

    const data = {
      titleNe: fixture.titleNe,
      titleEn: fixture.titleEn,
      slug: fixture.slug,
      deckNe: fixture.deckNe,
      deckEn: fixture.deckEn,
      bodyNe: fixture.bodyNe,
      bodyEn: fixture.bodyEn,
      englishStatus: 'published' as const,
      workflowStage: 'draft' as const,
      category,
      tags: fixture.tagSlugs
        .map((slug) => refs.tagIds.get(slug))
        .filter((id): id is number | string => id !== undefined)
        .map((tag) => ({ tag })),
      authors: [{ author }],
      sourceType: 'original' as const,
      locale: 'ne' as const,
      noIndex: true,
      includeInNewsSitemap: false,
      doNotRecommend: true,
      commentsEnabled: false,
      isBreaking: false,
      featuredState: 'none' as const,
      internalNotes:
        'DEVELOPMENT FIXTURE. Never publish. Replace with editor-reviewed reporting created in Payload.',
      _status: 'draft' as const,
    }

    const existing = await findBySlug(payload, 'articles', fixture.slug)
    if (existing) {
      await payload.update({
        collection: 'articles',
        id: existing.id,
        data,
        draft: true,
        overrideAccess: true,
      })
    } else {
      await payload.create({
        collection: 'articles',
        data,
        draft: true,
        overrideAccess: true,
      })
    }
  }
}

async function findBySlug(
  payload: BasePayload,
  collection: 'articles' | 'categories' | 'authors' | 'tags',
  slug: string,
): Promise<{ id: number | string } | null> {
  const { docs } = await payload.find({
    collection,
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return docs[0] ? { id: docs[0].id } : null
}

void main().catch((error) => {
  console.error(error)
  process.exit(1)
})
