import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Newsroom Admin',
  description: 'Nagarik Watch newsroom admin.',
  robots: { index: false, follow: false },
}

/** Shared admin metadata only. Auth lives in `(desk)`; login is under `(public)`. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children
}
