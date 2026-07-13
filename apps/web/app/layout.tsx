import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { fontVariables } from './fonts'
import { SITE_URL } from '@/lib/site'

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem('nw-theme');
    const theme = stored === 'dark' || stored === 'light'
      ? stored
      : (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();`

export const metadata: Metadata = {
  title: { default: 'Nagarik Watch', template: '%s | Nagarik Watch' },
  description: 'Independent Nepali news, public-service information and useful tools.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.webmanifest',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ne" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
