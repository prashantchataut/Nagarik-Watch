import type { ReactNode } from 'react'

/** Journalist desk requires live sessions and API routes on every request. */
export const dynamic = 'force-dynamic'

export default function JournalistLayout({ children }: { children: ReactNode }) {
  return children
}
