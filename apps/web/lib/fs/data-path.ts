/**
 * Path helpers for the on-disk `.data` fallback stores.
 *
 * Every one of these stores used to be written as
 * `process.env.X ?? path.join(process.cwd(), '.data', 'y.json')`. That union of
 * a static segment and an unknown value defeats Turbopack's static analysis:
 * it reports "Dynamic filesystem access causes tracing of the whole project"
 * and packs the entire monorepo into the serverless trace, which is how a
 * function blows past the 250 MB limit.
 *
 * The fix is the same one `lib/storage/local-media-store.ts` already uses:
 * return early for the configured override, and anchor the default to this
 * module via `import.meta.url` so it is a fully static expression. Behaviour is
 * unchanged — `next build`/`next dev`/`next start` all run with cwd set to
 * `apps/web`, so the anchored default resolves to the same directory the
 * `process.cwd()` form did, and `path.resolve(value)` is by definition
 * `path.resolve(process.cwd(), value)` for a relative override.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** apps/web — anchored to this file, not to the process working directory. */
const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/** Absolute path for an operator-supplied path, which may be relative to cwd. */
export function resolveConfiguredPath(configured: string): string {
  return path.isAbsolute(configured) ? configured : path.resolve(configured)
}

/**
 * Location of a `.data` store: the `X_STORE_PATH` override when set, otherwise
 * `apps/web/.data/<...segments>`.
 */
export function dataPath(configured: string | undefined, ...segments: string[]): string {
  const value = configured?.trim()
  if (value) return resolveConfiguredPath(value)
  return path.join(PACKAGE_ROOT, '.data', ...segments)
}
