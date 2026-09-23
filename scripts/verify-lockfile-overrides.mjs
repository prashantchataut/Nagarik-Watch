#!/usr/bin/env node
/**
 * Guard against the failure mode that took CI and production down.
 *
 * `pnpm.overrides` was edited in package.json without regenerating
 * pnpm-lock.yaml. Nothing in the repo noticed: lint, typecheck, tests and the
 * build all pass from an already-populated node_modules. The drift only
 * surfaced on a *clean* install, where `pnpm install --frozen-lockfile` aborts
 * with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH. That is the exact command CI runs and
 * the one `vercel.json` sets as `installCommand`, so every CI job died on its
 * Install step and Vercel stopped shipping new deploys — for 25 commits.
 *
 * This check compares the `overrides` block recorded in the lockfile against
 * `pnpm.overrides` in package.json and fails loudly when they diverge, so the
 * mismatch is caught on the PR that introduces it instead of in production.
 *
 * Dependency-free and runnable before `pnpm install`, which is why the lockfile
 * is parsed with a narrow hand-rolled reader rather than a YAML library.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Reads the top-level `overrides:` mapping out of pnpm-lock.yaml.
 *
 * The block is a flat `key: value` mapping at indent 2, terminated by the next
 * top-level key. Values may be quoted. Keys can contain `>` (`next>postcss`)
 * and `@` (`@scope/pkg`), so the split is on the first `: ` only.
 */
function lockfileOverrides(text) {
  const lines = text.split('\n')
  const start = lines.findIndex((line) => line === 'overrides:')
  if (start === -1) return {}

  const result = {}
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue
    // A non-indented line ends the block.
    if (!line.startsWith('  ')) break
    const separator = line.indexOf(': ')
    if (separator === -1) continue
    const key = line
      .slice(2, separator)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    const value = line
      .slice(separator + 2)
      .trim()
      .replace(/^['"]|['"]$/g, '')
    result[key] = value
  }
  return result
}

function describe(entries) {
  const keys = Object.keys(entries)
  if (keys.length === 0) return '(none)'
  return keys
    .sort()
    .map((key) => `${key}: ${entries[key]}`)
    .join(', ')
}

const manifest = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'))
const declared = manifest.pnpm?.overrides ?? {}
const locked = lockfileOverrides(readFileSync(join(repoRoot, 'pnpm-lock.yaml'), 'utf8'))

const keys = [...new Set([...Object.keys(declared), ...Object.keys(locked)])].sort()
const drift = keys.filter((key) => declared[key] !== locked[key])

if (drift.length > 0) {
  console.error('pnpm overrides drift between package.json and pnpm-lock.yaml:\n')
  for (const key of drift) {
    console.error(`  ${key}`)
    console.error(`    package.json : ${declared[key] ?? '(absent)'}`)
    console.error(`    pnpm-lock    : ${locked[key] ?? '(absent)'}`)
  }
  console.error(
    '\n`pnpm install --frozen-lockfile` will fail with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH,' +
      '\nwhich is what CI and Vercel both run. Fix it by running:\n' +
      '\n  pnpm install --no-frozen-lockfile\n' +
      '\nand committing the regenerated pnpm-lock.yaml.',
  )
  process.exit(1)
}

console.log(`pnpm overrides verified against the lockfile: ${describe(declared)}.`)
