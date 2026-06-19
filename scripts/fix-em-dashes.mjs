#!/usr/bin/env node
/**
 * One-off script: replace em dashes (—) and double-hyphens (--) in markdown files with
 * the impeccable-compliant punctuation. The impeccable + anti-slop rules ban em dashes;
 * use commas, colons, semicolons, periods, or parentheses instead.
 *
 * Heuristic (the em dash here is almost always a spaced parenthetical aside):
 *   "A — B"  -> "A, B"   (most common; comma is never wrong for a parenthetical)
 *   "A—B"   -> "A, B"   (unspaced compound use; rare, comma still reads fine)
 *   "--"    -> ","      (double hyphen, also banned)
 *
 * Runs against all *.md under the repo (excluding node_modules). Prints a before/after
 * count. Re-run safe: idempotent once no em dashes remain.
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ROOT = process.cwd()

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === '.next' || entry.name === 'dist') continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (extname(entry.name) === '.md') out.push(p)
  }
  return out
}

function clean(text) {
  let out = text
  // Spaced em dash: "a — b" -> "a, b"
  out = out.replace(/(\S)\s*—\s*(\S)/g, '$1, $2')
  // Leading em dash at line start (rare in these docs): "— b" -> "b"
  out = out.replace(/^—\s+/gm, '')
  // Double hyphen used as a dash, spaced: "a -- b" -> "a, b"
  out = out.replace(/(\S)\s*--\s*(\S)/g, '$1, $2')
  // Any stragglers
  out = out.replace(/—/g, ',')
  out = out.replace(/(?<!\d)--(?!\d)/g, ',')
  // Tidy: ", ," -> ", " and " ," -> ","
  out = out.replace(/\s*,\s*,/g, ', ')
  return out
}

let totalBefore = 0
let totalAfter = 0
let filesTouched = 0

for (const file of await walk(ROOT)) {
  const original = await readFile(file, 'utf8')
  const before = (original.match(/—|--/g) || []).length
  if (before === 0) continue
  const cleaned = clean(original)
  const after = (cleaned.match(/—|--/g) || []).length
  totalBefore += before
  totalAfter += after
  filesTouched++
  await writeFile(file, cleaned, 'utf8')
  console.log(`  ${String(before - after).padStart(3)} fixed  ${file.replace(ROOT, '.')}`)
}

console.log(`\nFiles touched: ${filesTouched}`)
console.log(`Em dashes / -- before: ${totalBefore}`)
console.log(`Remaining after:        ${totalAfter}`)
