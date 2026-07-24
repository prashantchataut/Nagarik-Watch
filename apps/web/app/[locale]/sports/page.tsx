import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { SportsScoreboard } from '@/components/sports/SportsScoreboard'
import { asLocale } from '@/lib/i18n/locales'
import { canonicalAlternates } from '@/lib/seo/canonical'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const ne = locale === 'ne'
  return {
    title: ne ? 'खेलकुद' : 'Sports',
    description: ne ? 'प्रमाणित स्कोर र खेलकुद समाचार।' : 'Verified scores and sports stories.',
    alternates: canonicalAlternates(locale, '/sports'),
  }
}

export const dynamic = 'force-static'

export default async function SportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  return <SportsScoreboard locale={locale} showStories />
}
