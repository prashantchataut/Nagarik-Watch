/**
 * Static import-graph analysis shared by the product-wiring gate.
 *
 * Node-only (it reads the source tree), so it lives outside the bundle and is
 * imported by tests and by `scripts/`, never by a route or a component.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry === '.next') continue
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
  }
  return out
}

const IMPORT = /from\s+['"]@\/([^'"]+)['"]/g
const RELATIVE_IMPORT = /from\s+['"](\.[^'"]*)['"]/g
/** `import { a, b } from '@nagarikwatch/db'` — captures the named bindings. */
const WORKSPACE_IMPORT = /import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]@nagarikwatch\/(\w+)['"]/g
const EXPORTED = /export\s+(?:async\s+)?(?:function|const|class|type|interface|enum)\s+(\w+)/g

/**
 * @param {string} appRoot absolute path to apps/web
 * @returns {{ originsByModule: Map<string, string[]>, source: Map<string, string> }}
 */
export function buildReaderImportGraph(appRoot) {
  const repoRoot = path.resolve(appRoot, '../..')
  const files = ['app', 'components', 'lib'].flatMap((dir) => walk(path.join(appRoot, dir)))
  const rel = (file) => path.relative(appRoot, file).split(path.sep).join('/')
  const source = new Map(files.map((file) => [rel(file), readFileSync(file, 'utf8')]))

  // Workspace packages are part of the product: `packages/db/src/cf.ts` is as
  // reader-facing as anything under `lib/` once a page imports it. They are
  // keyed by their repo-relative path so a catalog `implementation` string
  // matches either spelling.
  const packageDirs = readdirSync(path.join(repoRoot, 'packages')).filter((name) => {
    try {
      return statSync(path.join(repoRoot, 'packages', name, 'src')).isDirectory()
    } catch {
      return false
    }
  })
  /** Named export → the package file that declares it, per package. */
  const packageExports = new Map()
  for (const pkg of packageDirs) {
    const symbols = new Map()
    for (const file of walk(path.join(repoRoot, 'packages', pkg, 'src'))) {
      const key = path.relative(repoRoot, file).split(path.sep).join('/')
      if (/\.test\.tsx?$/.test(key)) continue
      const code = readFileSync(file, 'utf8')
      source.set(key, code)
      // The barrel re-exports everything; resolving through it by symbol is
      // what keeps `import type { Locale }` from marking the whole package
      // reader-wired.
      if (key.endsWith('/index.ts')) continue
      for (const match of code.matchAll(EXPORTED)) {
        if (!symbols.has(match[1])) symbols.set(match[1], key)
      }
    }
    packageExports.set(pkg, symbols)
  }

  const isAdmin = (file) => file.includes('admin') || file.includes('/(desk)/')
  const isTest = (file) => /\.test\.tsx?$/.test(file)
  const isPage = (file) => file.startsWith('app/') || file.startsWith('components/')

  // Reader-facing entrypoints: everything a visitor can reach. Admin desks and
  // test files are excluded — an algorithm that only the admin panel imports is
  // exactly what we are trying to tell apart.
  const readerEntrypoints = [...source.keys()]
    .filter((file) => isPage(file) && !isAdmin(file) && !isTest(file))
    .sort()

  // Newsroom entrypoints: the admin desks and admin APIs journalists and
  // editors actually use. The algorithms panel is not one of them — it imports
  // the dispatcher, which imports every handler, which would mark the whole
  // catalog "wired" and reinstate exactly the fiction this file exists to
  // prevent. The dispatch chain is untraversable here for the same reason.
  const DISPATCH_PREFIXES = [
    'lib/algorithms/runtime',
    'lib/algorithms/handlers/',
    'lib/algorithms/capabilities/',
  ]
  const isDispatch = (file) => DISPATCH_PREFIXES.some((prefix) => file.startsWith(prefix))
  const newsroomEntrypoints = [...source.keys()]
    .filter((file) => isPage(file) && isAdmin(file) && !isTest(file) && !isDispatch(file))
    .filter((file) => !file.includes('/algorithms/'))
    .sort()

  const resolve = (spec) =>
    [`${spec}.ts`, `${spec}.tsx`, `${spec}/index.ts`, `${spec}/index.tsx`].find((candidate) =>
      source.has(candidate),
    ) ?? null

  /**
   * Breadth-first import closure from a set of entrypoints.
   * @param {string[]} entrypoints
   * @param {(file: string) => boolean} blocked modules not to traverse into
   * @returns {Map<string, string[]>} module → entrypoints that reach it
   */
  const closure = (entrypoints, blocked = () => false) => {
    const origins = new Map()
    for (const start of entrypoints) {
      const seen = new Set([start])
      const queue = [start]
      const visit = (resolved) => {
        if (!resolved || seen.has(resolved) || blocked(resolved)) return
        seen.add(resolved)
        queue.push(resolved)
      }
      while (queue.length > 0) {
        const current = queue.shift()
        const code = source.get(current) ?? ''
        for (const match of code.matchAll(IMPORT)) visit(resolve(match[1]))
        for (const match of code.matchAll(RELATIVE_IMPORT)) {
          visit(resolve(path.posix.join(path.posix.dirname(current), match[1])))
        }
        for (const match of code.matchAll(WORKSPACE_IMPORT)) {
          const symbols = packageExports.get(match[2])
          if (!symbols) continue
          for (const binding of match[1].split(',')) {
            // Strip `type ` and ` as alias` so the declared name is what we look up.
            const name = binding
              .trim()
              .replace(/^type\s+/, '')
              .split(/\s+as\s+/)[0]
              .trim()
            visit(symbols.get(name))
          }
        }
      }
      for (const reached of seen) {
        const bucket = origins.get(reached) ?? new Set()
        bucket.add(start)
        origins.set(reached, bucket)
      }
    }
    return new Map([...origins].map(([module, roots]) => [module, [...roots].sort()]))
  }

  return {
    originsByModule: closure(readerEntrypoints),
    newsroomOriginsByModule: closure(newsroomEntrypoints, isDispatch),
    source,
  }
}

/**
 * Modules named in a catalog entry's `implementation`.
 *
 * `apps/web/` paths are returned relative to apps/web; `packages/` paths keep
 * their repo-relative form, matching how the graph keys them. The algorithm
 * runtime itself is excluded: every entry names it, and it is the admin panel's
 * dispatcher, not evidence that a reader reaches anything.
 */
export function implementationModules(implementation) {
  const web = [...implementation.matchAll(/apps\/web\/([\w\-./[\]()]+?)(?:\.tsx?)?(?=#|\s|,|$)/g)]
    .map((match) => match[1])
    .filter((candidate) => !candidate.startsWith('lib/algorithms/'))
  const workspace = [
    ...implementation.matchAll(/(?<!apps\/web\/)(packages\/[\w\-./]+?)(?:\.tsx?)?(?=#|\s|,|$)/g),
  ].map((match) => match[1])
  return [...web, ...workspace]
}

/** Resolve a bare module path to the file that exists on disk. */
export function resolveModule(source, modulePath) {
  return (
    [`${modulePath}.ts`, `${modulePath}.tsx`, `${modulePath}/index.ts`].find((candidate) =>
      source.has(candidate),
    ) ?? null
  )
}
