#!/usr/bin/env node
/**
 * Repair script: the em-dash fixer's `--` -> `,` rule corrupted markdown table SEPARATOR
 * rows (e.g. `|---|---|---|---|` became `|, , , , -|...`). This rebuilds separator rows.
 *
 * A separator row is one whose only meaningful chars (ignoring `|`, space, `:`) are
 * `-` and `,`, and that sits between a header row and a data row. We rebuild it to the
 * canonical `| --- | --- | ... |` matching the column count of the surrounding rows.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, extname } from 'node:path'

const ROOT = process.cwd()

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist'].includes(entry.name)) continue
    const p = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(p)))
    else if (extname(entry.name) === '.md') out.push(p)
  }
  return out
}

function isSeparatorRow(line) {
  const trimmed = line.trim()
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false
  // Strip pipes and spaces; what's left must be only `-`, `:`, or `,` (the corruption).
  const inner = trimmed.slice(1, -1).replace(/\s/g, '')
  if (!inner) return false
  return /^[,:-]+$/.test(inner) && inner.includes(',')
}

function columnCount(row) {
  // Count cells in a normal table row.
  const trimmed = row.trim()
  return trimmed.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1).length
}

function rebuildSeparator(cols) {
  return '| ' + Array.from({ length: cols }, () => '---').join(' | ') + ' |'
}

let totalFixed = 0
let filesFixed = 0

for (const file of await walk(ROOT)) {
  const original = await readFile(file, 'utf8')
  const lines = original.split('\n')
  let changed = false

  for (let i = 0; i < lines.length; i++) {
    if (!isSeparatorRow(lines[i])) continue
    // Use the row above (header) and below (first data) to pick column count.
    const headerCols = lines[i - 1] ? columnCount(lines[i - 1]) : 0
    const dataCols = lines[i + 1] ? columnCount(lines[i + 1]) : 0
    const cols = headerCols || dataCols
    if (cols >= 1) {
      lines[i] = rebuildSeparator(cols)
      changed = true
      totalFixed++
    }
  }

  if (changed) {
    filesFixed++
    await writeFile(file, lines.join('\n'), 'utf8')
    console.log(`  fixed separators in ${file.replace(ROOT, '.')}`)
  }
}

console.log(`\nSeparator rows rebuilt: ${totalFixed} across ${filesFixed} files`)
