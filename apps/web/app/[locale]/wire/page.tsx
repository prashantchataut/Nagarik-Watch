import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'Latest',
  robots: { index: false, follow: false },
}

/** External wire digest retired — readers stay on Nagarik Watch content. */
export default async function WireDigestPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  redirect(localizeHref(locale, '/latest'))
}
