import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = process.cwd()
const scanRoots = ['apps/web/app', 'apps/web/components', 'apps/web/lib/site.ts', 'apps/web/lib/i18n/dictionaries.ts']
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mdx'])
const excludedSegments = new Set(['admin', 'api', '__tests__', 'test', 'tests'])

const banned = [
  /Production integration note/i,
  /typed scaffolds/i,
  /Replace mock providers/i,
  /Video coming soon/i,
  /भिडियो चाँडै/i,
  /demo\s*[—-]/i,
  /no provider wired/i,
  /Provider-backed widgets show demo labels/i,
  /प्रदायक नजोडिएसम्म विजेटले नमुना लेबल/i,
  /प्रकाशन दर्ता\s+pending/i,
  /registration\s+pending/i,
  /Nagarik Watch Media Pvt\. Ltd\. \(placeholder\)/i,
  /final newsroom address pending/i,
  /Mock feed/i,
]

const localhostAllowed = new Set(['apps/web/lib/site.ts'])
const failures = []

function extname(file) {
  const idx = file.lastIndexOf('.')
  return idx === -1 ? '' : file.slice(idx)
}

function shouldSkip(path) {
  const rel = relative(root, path).split('/').join('/')
  const parts = rel.split('/')
  if (parts.some((part) => excludedSegments.has(part))) return true
  if (rel.endsWith('.tsbuildinfo')) return true
  return false
}

function collect(path, out = []) {
  if (shouldSkip(path)) return out
  const stat = statSync(path)
  if (stat.isDirectory()) {
    for (const entry of readdirSync(path)) collect(join(path, entry), out)
    return out
  }
  if (extensions.has(extname(path))) out.push(path)
  return out
}

for (const entry of scanRoots) {
  const absolute = join(root, entry)
  for (const file of collect(absolute)) {
    const rel = relative(root, file).split('/').join('/')
    const text = readFileSync(file, 'utf8')
    for (const pattern of banned) {
      if (pattern.test(text)) failures.push(`${rel}: banned public-surface phrase ${pattern}`)
    }
    if (!localhostAllowed.has(rel) && /http:\/\/localhost:3000/.test(text)) {
      failures.push(`${rel}: localhost URL outside the central site config`)
    }
  }
}

if (failures.length > 0) {
  console.error('Public surface audit failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Public surface audit passed.')
