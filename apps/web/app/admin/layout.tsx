import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import '../globals.css'
import { fontVariables } from '../fonts'

export const metadata: Metadata = {
  title: 'Newsroom Admin, Nagarik Watch',
  robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.ENABLE_WEB_ADMIN_SCAFFOLD !== 'true') notFound()

  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen bg-surface text-ink font-sans antialiased">{children}</body>
    </html>
  )
}
