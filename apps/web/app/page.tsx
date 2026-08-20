import type { Metadata } from 'next'
import { HomePage, homeMetadata } from '@/components/home/HomePage'
import { PublicShell } from '@/components/public/PublicShell'

export const revalidate = 120

export function generateMetadata(): Metadata {
  return homeMetadata('ne')
}

/**
 * Middleware normally rewrites `/` into the Nepali locale tree. This fallback uses
 * the same homepage component and public shell if middleware is bypassed by a host.
 */
export default function RootPage() {
  return (
    <PublicShell locale="ne">
      <HomePage locale="ne" />
    </PublicShell>
  )
}
