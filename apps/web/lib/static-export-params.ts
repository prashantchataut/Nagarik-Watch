import 'server-only'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Locale } from '@nagarikwatch/db'
import { authors } from './content/seed/authors'
import { tags } from './content/seed/tags'
import { FALLBACK_NAV_CATEGORIES, PROVINCES, DISTRICT_SLUGS, UTILITY_TOOL_SLUGS } from './site'

const LOCALES: Locale[] = ['ne', 'en']

export function staticLocaleParams(): Array<{ locale: Locale }> {
  return LOCALES.map((locale) => ({ locale }))
}

export function staticCategoryParams(): Array<{ locale: Locale; category: string }> {
  return LOCALES.flatMap((locale) =>
    FALLBACK_NAV_CATEGORIES.map((category) => ({ locale, category: category.slug })),
  )
}

/**
 * `output: export` rejects an empty `generateStaticParams()` result outright
 * ("returned an empty array ... at least one route must be generated"), so every
 * dynamic route in the static preview has to emit at least one path even when the
 * corpus is empty. `preview` is that path: it renders the normal recovery page,
 * it is `noindex`, and it never reaches a sitemap (sitemaps are built from the
 * store, not from these functions). The same rule already applied to
 * `staticEpaperDateParams`, `staticLiveBlogParams` and
 * `staticNewsletterIssueParams`; these two were still hardcoded to `[]`, which is
 * why the Cloudflare preview build could never export.
 */
const PREVIEW_SLUG = 'preview'

export function staticArticleParams(): Array<{ locale: Locale; category: string; slug: string }> {
  const category = FALLBACK_NAV_CATEGORIES[0]?.slug
  if (!category) return []
  return LOCALES.map((locale) => ({ locale, category, slug: PREVIEW_SLUG }))
}

/** `calendar` redirects to /patro; it needs a prerendered path but never a sitemap entry. */
const UTILITY_TOOLS = ['calendar', ...UTILITY_TOOL_SLUGS] as const

/**
 * Every slug-list route funnels through here, so the "export needs at least one
 * path" rule lives here instead of in each caller.
 *
 * `tags.ts` is intentionally empty (volatile topics are CMS-created), so without
 * this `[locale]/tag/[slug]` and `[locale]/topic/[slug]` abort the export with
 * "returned an empty array from generateStaticParams()" — which is how the
 * Cloudflare preview build kept failing after the other blockers were cleared.
 */
function localeFieldParams<T extends string>(
  field: T,
  slugs: readonly string[],
): Array<{ locale: Locale } & Record<T, string>> {
  const values = slugs.length > 0 ? [...slugs] : [PREVIEW_SLUG]
  return LOCALES.flatMap((locale) =>
    values.map((value) => ({ locale, [field]: value }) as { locale: Locale } & Record<T, string>),
  )
}

export function staticAuthorParams() {
  return localeFieldParams(
    'slug',
    authors.map((author) => author.slug),
  )
}

export function staticTopicParams() {
  return localeFieldParams(
    'slug',
    tags.map((tag) => tag.slug),
  )
}

export function staticTagParams() {
  return staticTopicParams()
}

export function staticProvinceParams() {
  return localeFieldParams(
    'slug',
    PROVINCES.map((province) => province.slug),
  )
}

export function staticDistrictParams() {
  return localeFieldParams('slug', DISTRICT_SLUGS)
}

export function staticUtilityToolParams() {
  return localeFieldParams('tool', UTILITY_TOOLS)
}

export function staticPhotoParams(): Array<{ locale: Locale; slug: string }> {
  // Same rule as staticArticleParams above: the export needs one path to exist.
  return localeFieldParams('slug', [PREVIEW_SLUG])
}

export function staticLiveBlogParams() {
  try {
    const file = path.join(process.cwd(), '.data', 'live-blogs.json')
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      blogs?: Array<{ slug: string; status?: string }>
    }
    const slugs = (parsed.blogs ?? [])
      .filter((blog) => blog.status !== 'scheduled')
      .map((blog) => blog.slug)
    const values = slugs.length > 0 ? slugs : ['preview']
    return localeFieldParams('slug', values)
  } catch {
    return localeFieldParams('slug', ['preview'])
  }
}

export function staticNewsletterIssueParams() {
  try {
    const file = path.join(process.cwd(), '.data', 'newsletter-issues.json')
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as {
      issues?: Array<{ id: string; status?: string }>
    }
    const ids = (parsed.issues ?? [])
      .filter((issue) => issue.status === 'sent')
      .map((issue) => issue.id)
    const values = ids.length > 0 ? ids : ['preview']
    return localeFieldParams('id', values)
  } catch {
    return localeFieldParams('id', ['preview'])
  }
}

export function staticArticleIdParams(): Array<{ id: string }> {
  return []
}

export function staticLocaleArticleIdParams(): Array<{ locale: Locale; id: string }> {
  return []
}

export function staticEpaperDateParams(dates: string[]) {
  // output: export rejects an empty generateStaticParams result with a misleading
  // "missing generateStaticParams" error — always emit at least one path.
  const values = [...new Set(dates.filter(Boolean))]
  return localeFieldParams('date', values.length > 0 ? values : ['preview'])
}
