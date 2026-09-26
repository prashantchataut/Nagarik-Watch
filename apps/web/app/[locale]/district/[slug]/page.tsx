import { staticDistrictParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PublicHubPage } from '@/components/PublicHubPage'
import { findDistrict } from '@/lib/site'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticDistrictParams()
}

/**
 * District desk. `force-static` renders unlisted params at request time, so a
 * slug with no desk behind it has to be turned away here — otherwise
 * /district/anything answers 200 with a fabricated heading and no stories,
 * which is the soft 404 that keeps a site out of Google News.
 */
export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const district = findDistrict(slug)
  if (!district) notFound()

  return (
    <PublicHubPage
      locale={locale}
      district={district.slug}
      hub={{
        key: 'archive',
        path: `/district/${district.slug}`,
        titleNe: district.nameNe,
        titleEn: district.nameEn,
        leadNe: `${district.nameNe} जिल्लाका प्रकाशित सामग्री र स्थानीय अपडेट।`,
        leadEn: `Published stories and local updates from ${district.nameEn} District.`,
        mode: 'editorial',
      }}
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
  const district = findDistrict(slug)
  if (!district) return { title: 'Not found', robots: { index: false, follow: false } }
  return {
    title: loc === 'en' ? `${district.nameEn} District` : `${district.nameNe} जिल्ला`,
    alternates: { canonical: localizeHref(loc, `/district/${district.slug}`) },
  }
}
