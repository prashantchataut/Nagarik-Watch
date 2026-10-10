#!/usr/bin/env node
/**
 * Regenerate `lib/algorithms/product-surfaces.ts` from the real import graph.
 *
 * Run this when `lib/algorithms/wiring.test.ts` fails — that failure means an
 * algorithm became reachable from a reader-facing file, or stopped being
 * reachable, and the shipped table no longer matches the code.
 *
 *   pnpm algorithms:wiring
 */
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import prettier from 'prettier'
import {
  buildReaderImportGraph,
  implementationModules,
  platformModules,
  resolveModule,
} from '../lib/algorithms/wiring-graph.mjs'

const APP_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO_ROOT = path.resolve(APP_ROOT, '../..')
const TARGET = path.join(APP_ROOT, 'lib/algorithms/product-surfaces.ts')

const { originsByModule, newsroomOriginsByModule, source } = buildReaderImportGraph(APP_ROOT)
const catalog = readFileSync(path.join(APP_ROOT, 'lib/algorithms/catalog.ts'), 'utf8')

const rows = []
for (const block of catalog.split(/\n {2}\{\n/).slice(1)) {
  const id = /id:\s*'([^']+)'/.exec(block)?.[1]
  if (!id) continue
  const implementation = /implementation:\s*\n?\s*'([\s\S]*?)',\n/.exec(block)?.[1] ?? ''
  const modules = implementationModules(implementation)
    .map((modulePath) => resolveModule(source, modulePath))
    .filter(Boolean)
  // Reader wins over newsroom: if a visitor can reach it, that is the surface
  // worth reporting.
  const reader = modules.find((file) => (originsByModule.get(file) ?? []).length > 0)
  if (reader) {
    rows.push({ id, module: reader, entrypoint: originsByModule.get(reader)[0], surface: 'reader' })
    continue
  }
  const newsroom = modules.find((file) => (newsroomOriginsByModule.get(file) ?? []).length > 0)
  if (newsroom) {
    rows.push({
      id,
      module: newsroom,
      entrypoint: newsroomOriginsByModule.get(newsroom)[0],
      surface: 'newsroom',
    })
    continue
  }
  // Last: config, middleware, stylesheets and CI jobs, which ship without any
  // module importing them.
  const platform = platformModules(implementation, REPO_ROOT)[0]
  if (platform) {
    rows.push({ id, module: platform, entrypoint: platform, surface: 'platform' })
  }
}
rows.sort((a, b) => a.id.localeCompare(b.id))

const existing = readFileSync(TARGET, 'utf8')
const open = existing.indexOf('export const ALGORITHM_PRODUCT_WIRING')
// Anchor on `= [`, not the first `[` — that one belongs to `ProductWiring[]`.
const start = open < 0 ? -1 : existing.indexOf('\n', existing.indexOf('= [', open)) + 1
// Prettier indents a statement's closing bracket to the statement's own level,
// so the terminator is ` ]`, not `]`. Matching `\n]\n` meant this script could
// never find the array in a formatted file, and it bailed out with "edit by
// hand" the one time it was needed. `[ \t]` rather than `\s` so the match
// cannot run across a blank line into the next statement.
const closeAt = start < 0 ? -1 : existing.slice(start).search(/^[ \t]*\]/m)
const end = closeAt === -1 ? -1 : start + closeAt
if (open < 0 || start < 0 || end < 0) {
  console.error('Could not locate the ALGORITHM_PRODUCT_WIRING array; edit by hand.')
  process.exit(1)
}

const body = rows
  .map(
    (row) =>
      `  { id: '${row.id}', module: '${row.module}', entrypoint: '${row.entrypoint}', surface: '${row.surface}' },`,
  )
  .join('\n')
// Format the result the way `pnpm format:check` would, so regenerating the
// table never leaves the repo failing the formatting gate.
const next = `${existing.slice(0, start)}${body}${existing.slice(end)}`
writeFileSync(
  TARGET,
  await prettier.format(next, {
    ...(await prettier.resolveConfig(TARGET)),
    filepath: TARGET,
  }),
)
const count = (surface) => rows.filter((row) => row.surface === surface).length
console.log(
  `product-surfaces.ts: ${count('reader')} reader-wired + ${count('newsroom')} newsroom-only + ${count(
    'platform',
  )} platform of ${catalog.split(/\n {2}\{\n/).length - 1} in the catalog`,
)
