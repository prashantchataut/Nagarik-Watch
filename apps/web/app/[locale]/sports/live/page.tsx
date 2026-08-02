import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { SportsScoreboard } from '@/components/sports/SportsScoreboard'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { STATIC_HUBS, localizedTitle } from '@/lib/site'

const hub = STATIC_HUBS.find((item) => item.key === 'sports-live')!

export const dynamic = 'force-dynamic'
export const revalidate = 60

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  return <SportsScoreboard locale={locale} showStories />
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
