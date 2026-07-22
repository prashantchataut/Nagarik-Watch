#!/usr/bin/env node
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const isStatic = process.env.CF_PAGES_STATIC === '1'
const importLine = "import { pageDynamic } from '@/lib/build-mode'"
const dynamicStatic = "export const dynamic = 'force-static'"
const dynamicRuntime = 'export const dynamic = pageDynamic'

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) walk(full, files)
    else if (name === 'page.tsx') files.push(full)
  }
  return files
}

function stripImport(src) {
  return src
    .replace(new RegExp(`^${importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n`, 'm'), '')
    .replace(new RegExp(`\\n${importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'm'), '\n')
}

for (const full of walk(path.join(root, 'app'))) {
  let src = readFileSync(full, 'utf8')
  const hadForceDynamic = src.includes("export const dynamic = 'force-dynamic'")
  const hadPageDynamic = src.includes('export const dynamic = pageDynamic')
  if (!hadForceDynamic && !hadPageDynamic) continue

  if (isStatic) {
    src = stripImport(src)
    src = src
      .replace("export const dynamic = 'force-dynamic'", dynamicStatic)
      .replace('export const dynamic = pageDynamic', dynamicStatic)
  } else {
    src = src.replace("export const dynamic = 'force-dynamic'", dynamicRuntime)
    if (!src.includes(importLine)) src = `${importLine}\n${src}`
  }

  writeFileSync(full, src)
  console.log('patched', path.relative(root, full))
}
