import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Nagarik Watch CMS',
  description: 'Editorial CMS for Nagarik Watch (नागरिक वाच)',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
