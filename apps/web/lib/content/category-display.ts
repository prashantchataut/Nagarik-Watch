import type { Locale } from '@nagarikwatch/db'
import { categoryBySlug } from '@/lib/content/seed/categories'

/**
 * Prefer CMS / story category names, but never show a bare Latin slug on
 * Devanagari-first surfaces when the seed desk has a proper label.
 */
export function displayCategoryName(
  category: { slug: string; nameNe: string; nameEn?: string | null },
  locale: Locale,
): string {
  const seeded = categoryBySlug.get(category.slug)
  const preferEn = locale === 'en'
  const raw = preferEn
    ? (category.nameEn?.trim() || category.nameNe?.trim() || '')
    : (category.nameNe?.trim() || category.nameEn?.trim() || '')

  if (raw && !isSlugishLabel(raw, category.slug)) {
    return raw
  }

  if (seeded) {
    if (preferEn && seeded.nameEn?.trim()) return seeded.nameEn.trim()
    if (seeded.nameNe?.trim()) return seeded.nameNe.trim()
    if (seeded.nameEn?.trim()) return seeded.nameEn.trim()
  }

  return raw || category.slug
}

function isSlugishLabel(name: string, slug: string): boolean {
  const normalized = name.trim().toLowerCase()
  if (!normalized) return true
  if (normalized === slug.trim().toLowerCase()) return true
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(name.trim())
}
