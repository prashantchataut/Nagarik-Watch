/**
 * Structural taxonomy re-exports. v3 removed all copyrighted seed articles.
 * Categories, authors, and tags remain as default taxonomies the admin can
 * extend. These are re-exported under their old `seed*` names for backwards
 * compatibility with admin screens and the sitemap.
 */
export { categories, categoryBySlug } from './seed/categories'
export { authors, authorBySlug } from './seed/authors'
export { tags, tagBySlug } from './seed/tags'

// Backwards-compat aliases used by admin screens + sitemap.
export { categories as seedCategories } from './seed/categories'
export { authors as seedAuthors } from './seed/authors'
export { tags as seedTags } from './seed/tags'
