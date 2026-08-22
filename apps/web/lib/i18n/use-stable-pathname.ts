'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Middleware rewrites public Nepali URLs into the internal /ne route tree.
 * `usePathname()` can therefore disagree between the server prerender and the
 * browser URL during hydration. Keep pathname-dependent chrome neutral until
 * mount, then track the browser pathname for active states and locale links.
 */
export function useStablePathname(): string {
  const livePathname = usePathname()
  const [pathname, setPathname] = useState('')

  useEffect(() => {
    setPathname(livePathname ?? '')
  }, [livePathname])

  return pathname
}
