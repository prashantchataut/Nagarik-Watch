import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Reader profile',
  robots: { index: false, follow: false },
}

/** Compatibility route. The canonical account URL is /auth/profile. */
export default async function LegacyProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  permanentRedirect(localizeHref(locale, '/auth/profile'))
}
