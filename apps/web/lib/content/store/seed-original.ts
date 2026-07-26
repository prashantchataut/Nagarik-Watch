import type { StoredArticle } from './json-store'
import { buildEditionArticles } from './seed-edition'

/**
 * Original Nagarik Watch edition — 5 full stories per category (75 total).
 * Editable via /admin/articles. No third-party outlet copy or attribution.
 */
export function buildOriginalStarterArticles(createdBy = 'newsroom-boot'): StoredArticle[] {
  const articles = buildEditionArticles()
  if (createdBy === 'newsroom-boot') return articles
  return articles.map((article) => ({
    ...article,
    createdBy,
    updatedBy: createdBy,
  }))
}
