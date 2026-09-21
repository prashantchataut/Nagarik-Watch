'use client'

import { usePathname } from 'next/navigation'
import { useHydrated } from '@/lib/browser/use-browser-store'

/**
 * Middleware rewrites public Nepali URLs into the internal /ne route tree.
 * `usePathname()` can therefore disagree between the server prerender and the
 * browser URL during hydration. Keep pathname-dependent chrome neutral until
 * hydration completes, then track the browser pathname for active states and
 * locale links.
 *
 * Implemented with `useSyncExternalStore` (via `useHydrated`) rather than a
 * mount effect, so there is no extra render pass and no hydration mismatch.
 */
export function useStablePathname(): string {
  const livePathname = usePathname()
  const hydrated = useHydrated()
  return hydrated ? (livePathname ?? '') : ''
}
