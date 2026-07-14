import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Reader login',
  robots: { index: false, follow: false },
}

/** Compatibility route. Reader authentication lives under /auth. */
export default async function LegacyLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  permanentRedirect(localizeHref(locale, '/auth/login'))
}
