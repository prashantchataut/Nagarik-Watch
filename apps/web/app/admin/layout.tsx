import type { ReactNode } from 'react'

/** Ungated admin routes (login). Must not call requireNewsroomSession. */
export default function AdminPublicLayout({ children }: { children: ReactNode }) {
  return children
}
