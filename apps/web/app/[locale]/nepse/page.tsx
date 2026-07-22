import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

/** NEPSE canonicalizes on /market — keep URL for bookmarks. */
export default async function NepseRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  redirect(localizeHref(locale, '/market'))
}
