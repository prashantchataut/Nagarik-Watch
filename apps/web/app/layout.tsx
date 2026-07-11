import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { fontVariables } from './fonts'

export const metadata: Metadata = {
  title: { default: 'Nagarik Watch', template: '%s | Nagarik Watch' },
  description: 'Independent Nepali news, public-service information and useful tools.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://nagarikwatch.com'),
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ne" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
