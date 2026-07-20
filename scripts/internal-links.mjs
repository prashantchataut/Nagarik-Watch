/**
 * Smoke-check internal trust/policy links referenced in navigation and footer.
 * Run: node scripts/internal-links.mjs
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const allowlist = readFileSync(join(root, 'apps/web/lib/public-path-allowlist.ts'), 'utf8')
const site = readFileSync(join(root, 'apps/web/lib/site.ts'), 'utf8')

const required = [
  '/about',
  '/privacy',
  '/ethics',
  '/editorial-policy',
  '/corrections-policy',
  '/terms',
  '/contact',
  '/cookies',
  '/advertise',
]

const missing = required.filter((path) => {
  const segment = path.replace(/^\//, '')
  return !allowlist.includes(`'${segment}'`) && !site.includes(`path: '${path}'`)
})

if (missing.length) {
  console.error('Internal link audit failed. Missing allowlist entries:')
  for (const path of missing) console.error(`- ${path}`)
  process.exit(1)
}

console.log(`Internal link audit passed (${required.length} trust/policy paths).`)
