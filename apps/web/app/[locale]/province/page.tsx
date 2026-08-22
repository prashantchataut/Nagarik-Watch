import type { Metadata } from 'next'
import { ProvinceIndex } from '@/components/province/ProvinceDesk'
import { getStories } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { PROVINCES } from '@/lib/site'

export const revalidate = 60

export default async function ProvincesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const [recentResult, ...perProvince] = await Promise.all([
    getStories({ locale, perPage: 30 }),
    ...PROVINCES.map((province) => getStories({ locale, province: province.slug, perPage: 1 })),
  ])

  const desks = PROVINCES.map((province, index) => ({
    province,
    total: perProvince[index]?.total ?? 0,
    latest: perProvince[index]?.items[0],
  }))
  const recent = recentResult.items.filter((story) => Boolean(story.province)).slice(0, 8)

  return <ProvinceIndex locale={locale} desks={desks} recent={recent} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const title = locale === 'en' ? 'Province desks' : 'प्रदेश डेस्क'
  return {
    title,
    alternates: { canonical: localizeHref(locale, '/province') },
  }
}
