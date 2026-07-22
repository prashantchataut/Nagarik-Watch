import { staticDistrictParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { PublicHubPage } from '@/components/PublicHubPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const dynamic = 'force-static'

export function generateStaticParams() {
  return staticDistrictParams()
}

/** Title-case slug words for English; keep slug readable for Nepali until a district catalog exists. */
function districtTitle(slug: string, locale: 'ne' | 'en'): string {
  const words = slug.split('-').filter(Boolean)
  if (locale === 'en') {
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }
  return words.join(' ')
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale: raw, slug } = await params
  const locale = asLocale(raw)
  const titleNe = districtTitle(slug, 'ne')
  const titleEn = districtTitle(slug, 'en')
  return (
    <PublicHubPage
      locale={locale}
      hub={{
        key: 'archive',
        path: `/district/${slug}`,
        titleNe,
        titleEn,
        leadNe: `${titleNe} जिल्लाका प्रकाशित सामग्री र स्थानीय अपडेट।`,
        leadEn: `Published stories and local updates from ${titleEn} District.`,
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
  return {
    title: districtTitle(slug, loc === 'en' ? 'en' : 'ne'),
    alternates: { canonical: localizeHref(loc, `/district/${slug}`) },
  }
}
