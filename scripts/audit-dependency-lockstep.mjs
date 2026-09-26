#!/usr/bin/env node
/**
 * Some dependencies are not independent packages, they are one package that
 * ships under several names. Bump half of such a family and the install still
 * resolves, the lockfile is still valid, lint and typecheck still pass — and
 * the build dies somewhere deep inside node_modules on a symbol that only
 * exists in the half you moved.
 *
 * This has now happened twice.
 *
 *   PR #23 raised `prisma` to 7 and left `@prisma/client` on 6. The CLI is a
 *   devDependency and the client is a production one, so they landed in
 *   different Dependabot groups. `@prisma/client` declares `prisma` as an
 *   optional peer, so no resolver objected, and `prisma generate` runs in both
 *   `build` and `postinstall` — every CI job died at Install.
 *
 *   PR #46 raised all five `@payloadcms/*` packages to 3.90.1 and left
 *   `payload` itself on 3.85.1. `@payloadcms/storage-vercel-blob@3.90.1` pulls
 *   `@payloadcms/plugin-cloud-storage@3.90.1`, which imports
 *   `verifyClientUploadReceipt` from `payload/internal` — an export added after
 *   3.85.1. `pnpm install` was happy. `next build` in apps/admin was not:
 *   "Export verifyClientUploadReceipt doesn't exist in target module".
 *
 * `.github/dependabot.yml` already declares these families so Dependabot keeps
 * them together, but a config file is a request, not a guarantee: #46 was
 * grouped exactly as configured and still split the family. So the invariant
 * lives here instead, where it fails the PR that introduces the skew rather
 * than the build three steps later.
 *
 * Two rules:
 *
 *   1. Every member of a lockstep family declares the identical version spec,
 *      in every workspace manifest that declares any of them.
 *   2. Where a family member declares a peer dependency the repo also installs
 *      directly, the declared spec must sit in the peer range's major. This is
 *      the check PR #8 and PR #42 both needed: `payload` peers `graphql`
 *      `^16.8.1`, and both PRs proposed graphql 17.
 *
 * Dependency-free and runnable before `pnpm install` — the peer range is read
 * out of pnpm-lock.yaml with a narrow hand-rolled reader rather than a YAML
 * library, the same approach `verify-lockfile-overrides.mjs` takes.
 */

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * A family is a set of packages published from one release train. `members` is
 * matched against dependency names; a trailing `/*` matches a scope prefix.
 * `peers` names peer dependencies of `anchor` that the repo also installs
 * directly, and whose major must agree with the range the anchor declares.
 */
const FAMILIES = [
  {
    name: 'payload',
    anchor: 'payload',
    members: ['payload', '@payloadcms/*'],
    peers: ['graphql'],
  },
  {
    name: 'prisma',
    anchor: 'prisma',
    members: ['prisma', '@prisma/client'],
    peers: [],
  },
]

const MANIFESTS = [
  'package.json',
  'apps/web/package.json',
  'apps/admin/package.json',
  'packages/db/package.json',
  'packages/infra/package.json',
  'packages/ingest/package.json',
  'packages/tsconfig/package.json',
  'packages/ui/package.json',
]

const DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies']

function matches(name, patterns) {
  return patterns.some((pattern) =>
    pattern.endsWith('/*') ? name.startsWith(pattern.slice(0, -1)) : name === pattern,
  )
}

/** Every `name -> { spec, manifest }` declaration across the workspace. */
function declarations() {
  const found = []
  for (const manifest of MANIFESTS) {
    const path = join(repoRoot, manifest)
    if (!existsSync(path)) continue
    const json = JSON.parse(readFileSync(path, 'utf8'))
    for (const field of DEPENDENCY_FIELDS) {
      for (const [name, spec] of Object.entries(json[field] ?? {})) {
        found.push({ name, spec, manifest, field })
      }
    }
  }
  return found
}

/**
 * Reads the `peerDependencies:` block of `packages: <name>@<version>:` out of
 * pnpm-lock.yaml, where `key` is the bare `<name>@<version>`.
 *
 * The lockfile nests at fixed indents: `packages:` at 0, the package key at 2,
 * `peerDependencies:` at 4, each peer at 6. Anything shallower ends the entry.
 * The unsuffixed key is matched exactly so the peer-resolved duplicates further
 * down the file (`payload@3.85.1(graphql@16.14.2)(typescript@5.9.3)`) are not
 * mistaken for it.
 */
function lockedPeerRanges(lockfile, key) {
  const lines = lockfile.split('\n')
  const start = lines.indexOf(`  ${key}:`)
  if (start === -1) return null

  const peers = {}
  let inPeers = false
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue
    if (!line.startsWith('    ')) break
    if (line.startsWith('    peerDependencies:')) {
      inPeers = true
      continue
    }
    if (!line.startsWith('      ')) {
      inPeers = false
      continue
    }
    if (!inPeers) continue
    const separator = line.indexOf(': ')
    if (separator === -1) continue
    peers[line.slice(6, separator).trim()] = line
      .slice(separator + 2)
      .trim()
      .replace(/^['"]|['"]$/g, '')
  }
  return peers
}

/** The major version a `^x.y.z` / `~x.y.z` / `x.y.z` spec resolves against. */
function major(spec) {
  const match = /(\d+)\./.exec(spec)
  return match ? match[1] : null
}

const errors = []
const all = declarations()
const lockfilePath = join(repoRoot, 'pnpm-lock.yaml')
const lockfile = existsSync(lockfilePath) ? readFileSync(lockfilePath, 'utf8') : ''

for (const family of FAMILIES) {
  const declared = all.filter((entry) => matches(entry.name, family.members))
  if (declared.length === 0) continue

  const specs = new Map()
  for (const entry of declared) {
    if (!specs.has(entry.spec)) specs.set(entry.spec, [])
    specs.get(entry.spec).push(`${entry.name} (${entry.manifest})`)
  }

  if (specs.size > 1) {
    const split = [...specs.entries()]
      .map(([spec, who]) => `      ${spec}\n        ${who.join('\n        ')}`)
      .join('\n')
    errors.push(
      `  ${family.name}: the family is split across ${specs.size} versions.\n${split}\n` +
        `      Move every member together, then regenerate pnpm-lock.yaml.`,
    )
    continue
  }

  const anchor = declared.find((entry) => entry.name === family.anchor)
  if (!anchor || family.peers.length === 0) continue

  const version = anchor.spec.replace(/^[\^~]/, '')
  const peers = lockedPeerRanges(lockfile, `${family.anchor}@${version}`)
  if (!peers) continue

  for (const peer of family.peers) {
    const range = peers[peer]
    const installed = all.find((entry) => entry.name === peer)
    if (!range || !installed) continue
    if (major(range) !== major(installed.spec)) {
      errors.push(
        `  ${family.name}: ${peer} is declared "${installed.spec}" in ${installed.manifest}, ` +
          `but ${family.anchor}@${version} peers "${range}".\n` +
          `      ${peer} cannot move to a new major before ${family.anchor} peers it.`,
      )
    }
  }
}

if (errors.length > 0) {
  console.error('Dependency families are out of lockstep:\n')
  console.error(errors.join('\n\n'))
  console.error(
    `\nThese families ship from one release train. See the rationale in ` +
      `${relative(repoRoot, fileURLToPath(import.meta.url))} and the groups in .github/dependabot.yml.`,
  )
  process.exit(1)
}

console.log(`Dependency lockstep OK (${FAMILIES.map((f) => f.name).join(', ')}).`)
