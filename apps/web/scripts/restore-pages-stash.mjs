#!/usr/bin/env node
/**
 * Restore app segments moved to `.pages-build-bak/` by the static Pages build.
 *
 * The build restores them itself in a `finally`, but a hard kill (or a SIGKILL
 * from a CI timeout) leaves them stashed. `pnpm restore:stash` is the recovery
 * path; keep this list in step with the stash list in
 * `scripts/build-pages-static.mjs`.
 */
import { existsSync, mkdirSync, renameSync, rmdirSync } from 'node:fs'
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
restore('feeds', path.join('app', 'feeds'))
restore(path.join('[locale]', 'auth'), path.join('app', '[locale]', 'auth'))
restore(path.join('[locale]', 'journalist'), path.join('app', '[locale]', 'journalist'))

// Next 16 renamed the `middleware` file convention to `proxy`; accept either
// backup name so a stash from an older build still restores.
for (const base of ['proxy.ts', 'middleware.ts']) {
  const backup = path.join(appDir, `${base}.pages-bak`)
  const target = path.join(appDir, base)
  if (existsSync(backup) && !existsSync(target)) {
    renameSync(backup, target)
    console.log(`restored ${base}`)
  }
}

try {
  rmdirSync(bak)
  console.log('removed empty .pages-build-bak')
} catch {
  if (existsSync(bak))
    console.log('Done. .pages-build-bak is not empty — inspect it before deleting.')
}
