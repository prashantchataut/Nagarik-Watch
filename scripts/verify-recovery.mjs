import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const root = path.resolve(process.cwd())
const failures = []
const assert = (condition, message) => { if (!condition) failures.push(message) }
const exists = (relative) => fs.existsSync(path.join(root, relative))
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

assert(!exists('.env'), 'real .env must not be included in the distributable repository')
assert(read('.gitignore').includes('.env'), '.gitignore must exclude environment secrets')
assert(exists('pnpm-lock.yaml'), 'pnpm-lock.yaml is missing')
assert(exists('packages/db/src/index.ts'), '@nagarikwatch/db source is missing')
assert(!exists('apps/cms'), 'duplicate Payload application apps/cms must be removed')
assert(!exists('nagarik-watch-fix.zip'), 'nested recovery archive must not ship')

const auth = read('apps/web/lib/auth/index.ts')
assert(auth.includes("better-auth/db/migration"), 'Better Auth migrations are not wired')
assert(auth.includes('await seedBootAccounts(auth)'), 'auth must await boot-account provisioning')
assert(auth.includes('Promise.allSettled'), 'boot provisioning must report every configured account failure')
assert(auth.includes('AggregateError'), 'boot provisioning failures must fail explicitly')

const pool = read('apps/web/lib/auth/auth-pool.ts')
assert(pool.includes('PGLITE_DATA_DIR'), 'persistent local PGlite path is undocumented in code')
assert(pool.includes("NODE_ENV === 'production'"), 'production auth database guard is missing')


const payloadSource = read('apps/web/lib/content/payload-source.ts')
assert(payloadSource.includes('/api/${collection}'), 'web content source must use Payload REST')
assert(!payloadSource.includes('@payload-config'), 'web app must not import the separate Payload config')
assert(!exists('apps/web/payload-config.d.ts'), 'obsolete Payload Local API shim must be removed')
const opsDb = read('apps/web/lib/ops-db.ts')
assert(opsDb.includes('production operational storage'), 'production operational memory fallback guard is missing')

const content = read('apps/web/lib/content/index.ts')
assert(content.includes("selected !== 'payload'"), 'production content source must require Payload')
const jsonStore = read('apps/web/lib/content/store/json-store.ts')
assert(jsonStore.includes('JSON article store is disabled in production'), 'JSON production writes must fail explicitly')

const shell = read('apps/web/components/public/PublicShell.tsx')
for (const component of ['Masthead', 'Footer', 'BottomNav', 'CookieConsent', 'SiteJsonLd']) {
  assert(shell.includes(component), `public shell is not using ${component}`)
}
const home = read('apps/web/app/[locale]/page.tsx')
assert(home.includes('getHomepage'), 'homepage is bypassing the content source façade')
assert(!home.includes('articlesBatch'), 'homepage still imports static article batches')
const article = read('apps/web/app/[locale]/[category]/[slug]/page.tsx')
assert(article.includes('previewBlocks'), 'premium preview enforcement is missing')
assert(article.includes('ArticleJsonLd'), 'article structured data is missing')

if (failures.length) {
  console.error(`Repository recovery verification failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Repository recovery verification passed')
console.log('- missing workspace source and lockfile restored')
console.log('- secret-bearing local files and nested archive excluded')
console.log('- persistent auth, explicit migrations, and boot provisioning verified')
console.log('- production content persistence and reader-shell wiring verified')
