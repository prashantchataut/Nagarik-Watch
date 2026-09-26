import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * The locale home route moved into a `(home)` route group so its `loading.tsx`
 * boundary covers the front page alone — see `app/[locale]/(home)/loading.tsx`.
 * Route groups do not change the URL, so gates that assert on the home route
 * have to resolve it rather than hardcode one of the two spellings. Throwing
 * when neither exists keeps this a check rather than an escape hatch: a gate
 * that silently passes because it could not find its input is worse than none.
 */
const CANDIDATES = ['apps/web/app/[locale]/(home)/page.tsx', 'apps/web/app/[locale]/page.tsx']

export function homeRoutePath(root) {
  for (const candidate of CANDIDATES) {
    if (existsSync(join(root, candidate))) return candidate
  }
  throw new Error(`locale home route not found; looked for: ${CANDIDATES.join(', ')}`)
}
