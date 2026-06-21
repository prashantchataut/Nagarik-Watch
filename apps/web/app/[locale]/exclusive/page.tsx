import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { PublicHubPage } from '@/components/PublicHubPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { STATIC_HUBS, localizedTitle } from '@/lib/site'
const hub = STATIC_HUBS.find((item) => item.key === 'exclusive')!
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  return <PublicHubPage hub={hub} locale={asLocale((await params).locale)} />
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale: Locale = asLocale((await params).locale)
  return {
    title: localizedTitle(locale, hub),
    alternates: { canonical: localizeHref(locale, hub.path) },
  }
}
