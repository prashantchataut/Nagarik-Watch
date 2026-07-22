#!/usr/bin/env node
/** Restore app segments moved to .pages-build-bak by the static Pages build. */
import { existsSync, mkdirSync, renameSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const appDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bak = path.join(appDir, '.pages-build-bak')

function restore(fromRel, toRel) {
  const from = path.join(bak, fromRel)
  const to = path.join(appDir, toRel)
  if (!existsSync(from)) return
  if (existsSync(to)) {
    console.warn('skip (exists):', toRel)
    return
  }
  mkdirSync(path.dirname(to), { recursive: true })
  renameSync(from, to)
  console.log('restored', toRel)
}

restore('admin', path.join('app', 'admin'))
restore('api', path.join('app', 'api'))
restore(path.join('[locale]', 'auth'), path.join('app', '[locale]', 'auth'))
restore(path.join('[locale]', 'journalist'), path.join('app', '[locale]', 'journalist'))

const middlewareBak = path.join(appDir, 'middleware.ts.pages-bak')
const middleware = path.join(appDir, 'middleware.ts')
if (existsSync(middlewareBak) && !existsSync(middleware)) {
  renameSync(middlewareBak, middleware)
  console.log('restored middleware.ts')
}

console.log('Done. Remove .pages-build-bak manually if empty.')
