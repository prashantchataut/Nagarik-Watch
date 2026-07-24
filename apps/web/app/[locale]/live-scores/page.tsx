import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { SportsScoreboard } from '@/components/sports/SportsScoreboard'
import { asLocale } from '@/lib/i18n/locales'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Live scores' : 'प्रत्यक्ष स्कोर',
    description: en
      ? 'Verified football and cricket scores.'
      : 'प्रमाणित फुटबल र क्रिकेट स्कोर।',
    alternates: canonicalAlternates(locale, '/live-scores'),
  }
}

export default async function LiveScoresPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  return <SportsScoreboard locale={locale} showStories={false} />
}
