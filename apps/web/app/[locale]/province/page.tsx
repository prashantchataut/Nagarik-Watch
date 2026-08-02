import type { Metadata } from 'next'
import { ProvinceIndex } from '@/components/province/ProvinceDesk'
import { getStories } from '@/lib/content'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { PROVINCES } from '@/lib/site'

export const revalidate = 60

export default async function ProvincesPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const locale = asLocale((await params).locale)
  const [{ items: allTagged }, ...perProvince] = await Promise.all([
    getStories({ locale, perPage: 40 }),
    ...PROVINCES.map((p) => getStories({ locale, province: p.slug, perPage: 40 })),
  ])

  const counts: Record<string, number> = {}
  for (let i = 0; i < PROVINCES.length; i += 1) {
    const province = PROVINCES[i]
    if (!province) continue
    counts[province.slug] = perProvince[i]?.items.length ?? 0
  }

  const recent = allTagged.filter((story) => Boolean(story.province)).slice(0, 9)

  return <ProvinceIndex locale={locale} counts={counts} recent={recent} />
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const title = locale === 'en' ? 'Provinces' : 'प्रदेश'
  return {
    title,
    alternates: { canonical: localizeHref(locale, '/province') },
  }
}
