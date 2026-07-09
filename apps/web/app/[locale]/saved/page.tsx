import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { SavedStoriesClient } from '@/components/reader/SavedStoriesClient'

export const metadata: Metadata = {
  title: 'Saved stories',
}

export default async function SavedPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  return <SavedStoriesClient locale={locale} />
}
