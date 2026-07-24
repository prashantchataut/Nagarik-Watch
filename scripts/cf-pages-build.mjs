/**
 * Cloudflare Pages build entry.
 * Forces a reachable build-time origin (pages.dev) so static generation never hangs
 * on an unreachable custom domain / cached DNS. Override with CF_PAGES_SITE_URL.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

function withHttps(value) {
  const trimmed = String(value || '').trim().replace(/\/$/, '')
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
  NEXT_PUBLIC_SITE_URL: siteUrl,
  SITE_URL: siteUrl,
  BETTER_AUTH_URL: withHttps(process.env.BETTER_AUTH_URL) || siteUrl,
}

console.log(`[build:cf-pages] NEXT_PUBLIC_SITE_URL=${siteUrl}`)

const result = spawnSync(
  'pnpm',
  ['--filter', '@nagarikwatch/web', 'build:pages'],
  { cwd: root, env, stdio: 'inherit', shell: process.platform === 'win32' },
)

process.exit(result.status ?? 1)
