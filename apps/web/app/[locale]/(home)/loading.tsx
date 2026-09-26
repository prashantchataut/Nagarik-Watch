import { RouteSkeleton } from '@/components/system/RouteSkeleton'

/**
 * Scoped to the `(home)` route group on purpose. A `loading.tsx` one level up,
 * at `app/[locale]/`, would wrap every content route in a Suspense boundary
 * whose fallback flushes — and commits a 200 — before a page body can call
 * `notFound()`. That is what made unknown slugs answer 200 across five route
 * families. The home page has no `notFound()` path and is the slowest cold
 * render on the site, so it is the one route where the boundary pays.
 */
export default function HomeLoading() {
  return <RouteSkeleton variant="home" label="Loading the front page" />
}
