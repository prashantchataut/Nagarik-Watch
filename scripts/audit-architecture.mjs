import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const failures = []
const warnings = []

const requiredFiles = [
  'docs/adr/ADR-014-canonical-cms.md',
  'docs/adr/ADR-015-durable-engagement-storage.md',
  'apps/web/lib/security/origin.ts',
  'scripts/launch-gate.mjs',
  '.github/workflows/ci.yml',
]
for (const file of requiredFiles) {
  if (!existsSync(join(root, file)))
    failures.push(`Missing required architecture artifact: ${file}`)
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx|mjs|md)$/.test(p)) out.push(p)
  }
  return out
}

const publicRoots = ['apps/web/app/[locale]', 'apps/web/components', 'apps/web/lib']
const bannedPublic = [
  /Connect provider/i,
  /No live rate/i,
  /API[_ -]?key instructions/i,
  /काम लाग्ने सेवा/i,
  /अनावश्यक हल्ला होइन/i,
  /coming soon/i,
  /demo data/i,
  /fake published/i,
]
for (const base of publicRoots) {
  const abs = join(root, base)
  if (!existsSync(abs)) continue
  for (const file of walk(abs)) {
    const rel = relative(root, file).split('/').join('/')
    if (/\/admin\//.test(rel) || /\/api\//.test(rel)) continue
    const text = readFileSync(file, 'utf8')
    for (const pattern of bannedPublic) {
      if (pattern.test(text)) failures.push(`${rel}: banned public/developer phrase ${pattern}`)
    }
  }
}


const payloadSource = readFileSync(join(root, 'apps/web/lib/content/payload-source.ts'), 'utf8')
if (!/\/api\/\$\{collection\}/.test(payloadSource) || !/payloadServerUrl\(\)/.test(payloadSource)) {
  failures.push('Payload content source is not using the separate CMS REST boundary.')
}
if (/@payload-config|getPayload\(/.test(payloadSource) || existsSync(join(root, 'apps/web/payload-config.d.ts'))) {
  failures.push('Web app still contains the impossible cross-deployment Payload Local API shim.')
}

const operationalDb = readFileSync(join(root, 'apps/web/lib/ops-db.ts'), 'utf8')
if (!/DATABASE_URL must point to Postgres for production operational storage/.test(operationalDb)) {
  failures.push('Operational stores can still silently fall back to memory in production.')
}

const rateLimit = readFileSync(join(root, 'apps/web/lib/rate-limit.ts'), 'utf8')
if (!/CREATE TABLE IF NOT EXISTS nw_rate_limits/.test(rateLimit)) {
  failures.push('Public write rate limiting is not shared through Postgres.')
}
if (!/Rate limit store unavailable/.test(rateLimit)) {
  failures.push('Production rate limiting must fail closed when Postgres is unavailable.')
}

const contentResolve = readFileSync(join(root, 'apps/web/lib/content/resolve-content-source.ts'), 'utf8')
if (!/isPayloadSourceMisconfigured/.test(contentResolve) || !/Refusing to fall back/.test(contentResolve)) {
  failures.push('Content source must fail closed when Payload is misconfigured (no silent desk fallthrough).')
}

const payloadAdminClient = readFileSync(join(root, 'apps/web/lib/content/payload-admin-client.ts'), 'utf8')
if (!/users API-Key/.test(payloadAdminClient) || !/assertLocalContentAdmin/.test(payloadAdminClient)) {
  failures.push('Payload journalist bridge or shadow-store production guard is missing.')
}

const auth = readFileSync(join(root, 'apps/web/lib/auth/index.ts'), 'utf8')
if (/defaultValue:\s*'reader'[\s\S]{0,120}input:\s*true/.test(auth)) {
  failures.push('Auth role field still accepts public input; role self-escalation risk remains.')
}
if (!/AUTH_SECRET.*required in production/.test(auth)) {
  failures.push('Auth secret production hard-fail is missing.')
}
if (!/storage:\s*'database'/.test(auth) || !/ipAddressHeaders/.test(auth)) {
  failures.push('Better Auth rate limits are not using database storage and trusted proxy IP headers.')
}

const middleware = readFileSync(join(root, 'apps/web/middleware.ts'), 'utf8')
if (!/NextResponse\.next\(\{ request: \{ headers: requestHeaders \} \}\)/.test(middleware)) {
  failures.push('Admin pathname stamping is not applied to request headers.')
}

const engagement = readFileSync(join(root, 'apps/web/lib/engagement/store.ts'), 'utf8')
if (
  !/CREATE TABLE IF NOT EXISTS nw_comments/.test(engagement) ||
  !/CREATE TABLE IF NOT EXISTS nw_bookmarks/.test(engagement)
) {
  failures.push('Engagement store is not backed by durable SQL tables.')
}
if (/const bookmarks = new Map/.test(engagement)) {
  warnings.push(
    'Engagement store still contains dev/preview memory fallback; launch gate must block live without DATABASE_URL.',
  )
}

const launch = readFileSync(join(root, 'apps/web/lib/launch-readiness.ts'), 'utf8')
for (const token of [
  'LAUNCH_MIN_PUBLISHED_ARTICLES',
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_NEWSROOM_ADDRESS',
]) {
  if (!launch.includes(token)) failures.push(`Launch readiness does not check ${token}.`)
}

if (failures.length) {
  console.error('Architecture audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  if (warnings.length) {
    console.error('Warnings:')
    for (const warning of warnings) console.error(`- ${warning}`)
  }
  process.exit(1)
}

if (warnings.length) {
  console.warn('Architecture audit warnings:')
  for (const warning of warnings) console.warn(`- ${warning}`)
}
console.log('Architecture audit passed.')
