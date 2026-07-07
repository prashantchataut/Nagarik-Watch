import type { Metadata } from 'next'
import { PublicHubPage } from '@/components/PublicHubPage'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>
}) {
  const { locale, slug } = await params
  const title = slug.replace(/-/g, ' ')
  return (
    <PublicHubPage
      locale={asLocale(locale)}
      hub={{
        key: 'latest',
        path: `/district/${slug}`,
        titleNe: title,
        titleEn: title,
        leadNe: 'यस जिल्लाका प्रकाशित सामग्री, स्थानीय अपडेट र सम्बन्धित समाचार।',
        leadEn: 'Published stories, local updates and related coverage for this district.',
        mode: 'latest',
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
    title: slug.replace(/-/g, ' '),
    alternates: { canonical: localizeHref(loc, `/district/${slug}`) },
    robots: { index: false, follow: true },
  }
}
