/**
 * Dev seed for Nagarik Watch (Task 1.1).
 *
 * Loads the bilingual sample content from apps/web/lib/content/seed into the Payload
 * collections via the Local API: Categories → Authors → Tags → Media → Articles, in
 * dependency order. Idempotent: existing slugs are skipped unless --reset wipes first.
 *
 * Run: pnpm --filter @nagarikwatch/admin seed [--reset] [--publish]
 *
 * Without --publish, imported stories stay as drafts so sample/dev content cannot
 * accidentally appear on the public site. Use --publish only with editor-reviewed
 * original content.
 *
 * Media uploads are best-effort: the seed fetches each Unsplash hero into a buffer and
 * passes it to the Local API, so editors see real images. If the network is unavailable
 * the script logs and continues, leaving article.heroImage unset (the field is optional).
 */
import { getPayload } from 'payload'
import type { BasePayload } from 'payload'
import configPromise from '../payload.config'

import { categories } from '../../../web/lib/content/seed/categories'
import { authors } from '../../../web/lib/content/seed/authors'
import { tags } from '../../../web/lib/content/seed/tags'
import { articlesBatch1 } from '../../../web/lib/content/seed/articles-1'
import { articlesBatch2 } from '../../../web/lib/content/seed/articles-2'
import type { Article, ArticleBlock } from '@nagarikwatch/db'

const articles = [...articlesBatch1, ...articlesBatch2]

const RESET = process.argv.includes('--reset')
const PUBLISH = process.argv.includes('--publish')

type SlugToId = Map<string, number | string>

async function main() {
  const payload = await getPayload({ config: configPromise })

  if (RESET) {
    await resetContent(payload)
  }

  const categoryIds = await seedCategories(payload)
  const authorIds = await seedAuthors(payload)
  const tagIds = await seedTags(payload)
  await seedArticles(payload, { categoryIds, authorIds, tagIds })

  payload.logger.info(
    PUBLISH
      ? 'Seed complete: published content created.'
      : 'Seed complete: draft content created. Use --publish only for reviewed original stories.',
  )
  process.exit(0)
}

async function resetContent(payload: BasePayload) {
  payload.logger.info('--reset: wiping articles, tags, authors, categories, media…')
  for (const slug of ['articles', 'tags', 'authors', 'categories', 'media'] as const) {
    const { docs } = await payload.find({ collection: slug, limit: 1000, depth: 0 })
    for (const doc of docs) {
      await payload.delete({ collection: slug, id: doc.id }).catch(() => {})
    }
  }
}

async function seedCategories(payload: BasePayload): Promise<SlugToId> {
  const out: SlugToId = new Map()
  for (const c of categories) {
    const existing = await findBySlug(payload, 'categories', c.slug)
    const data = {
      nameNe: c.nameNe,
      nameEn: c.nameEn,
      slug: c.slug,
      description: c.descriptionNe,
      navOrder: c.navOrder,
      showInNav: c.showInNav,
    }
    const result = existing
      ? await payload.update({ collection: 'categories', id: existing.id, data })
      : await payload.create({ collection: 'categories', data })
    out.set(c.slug, result.id)
    payload.logger.info(`category: ${c.slug} → ${result.id}`)
  }
  return out
}

async function seedAuthors(payload: BasePayload): Promise<SlugToId> {
  const out: SlugToId = new Map()
  for (const a of authors) {
    const existing = await findBySlug(payload, 'authors', a.slug)
    const data = {
      name: a.name,
      slug: a.slug,
      role: a.role,
      bio: a.bioNe,
      isActive: a.isActive,
    }
    const result = existing
      ? await payload.update({ collection: 'authors', id: existing.id, data })
      : await payload.create({ collection: 'authors', data })
    out.set(a.slug, result.id)
    payload.logger.info(`author: ${a.slug} → ${result.id}`)
  }
  return out
}

async function seedTags(payload: BasePayload): Promise<SlugToId> {
  const out: SlugToId = new Map()
  for (const t of tags) {
    const existing = await findBySlug(payload, 'tags', t.slug)
    const data = {
      nameNe: t.nameNe,
      nameEn: t.nameEn,
      slug: t.slug,
      description: t.descriptionNe,
    }
    const result = existing
      ? await payload.update({ collection: 'tags', id: existing.id, data })
      : await payload.create({ collection: 'tags', data })
    out.set(t.slug, result.id)
    payload.logger.info(`tag: ${t.slug} → ${result.id}`)
  }
  return out
}

async function seedArticles(
  payload: BasePayload,
  refs: { categoryIds: SlugToId; authorIds: SlugToId; tagIds: SlugToId },
) {
  for (const a of articles) {
    const categoryId = refs.categoryIds.get(a.category.slug)
    if (!categoryId) {
      payload.logger.warn(`article ${a.slug}: category ${a.category.slug} missing, skipping`)
      continue
    }
    const authorRows = a.authors
      .map((au) => refs.authorIds.get(au.slug))
      .filter((id): id is NonNullable<typeof id> => Boolean(id))
      .map((id) => ({ author: Number(id) }))
    if (!authorRows.length) {
      payload.logger.warn(`article ${a.slug}: no resolvable authors, skipping`)
      continue
    }
    const tagRows = a.tags
      .map((t) => refs.tagIds.get(t.slug))
      .filter((id): id is NonNullable<typeof id> => Boolean(id))
      .map((id) => ({ tag: Number(id) }))

    const heroMediaId = a.heroImage ? await ensureMedia(payload, a) : undefined

    const sourceType = a.source?.sourceType ?? ('original' as const)
    const data = {
      titleNe: a.titleNe,
      titleEn: a.titleEn,
      slug: a.slug,
      deckNe: a.deckNe,
      deckEn: a.deckEn,
      bodyNe: a.bodyNe as ArticleBlock[],
      bodyEn: a.bodyEn,
      englishStatus: a.hasEnglish ? ('published' as const) : ('none' as const),
      category: Number(categoryId),
      tags: tagRows,
      authors: authorRows,
      heroImage: heroMediaId ? Number(heroMediaId) : undefined,
      heroCredit: a.heroCredit,
      sourceType,
      sourceName: a.source?.sourceName,
      sourceUrl: a.source?.sourceUrl,
      sourcePublishedAt: a.source?.sourcePublishedAt,
      isBreaking: a.isBreaking,
      featuredState: 'none' as const,
      locale: 'ne' as const,
      publishedAt: a.publishedAt,
      _status: PUBLISH ? ('published' as const) : ('draft' as const),
    }

    const existing = await findBySlug(payload, 'articles', a.slug)
    const result = existing
      ? await payload.update({ collection: 'articles', id: existing.id, data })
      : await payload.create({ collection: 'articles', data, draft: true })
    payload.logger.info(`article: ${a.slug} → ${result.id}`)
  }
}

async function ensureMedia(payload: BasePayload, a: Article): Promise<number | undefined> {
  const ref = a.heroImage
  if (!ref) return undefined
  try {
    const buffer = await fetchImage(ref.url)
    const name = imageNameFromUrl(ref.url)
    const doc = (await payload.create({
      collection: 'media',
      data: { alt: ref.alt, credit: ref.credit ?? a.heroCredit },
      file: { data: buffer, mimetype: 'image/jpeg', name, size: buffer.length },
    })) as { id: number }
    payload.logger.info(`  media: ${name} → ${doc.id}`)
    return doc.id
  } catch (err) {
    payload.logger.warn(
      `  media: skipped for ${a.slug} (${err instanceof Error ? err.message : 'fetch failed'})`,
    )
    return undefined
  }
}

async function fetchImage(url: string): Promise<Buffer> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function imageNameFromUrl(url: string): string {
  const match = /photo-([a-f0-9]+)/.exec(url)
  return match ? `${match[1]}.jpg` : 'hero.jpg'
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
  })
  const doc = docs[0]
  return doc ? { id: doc.id } : null
}

void main().catch(async (err) => {
  console.error(err)
  process.exit(1)
})
