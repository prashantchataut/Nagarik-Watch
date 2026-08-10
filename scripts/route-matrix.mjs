/**
 * Enumerate public reader routes from the App Router tree and emit a CSV matrix
 * for audit/regression tracking. Run: node scripts/route-matrix.mjs
 */
import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const localeRoot = join(root, 'apps/web/app/[locale]')
const adminRoot = join(root, 'apps/web/app/admin')
const apiRoot = join(root, 'apps/web/app/api')
const topRoutes = join(root, 'apps/web/app')

const rows = [['path', 'source', 'kind', 'locale', 'auth', 'notes'].join(',')]

function csv(value) {
  const text = String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function walkPages(dir, prefix, kind, locale = 'ne|en') {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) {
      const segment =
        entry.startsWith('[') && entry.endsWith(']') ? `:${entry.slice(1, -1)}` : entry
      walkPages(abs, `${prefix}/${segment}`, kind, locale)
      continue
    }
    if (!/^page\.(tsx|ts|jsx|js|mdx)$/.test(entry)) continue
    const rel = relative(root, abs).split('\\').join('/')
    rows.push(
      [csv(prefix || '/'), csv(rel), csv(kind), csv(locale), csv('none'), csv('')].join(','),
    )
  }
}

function walkApi(dir, prefix = '/api') {
  if (!existsSync(dir)) return
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry)
    const st = statSync(abs)
    if (st.isDirectory()) {
      const segment =
        entry.startsWith('[') && entry.endsWith(']') ? `:${entry.slice(1, -1)}` : entry
      walkApi(abs, `${prefix}/${segment}`)
      continue
    }
    if (!/^route\.(tsx|ts|js)$/.test(entry)) continue
    const rel = relative(root, abs).split('\\').join('/')
    rows.push([csv(prefix), csv(rel), csv('api'), csv('n/a'), csv('varies'), csv('')].join(','))
  }
}

walkPages(localeRoot, '', 'public-page')
walkPages(adminRoot, '/admin', 'admin-page', 'ne')
walkApi(apiRoot)

for (const file of [
  'rss.xml/route.ts',
  'sitemap.xml/route.ts',
  'news-sitemap.xml/route.ts',
  'robots.txt/route.ts',
]) {
  const abs = join(topRoutes, file)
  if (existsSync(abs)) {
    const route = `/${file.replace(/\/route\.(tsx|ts|js)$/, '')}`
    rows.push(
      [csv(route), csv(`apps/web/app/${file}`), csv('feed'), csv('n/a'), csv('none'), csv('')].join(
        ',',
      ),
    )
  }
}

const outPath = join(root, 'docs/audits/route-matrix.csv')
mkdirSync(join(root, 'docs/audits'), { recursive: true })
writeFileSync(outPath, `${rows.join('\n')}\n`, 'utf8')
console.log(`Route matrix written: ${relative(root, outPath)} (${rows.length - 1} routes)`)
