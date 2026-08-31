import { db } from '@/lib/db'
import { stories } from '@/lib/news/data'
import { blocksToJson, parseBodyBlocks, slugify, wordCount } from '@/lib/blocks'
import { toPublicArticle } from '@/lib/news/cms'
import { fail, ok, parseBody, requireJournalist, limitOr429 } from '@/lib/api'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const createSchema = z.object({
  desk: z.string().min(1, 'डेस्क छान्नुहोस्।'),
  titleNe: z.string().trim().min(5, 'शीर्षक कम्तीमा ५ अक्षरको हुनुपर्छ।'),
  titleEn: z.string().trim().max(300).optional().or(z.literal('')),
  deckNe: z.string().trim().min(10, 'सारांश कम्तीमा १० अक्षरको हुनुपर्छ।'),
  deckEn: z.string().trim().max(500).optional().or(z.literal('')),
  bodyNe: z.string().trim().min(30, 'समाचारको मुख्य भाग कम्तीमा ३० अक्षरको हुनुपर्छ।'),
  bodyEn: z.string().trim().optional().or(z.literal('')),
  hero: z.string().trim().optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1)).max(8).optional(),
  submit: z.boolean().optional(),
})

async function uniqueSlug(desired: string): Promise<string> {
  const staticSlugs = new Set(stories.map((s) => s.slug))
  let candidate = desired
  if (staticSlugs.has(candidate)) candidate = `${desired}-nw`
  let attempt = 0
  while (attempt < 5) {
    const clash = await db.article.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!clash) return candidate
    candidate = `${desired}-${Math.random().toString(36).slice(2, 6)}`
    attempt += 1
  }
  return `${desired}-${Date.now().toString(36)}`
}

/** Public: published CMS articles (merged into the edition by the client). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const desk = url.searchParams.get('desk')
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100) || 100, 200)

  const rows = await db.article.findMany({
    where: { status: 'published', ...(desk ? { desk } : {}) },
    orderBy: { publishedAt: 'desc' },
    take: limit,
    include: { author: { select: { name: true } } },
  })
  return ok({ articles: rows.map(toPublicArticle) })
}

/** Journalist: create a new article (draft or straight to submitted). */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'article-write', 20, 10 * 60 * 1000)
  if (limited) return limited

  const guard = await requireJournalist()
  if ('error' in guard) return guard.error

  const { data, error } = await parseBody(req, createSchema)
  if (error) return error

  const bodyBlocks = parseBodyBlocks(data.bodyNe)
  if (bodyBlocks.length === 0 || wordCount(bodyBlocks) < 15) {
    return fail('समाचारको मुख्य भाग कम्तीमा १५ शब्दको हुनुपर्छ।', 422)
  }

  const desired = slugify(data.titleEn || data.titleNe, 'sangbad')
  const slug = await uniqueSlug(desired)

  const article = await db.article.create({
    data: {
      slug,
      desk: data.desk,
      titleNe: data.titleNe,
      titleEn: data.titleEn || null,
      deckNe: data.deckNe,
      deckEn: data.deckEn || null,
      bodyNe: blocksToJson(bodyBlocks),
      bodyEn: data.bodyEn ? blocksToJson(parseBodyBlocks(data.bodyEn)) : null,
      hero: data.hero || null,
      tags: JSON.stringify(data.tags ?? []),
      status: data.submit ? 'submitted' : 'draft',
      authorId: guard.journalist.id,
    },
  })

  return ok({
    article: { id: article.id, slug: article.slug, status: article.status, titleNe: article.titleNe },
  })
}
