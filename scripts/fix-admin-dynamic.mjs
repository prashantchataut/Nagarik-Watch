#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const roots = [
  'apps/web/app/admin',
  'apps/web/app/[locale]/journalist',
  'apps/web/app/[locale]/auth/profile',
]

let updated = 0
for (const root of roots) {
  const abs = path.join(process.cwd(), root)
  walk(abs)
}

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (ent.name.endsWith('.tsx') || ent.name.endsWith('.ts')) {
      const s = fs.readFileSync(p, 'utf8')
      if (!s.includes("export const dynamic = 'force-static'")) continue
      fs.writeFileSync(
        p,
        s.replace(/export const dynamic = 'force-static'/g, "export const dynamic = 'force-dynamic'"),
      )
      updated++
    }
  }
}

console.log(`updated ${updated} files`)
