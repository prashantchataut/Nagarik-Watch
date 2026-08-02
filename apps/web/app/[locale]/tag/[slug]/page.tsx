import { staticTagParams } from '@/lib/static-export-params'
import type { Metadata } from 'next'
import { permanentRedirect } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const revalidate = 60

export function generateStaticParams() {
  return staticTagParams()
}

export const metadata: Metadata = {
  title: 'Topic',
  robots: { index: false, follow: true },
}

/**
 * Compatibility route for the former /tag namespace. Topic pages are canonical
 * under /topic so duplicate indexes and split analytics cannot accumulate.
 */
export default async function LegacyTagPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { locale: rawLocale, slug } = await params
  const locale = asLocale(rawLocale)
  const { page } = await searchParams
  const target = localizeHref(locale, `/topic/${encodeURIComponent(slug)}`)
  const suffix = page && /^\d+$/.test(page) && page !== '1' ? `?page=${page}` : ''
  permanentRedirect(`${target}${suffix}`)
}
