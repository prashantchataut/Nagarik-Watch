import 'server-only'
import { revalidatePath } from 'next/cache'

/** Invalidate reader routes after a publish/update/unpublish. */
export function revalidatePublishedArticle(input: {
  categorySlug: string
  slug: string
  authorSlugs?: string[]
  tagSlugs?: string[]
}): string[] {
  const category = input.categorySlug.trim()
  const slug = input.slug.trim()
  const paths = new Set(['/', '/latest', '/rss.xml', '/news-sitemap.xml', '/sitemap.xml'])

  if (category) {
    paths.add(`/${category}`)
    paths.add(`/en/${category}`)
  }
  if (category && slug) {
    paths.add(`/${category}/${slug}`)
    paths.add(`/en/${category}/${slug}`)
  }
  for (const author of input.authorSlugs ?? []) {
    if (author) paths.add(`/author/${author}`)
  }
  for (const tag of input.tagSlugs ?? []) {
    if (tag) paths.add(`/topic/${tag}`)
  }

  for (const path of paths) revalidatePath(path)
  return Array.from(paths)
}
