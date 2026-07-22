/** True when building a static Cloudflare Pages export (no Workers / API routes). */
export const isStaticPagesExport = process.env.CF_PAGES_STATIC === '1'

/** Route segment config shared by pages that default to force-dynamic in production. */
export const pageDynamic = isStaticPagesExport ? ('force-static' as const) : ('force-dynamic' as const)
