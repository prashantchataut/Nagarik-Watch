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
        path: `/province/${slug}`,
        titleNe: title,
        titleEn: title,
        leadNe: 'प्रदेश-आधारित समाचारका लागि CMS taxonomy जोड्न तयार पृष्ठ।',
        leadEn: 'Province-based news page prepared for CMS taxonomy integration.',
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
    alternates: { canonical: localizeHref(loc, `/province/${slug}`) },
    robots: { index: false, follow: true },
  }
}
