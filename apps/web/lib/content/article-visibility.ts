/** Client-safe helpers for publish visibility messaging. */

export function publicArticlePath(
  categorySlug: string,
  slug: string,
  locale: 'ne' | 'en' = 'ne',
): string {
  return `/${locale}/${categorySlug.trim()}/${slug.trim()}`
}

export function isPubliclyVisibleStage(stage: string): boolean {
  return stage === 'published' || stage === 'updated'
}
