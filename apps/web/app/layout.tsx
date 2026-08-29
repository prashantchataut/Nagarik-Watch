import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import './globals.css'
import './editorial-redesign.css'
import { fontVariables } from './fonts'
import { isStaticPagesExport } from '@/lib/build-mode'
import { SITE_URL } from '@/lib/site'

const themeBootScript = `(() => {
  try {
    const stored = localStorage.getItem('nw-theme');
    const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();`

export const metadata: Metadata = {
  title: { default: 'नागरिक वाच | Nagarik Watch', template: '%s | Nagarik Watch' },
  description:
    'नेपालको स्वतन्त्र समाचार, सार्वजनिक सरोकार र डिजिटल पात्रो। Independent Nepali news and public service portal.',
  metadataBase: new URL(SITE_URL),
  manifest: '/manifest.webmanifest',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  let lang: 'ne' | 'en' = 'ne'
  if (!isStaticPagesExport) {
    const headerStore = await headers()
    lang = headerStore.get('x-locale') === 'en' ? 'en' : 'ne'
  }
  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-screen bg-surface font-sans text-ink antialiased">{children}</body>
    </html>
  )
}
