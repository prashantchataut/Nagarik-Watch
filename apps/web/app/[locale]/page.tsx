import type { Metadata } from 'next'
import { HomePage, homeMetadata } from '@/components/home/HomePage'
import { asLocale } from '@/lib/i18n/locales'

export const revalidate = 120

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  return homeMetadata(asLocale((await params).locale))
}

export default async function LocaleHomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  return <HomePage locale={asLocale((await params).locale)} />
}
