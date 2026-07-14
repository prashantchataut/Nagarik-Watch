import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Create reader account',
  robots: { index: false, follow: false },
}

/** Compatibility route retained for old bookmarks and campaign links. */
export default async function LegacyRegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  permanentRedirect(localizeHref(locale, '/auth/signup'))
}
