import { NextResponse, type NextRequest } from 'next/server'
import type { Locale } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { asLocale, localePrefix } from '@/lib/i18n/locales'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const locale: Locale = asLocale(request.nextUrl.searchParams.get('locale') ?? 'ne')
  const { items } = await getStories({ locale, perPage: 20 })
  const prefix = localePrefix(locale)
  const alerts = items
    .filter((story) => story.isBreaking)
    .slice(0, 5)
    .map((story) => ({
      id: story.id,
      title: locale === 'en' && story.titleEn ? story.titleEn : story.titleNe,
      url: `${prefix}/${story.category.slug}/${story.slug}`,
      publishedAt: story.publishedAt,
    }))
  return NextResponse.json({ alerts })
}
