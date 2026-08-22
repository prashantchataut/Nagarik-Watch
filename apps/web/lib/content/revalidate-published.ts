import 'server-only'
import { revalidatePath } from 'next/cache'
import { LOCALES } from '@/lib/i18n/locales'
import { invalidateArticleStoreCache } from '@/lib/content/store/json-store'
import { isPubliclyVisibleStage, publicArticlePath } from '@/lib/content/article-visibility'

export { isPubliclyVisibleStage, publicArticlePath }

/** Invalidate reader routes after a publish/update/unpublish. */
export function revalidatePublishedArticle(input: {
  categorySlug: string
  slug: string
  authorSlugs?: string[]
  tagSlugs?: string[]
}): string[] {
  invalidateArticleStoreCache()

  const category = input.categorySlug.trim()
  const slug = input.slug.trim()
  const paths = new Set<string>([
    '/rss.xml',
    '/en/rss.xml',
    '/atom.xml',
    '/feed.json',
    '/news-sitemap.xml',
    '/image-sitemap.xml',
    '/video-sitemap.xml',
    '/sitemap.xml',
    '/',
  ])

  for (const locale of LOCALES) {
    paths.add(`/${locale}`)
    paths.add(`/${locale}/latest`)
    paths.add(`/${locale}/most-read`)
    paths.add(`/${locale}/trending`)
    paths.add(`/${locale}/search`)
    if (category) {
      paths.add(`/${locale}/${category}`)
      paths.add(`/${category}`)
    }
    if (category && slug) {
      paths.add(`/${locale}/${category}/${slug}`)
      paths.add(`/${category}/${slug}`)
    }
    for (const author of input.authorSlugs ?? []) {
      if (author) paths.add(`/${locale}/author/${author}`)
    }
    for (const tag of input.tagSlugs ?? []) {
      if (tag) {
        paths.add(`/${locale}/topic/${tag}`)
        paths.add(`/${locale}/tag/${tag}`)
      }
    }
  }
  paths.add('/search')

  for (const path of paths) {
    try {
      revalidatePath(path)
    } catch (error) {
      console.error('[revalidate]', path, error instanceof Error ? error.message : error)
    }
  }
  return Array.from(paths)
}
