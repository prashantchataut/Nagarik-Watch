'use client'

import { usePathname } from 'next/navigation'
import { useHydrated } from '@/lib/browser/use-client-state'

/**
 * The proxy rewrites public Nepali URLs into the internal /ne route tree.
 * `usePathname()` can therefore disagree between the server prerender and the
 * browser URL during hydration. Keep pathname-dependent chrome neutral until
 * mount, then track the browser pathname for active states and locale links.
 */
export function useStablePathname(): string {
  const livePathname = usePathname()
  return useHydrated() ? (livePathname ?? '') : ''
}
