#!/usr/bin/env node
/**
 * Env documentation drift audit.
 *
 * The operator contract is `.env.example`: a var the launch gate reports on but
 * that the template never mentions cannot be set correctly. That drift already
 * existed (the gate named `BETTER_AUTH_URL`, `PAYLOAD_SECRET`,
 * `BLOB_READ_WRITE_TOKEN`, `CAPTCHA_PROVIDER`, the publication legal identity
 * and the newsletter API pair while the template documented none of them), so
 * this audit makes the contract machine-checked.
 *
 * Scope is deliberate: it reads the *launch* surfaces that define what an
 * operator must provide, not every `process.env` in the tree. Framework, Vercel
 * and Cloudflare variables are ignored, and a small alias table documents the
 * vars that are intentionally represented by a different canonical name.
 */
import { readFileSync } from 'node:fs'

const ROOT_EXAMPLE = '.env.example'
const ADMIN_EXAMPLE = 'apps/admin/.env.example'

/** Files that define the operator-facing configuration contract. */
const CONTRACT_FILES = [
  'apps/web/lib/launch-gate-core.ts',
  'apps/web/lib/launch-readiness.ts',
  'apps/web/lib/hard-launch-gates.ts',
  'apps/web/lib/launch-phases.ts',
  'apps/web/lib/security/response-headers.ts',
  'apps/web/lib/public-path-allowlist.ts',
  'apps/admin/src/payload.config.ts',
]

/**
 * Vars the contract names that are intentionally NOT template entries:
 * platform aliases read as fallbacks, and accepted alternative spellings.
 */
const ALIASES = new Map([
  ['BETTER_AUTH_SECRET', 'AUTH_SECRET'],
  ['POSTGRES_URL', 'DATABASE_URL'],
  ['POSTGRES_PRISMA_URL', 'DATABASE_URL'],
  ['POSTGRES_URL_NON_POOLING', 'DATABASE_URL'],
  ['NEON_DATABASE_URL', 'DATABASE_URL'],
  ['R2_ACCESS_KEY_ID', 'STORAGE_ACCESS_KEY_ID'],
  ['R2_SECRET_ACCESS_KEY', 'STORAGE_SECRET_ACCESS_KEY'],
  ['R2_BUCKET', 'STORAGE_BUCKET'],
  ['R2_PUBLIC_BASE_URL', 'STORAGE_PUBLIC_BASE_URL'],
  ['R2_ENDPOINT', 'STORAGE_ENDPOINT'],
  ['NEXT_PUBLIC_SENTRY_DSN', 'SENTRY_DSN'],
  ['PAYLOAD_CONTENT_SOURCE', 'CONTENT_SOURCE'],
  ['PAYLOAD_ADMIN_URL', 'PAYLOAD_PUBLIC_SERVER_URL'],
  ['TTS_API_KEY', 'TTS_PROVIDER_KEY'],
  ['NEXT_PUBLIC_TTS_PROVIDER', 'TTS_PROVIDER_KEY'],
  ['SEMANTIC_SEARCH_URL', 'SEMANTIC_SEARCH_PROVIDER'],
  ['OPENAI_API_KEY', 'AI_PROVIDER_KEY'],
])

/** Platform/framework namespaces that are never operator configuration. */
const IGNORED_PREFIXES = [
  'NEXT_PRIVATE_',
  'NEXT_RUNTIME',
  'NEXT_PHASE',
  'VERCEL_',
  'CF_PAGES_',
  'CF_WORKERS',
  'SENTRY_',
  'AWS_',
  'GITHUB_',
  'CI_',
  'HEROKU_',
  'NETLIFY',
  'RAILWAY_',
  'RENDER_',
  'ZEIT_',
  'BUILDKITE_',
  'CIRCLE_',
  'TRAVIS_',
  'BUDDY_',
  'DRONE_',
  'SEMAPHORE_',
  'APPVEYOR_',
  'WORKERS_CI',
  'TENCENTCLOUD_',
  'ALIYUN_',
  'IBM_CLOUD_',
  'EVENTARC_',
  'GOOGLE_',
  'FC_',
  'K_SERVICE',
  'FUNCTION_TARGET',
  'WEBSITE_SITE_NAME',
  'DYNO',
  'FLY_REGION',
  'EDGE_',
]

const IGNORED_EXACT = new Set([
  'NODE_ENV',
  'PORT',
  'CI',
  'DEBUG',
  'LANG',
  'USER',
  'USERNAME',
  'TMPDIR',
  'OSTYPE',
  'APPDATA',
  'LOCALAPPDATA',
  'PATH',
  'PATHEXT',
  'X',
  '_',
  'PGSSLMODE',
  'PGCONNECT_TIMEOUT',
  'DISABLE_LOGGING',
  'NODE_PG_FORCE_NATIVE',
  'HTTP_PROXY',
  'HTTPS_PROXY',
  'NO_PROXY',
])

function documentedVars(path) {
  const text = readFileSync(path, 'utf8')
  const found = new Set()
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*#?\s*([A-Z][A-Z0-9_]{2,})=/)
    if (match) found.add(match[1])
  }
  return found
}

function referencedVars(paths) {
  const found = new Set()
  for (const path of paths) {
    const text = readFileSync(path, 'utf8')
    for (const match of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]{2,})/g)) {
      found.add(match[1])
    }
    for (const match of text.matchAll(/process\.env\[['"]([A-Z][A-Z0-9_]{2,})['"]\]/g)) {
      found.add(match[1])
    }
    // Launch-gate probes name vars as string literals, e.g. probe('CRON_SECRET').
    // Requiring an underscore keeps header values such as 'SAMEORIGIN' out.
    for (const match of text.matchAll(/['"]([A-Z][A-Z0-9]*_[A-Z0-9_]+)['"]/g)) {
      found.add(match[1])
    }
  }
  return found
}

function ignored(name) {
  if (IGNORED_EXACT.has(name)) return true
  return IGNORED_PREFIXES.some((prefix) => name.startsWith(prefix))
}

const rootDocs = documentedVars(ROOT_EXAMPLE)
const adminDocs = documentedVars(ADMIN_EXAMPLE)
const referenced = referencedVars(CONTRACT_FILES)

const missing = []
for (const name of [...referenced].sort()) {
  if (ignored(name)) continue
  const canonical = ALIASES.get(name) ?? name
  if (rootDocs.has(name) || rootDocs.has(canonical)) continue
  // Admin-only configuration may legitimately live in the admin template.
  if (adminDocs.has(name)) continue
  missing.push(name)
}

if (missing.length > 0) {
  console.error('Env documentation is out of date.')
  console.error('These vars are named by the launch contract but appear in neither')
  console.error(`${ROOT_EXAMPLE} nor ${ADMIN_EXAMPLE}:\n`)
  for (const name of missing) console.error(`  - ${name}`)
  console.error(
    '\nDocument each one (commented lines are fine) or add it to ALIASES in scripts/audit-env-docs.mjs with the canonical name it maps to.',
  )
  process.exit(1)
}

console.log(
  `Env documentation audit passed (${referenced.size} contract vars checked against ${rootDocs.size} documented keys).`,
)
