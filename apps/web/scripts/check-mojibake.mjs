#!/usr/bin/env node
/**
 * Fails CI when UTF-8 mojibake (e.g. à¤ for Devanagari) appears in source.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SCAN_DIRS = ['app', 'components', 'lib']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.css', '.md', '.json'])
const PATTERN = /à¤|Ã |Â |â€™|â€œ|â€/

const hits = []

function walk(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === '.next' || name === 'dist') continue
    const full = join(dir, name)
    const st = statSync(full)
    if (st.isDirectory()) {
      walk(full)
      continue
    }
    const ext = name.slice(name.lastIndexOf('.'))
    if (!EXTENSIONS.has(ext)) continue
    const text = readFileSync(full, 'utf8')
    if (PATTERN.test(text)) {
      hits.push(relative(ROOT, full).replace(/\\/g, '/'))
    }
  }
}

for (const d of SCAN_DIRS) walk(join(ROOT, d))

if (hits.length) {
  console.error('Mojibake / corrupted UTF-8 detected in:')
  for (const f of hits) console.error(`  - ${f}`)
  process.exit(1)
}

console.log('check-mojibake: ok')
