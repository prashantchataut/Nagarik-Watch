import type { ReactNode } from 'react'
import { headers } from 'next/headers'
import { asLocale } from '@/lib/i18n/locales'
import { staticLocaleParams } from '@/lib/static-export-params'
import { PublicShell } from '@/components/public/PublicShell'
import { AuthChrome } from '@/components/auth/AuthChrome'

export function generateStaticParams() {
  return staticLocaleParams()
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)

  if (process.env.CF_PAGES_STATIC === '1') {
    return (
      <div lang={locale === 'en' ? 'en' : 'ne'}>
        <PublicShell locale={locale}>{children}</PublicShell>
      </div>
    )
  }

  const headerStore = await headers()
  const shell =
    (headerStore.get('x-nw-shell') as 'public' | 'auth' | 'journalist' | null) ?? 'public'

  return (
    <div lang={locale === 'en' ? 'en' : 'ne'}>
      {shell === 'auth' ? (
        <AuthChrome locale={locale}>{children}</AuthChrome>
      ) : shell === 'journalist' ? (
        children
      ) : (
        <PublicShell locale={locale}>{children}</PublicShell>
      )}
    </div>
  )
}
