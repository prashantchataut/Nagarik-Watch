import 'server-only'

/**
 * Module scope is not process scope here, and a database connection has to be
 * process-scoped to be correct.
 *
 * Next builds the RSC/SSR layer and the route-handler (node) layer as separate
 * module graphs. A file imported by both is emitted into both, so a plain
 * `let cached` in that file exists once per layer. Instrumenting `auth-pool.ts`
 * showed exactly that: one PGlite created from
 * `chunks/ssr/[root-of-the-server]__*.js` under `AdminLoginPage`, a second from
 * `chunks/[root-of-the-server]__*.js` under `getOperationalPool`, same pid,
 * same data directory.
 *
 * Two PGlite instances on one directory do not share a page cache, so this was
 * not a tidiness problem. `POST /api/journalist/articles` inserted a draft
 * handoff through the route-handler copy, `/admin/journalists` selected through
 * the RSC copy, and the editor's desk showed "no handoffs" for an article that
 * had just been filed -- no error anywhere, because both statements succeeded
 * against their own instance. The same split is what made a `CREATE TABLE IF
 * NOT EXISTS nw_taxonomy_terms` and the `SELECT` immediately after it disagree
 * about whether the table existed.
 *
 * Keying off `globalThis` via a registered symbol is the only scope both layers
 * actually share. `Symbol.for` rather than a string key so nothing else can
 * collide with it by accident, and so a second copy of *this* module resolves
 * to the same symbol.
 */

const REGISTRY = Symbol.for('nagarikwatch.process-singletons')

type Registry = Map<string, unknown>

function registry(): Registry {
  const holder = globalThis as typeof globalThis & { [REGISTRY]?: Registry }
  if (!holder[REGISTRY]) holder[REGISTRY] = new Map()
  return holder[REGISTRY]
}

/**
 * Build `key` at most once per process, and hand every later caller the same
 * promise -- including callers that are still waiting on the first build.
 *
 * Memoising the in-flight promise rather than the resolved value is the point:
 * a resolved-value cache still leaves the whole `await` open, so two concurrent
 * first callers both see nothing cached and both construct.
 *
 * A rejection is not cached. A transient failure (a database that is not up
 * yet) must not poison every later call for the life of the process.
 */
export function processSingleton<T>(key: string, create: () => Promise<T>): Promise<T> {
  const store = registry()
  const existing = store.get(key) as Promise<T> | undefined
  if (existing) return existing
  const pending = create().catch((error) => {
    store.delete(key)
    throw error
  })
  store.set(key, pending)
  return pending
}

/**
 * Shared mutable state for the same reason, when what needs to be process-wide
 * is not one built value but a small record several functions read and write --
 * `pg-pool`'s pool handle, its in-flight promise and its failure cooldown, which
 * only behave as a single-connection cap if every layer sees the same three.
 *
 * `init` runs at most once per key.
 */
export function processState<T extends object>(key: string, init: () => T): T {
  const store = registry()
  const existing = store.get(key) as { value: T } | undefined
  if (existing) return existing.value
  const created = { value: init() }
  store.set(key, created)
  return created.value
}

/** Drop a memoised singleton so the next caller rebuilds it. Tests and teardown. */
export function clearProcessSingleton(key: string): void {
  registry().delete(key)
}
