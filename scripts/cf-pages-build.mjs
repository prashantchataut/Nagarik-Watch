/**
 * Cloudflare Pages build entry.
 * Forces a reachable build-time origin (pages.dev) so static generation never hangs
 * on an unreachable custom domain / cached DNS. Override with CF_PAGES_SITE_URL.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function withHttps(value) {
  const trimmed = String(value || '')
    .trim()
    .replace(/\/$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

// Prefer an explicit build origin; never fall back to a possibly-unreachable apex
// from apps/web/.env.local during offline / edge-cache-stale periods.
const siteUrl =
  withHttps(process.env.CF_PAGES_SITE_URL) ||
  withHttps(process.env.CF_PAGES_URL) ||
  'https://nagarik-watch.pages.dev'

const env = {
  ...process.env,
  NODE_ENV: 'production',
  CF_PAGES: process.env.CF_PAGES || '1',
  CF_PAGES_STATIC: '1',
  NEXT_PUBLIC_STATIC_EXPORT: '1',
  NEXT_PUBLIC_SITE_URL: siteUrl,
  SITE_URL: siteUrl,
  BETTER_AUTH_URL: withHttps(process.env.BETTER_AUTH_URL) || siteUrl,
  // Desk login lives on the full app host (not static Pages). Override with ADMIN_APP_URL.
  NEXT_PUBLIC_ADMIN_APP_URL:
    withHttps(process.env.NEXT_PUBLIC_ADMIN_APP_URL) ||
    withHttps(process.env.ADMIN_APP_URL) ||
    withHttps(process.env.CF_ADMIN_APP_URL) ||
    'https://nagarik-watch.vercel.app',
}

console.log(`[build:cf-pages] NEXT_PUBLIC_SITE_URL=${siteUrl}`)
console.log(`[build:cf-pages] NEXT_PUBLIC_ADMIN_APP_URL=${env.NEXT_PUBLIC_ADMIN_APP_URL}`)
console.log(`[build:cf-pages] NEXT_PUBLIC_STATIC_EXPORT=1`)

const result = spawnSync('pnpm', ['--filter', '@nagarikwatch/web', 'build:pages'], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

if ((result.status ?? 1) !== 0) {
  process.exit(result.status ?? 1)
}

/**
 * Never let this step report success without the artefact the deploy needs.
 *
 * `pnpm --filter <pkg> <script>` exits **0** when no selected package has that
 * script ("None of the selected packages has a ... script"). That is exactly how
 * this build reported "Success: Build command completed" while producing no
 * `apps/web/out`, leaving `npx wrangler deploy` to fail with the misleading
 * "The directory specified by the assets.directory field ... does not exist".
 * The missing `build:pages` script has since been restored, and this assertion
 * makes any repeat of that class of failure fail here, with the reason.
 */
const outDir = path.join(root, 'apps', 'web', 'out')
const outIndex = path.join(outDir, 'index.html')

if (!existsSync(outDir) || !existsSync(outIndex)) {
  console.error(
    [
      '[build:cf-pages] The static export did not produce apps/web/out/index.html.',
      `  out dir:   ${outDir} ${existsSync(outDir) ? '(exists)' : '(missing)'}`,
      `  index:     ${outIndex} ${existsSync(outIndex) ? '(exists)' : '(missing)'}`,
      '',
      'Likely causes, in order:',
      '  1. apps/web/package.json has no "build:pages" script (pnpm then exits 0',
      '     for the filtered call above and nothing is exported).',
      '  2. next.config.ts is not emitting output: "export" for this build',
      '     (CF_PAGES_STATIC / NEXT_PUBLIC_STATIC_EXPORT must be 1).',
      '  3. `next build` inside build-pages-static.mjs failed for a content or',
      '     type reason — read the log above for the real error.',
      '',
      'Run `pnpm audit:script-refs` to check for scripts that were deleted while',
      'their callers remained.',
    ].join('\n'),
  )
  process.exit(1)
}

console.log(`[build:cf-pages] static export ready: ${outDir}`)
process.exit(0)
