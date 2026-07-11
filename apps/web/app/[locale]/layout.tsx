import type { ReactNode } from 'react'
import { asLocale } from '@/lib/i18n/locales'
import { PublicShell } from '@/components/public/PublicShell'
export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  return <div lang={locale === 'en' ? 'en' : 'ne'}><PublicShell locale={locale}>{children}</PublicShell></div>
}
