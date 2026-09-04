import { redirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

/** The scoreboard canonicalizes on /live-scores — keep this URL for bookmarks and
 *  for the offline cache entry that already shipped in a service worker. */
export default async function SportsLiveRedirect({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  redirect(localizeHref(locale, '/live-scores'))
}
