import { staticProvinceParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ProvinceDesk } from '@/components/province/ProvinceDesk'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { PROVINCES } from '@/lib/site'

export const revalidate = 60

export function generateStaticParams() {
  return staticProvinceParams()
}

function resolveProvince(slug: string) {
  return PROVINCES.find((p) => p.slug === slug)
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const province = resolveProvince(slug)
  if (!province) notFound()

  const [{ items: stories }, { items: national }] = await Promise.all([
    getStories({ locale, province: slug, perPage: 24 }),
    getStories({ locale, perPage: 12 }),
  ])

  return (
    <ProvinceDesk
      locale={locale}
      province={province}
      stories={stories}
      nationalFallback={stories.length === 0 ? national : []}
    />
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}): Promise<Metadata> {
  const { locale, slug } = await params
  const loc = asLocale(locale)
  const province = resolveProvince(slug)
  const title = loc === 'en' ? (province?.nameEn ?? slug) : (province?.nameNe ?? slug)
  return {
    title,
    alternates: { canonical: localizeHref(loc, `/province/${slug}`) },
  }
}
