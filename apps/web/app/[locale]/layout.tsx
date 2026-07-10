import type { ReactNode } from 'react'
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <div lang={locale === 'en' ? 'en' : 'ne'}>{children}</div>
}
