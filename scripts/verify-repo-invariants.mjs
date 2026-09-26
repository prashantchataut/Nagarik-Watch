/**
 * Structural invariants that no type or unit test can hold: that secrets are not
 * committed, that auth runs real migrations, that content comes through the
 * Payload façade, and that the reader shell still mounts the chrome a reader
 * needs. Assertions are made against source text on purpose — they are about the
 * shape of the repository, not the behaviour of a function.
 *
 * It was called `verify-recovery.mjs` and went unreferenced for long enough that
 * seven of its assertions had drifted onto code that no longer existed. It is
 * part of `verify:static` now: a check nobody runs is not a check.
 */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { homeRoutePath } from './lib/home-route.mjs'

const root = path.resolve(process.cwd())
const failures = []
const assert = (condition, message) => {
  if (!condition) failures.push(message)
}
const exists = (relative) => fs.existsSync(path.join(root, relative))
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8')

assert(!exists('.env'), 'real .env must not be included in the distributable repository')
assert(read('.gitignore').includes('.env'), '.gitignore must exclude environment secrets')
assert(exists('pnpm-lock.yaml'), 'pnpm-lock.yaml is missing')
assert(exists('packages/db/src/index.ts'), '@nagarikwatch/db source is missing')
assert(!exists('apps/cms'), 'duplicate Payload application apps/cms must be removed')
assert(!exists('nagarik-watch-fix.zip'), 'nested recovery archive must not ship')

const auth = read('apps/web/lib/auth/index.ts')
assert(auth.includes('better-auth/db/migration'), 'Better Auth migrations are not wired')
// Provisioning runs in `after()` rather than inline: boot credentials are a
// deployment bootstrap, and a slow account write must not hold the first
// request. What has to stay true is that it is wired, gated on configuration,
// and that a failure is reported rather than swallowed.
assert(auth.includes('ensureNewsroomBootAccounts'), 'boot-account provisioning is not wired')
assert(
  auth.includes('hasConfiguredNewsroomBootAccounts'),
  'boot provisioning must be gated on configured accounts',
)
assert(
  auth.includes('background boot provision failed'),
  'a failed boot provision must be reported, not swallowed',
)

const pool = read('apps/web/lib/auth/auth-pool.ts')
assert(pool.includes('PGLITE_DATA_DIR'), 'persistent local PGlite path is undocumented in code')
assert(pool.includes("NODE_ENV === 'production'"), 'production auth database guard is missing')

const payloadSource = read('apps/web/lib/content/payload-source.ts')
assert(payloadSource.includes('/api/${collection}'), 'web content source must use Payload REST')
assert(
  !payloadSource.includes('@payload-config'),
  'web app must not import the separate Payload config',
)
assert(!exists('apps/web/payload-config.d.ts'), 'obsolete Payload Local API shim must be removed')
const opsDb = read('apps/web/lib/ops-db.ts')
assert(
  opsDb.includes('production operational storage'),
  'production operational memory fallback guard is missing',
)

const content = read('apps/web/lib/content/index.ts')
assert(content.includes('isPayloadCanonical'), 'content façade must resolve Payload authority')
assert(
  content.includes('readHomepageSnapshot'),
  'the only permitted live fallback is a published Payload snapshot',
)
const jsonStore = read('apps/web/lib/content/store/json-store.ts')
assert(
  jsonStore.includes('Local file writes are disabled'),
  'JSON production writes must fail explicitly',
)

const shell = read('apps/web/components/public/PublicShell.tsx')
for (const component of ['Masthead', 'Footer', 'BottomChrome', 'SiteJsonLd']) {
  assert(shell.includes(component), `public shell is not using ${component}`)
}
// BottomNav and consent moved behind BottomChrome; assert them where they live
// now rather than dropping the rule.
const bottomChrome = read('apps/web/components/BottomChrome.tsx')
for (const component of ['BottomNav', 'CookieConsent']) {
  assert(bottomChrome.includes(component), `bottom chrome is not using ${component}`)
}
// The route is a thin shell over HomePage, so the façade invariant is asserted
// where the data is actually fetched.
const homeRoute = read(homeRoutePath(root))
assert(homeRoute.includes('HomePage'), 'locale home route is not rendering HomePage')
const homePage = read('apps/web/components/home/HomePage.tsx')
assert(homePage.includes('getHomepage'), 'homepage is bypassing the content source façade')
assert(!homePage.includes('articlesBatch'), 'homepage still imports static article batches')
const article = read('apps/web/app/[locale]/[category]/[slug]/page.tsx')
assert(article.includes('previewBlocks'), 'premium preview enforcement is missing')
assert(article.includes('ArticleJsonLd'), 'article structured data is missing')

if (failures.length) {
  console.error(`Repository invariant check failed (${failures.length})`)
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}
console.log('Repository invariant check passed')
console.log('- no committed secrets, workspace source and lockfile present')
console.log('- persistent auth, explicit migrations, gated boot provisioning')
console.log('- Payload-authoritative content façade, no local writes in production')
console.log('- reader shell mounts masthead, footer, bottom chrome and structured data')
