import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { asLocale } from '@/lib/i18n/locales'
import { SavedStoriesClient } from '@/components/reader/SavedStoriesClient'

type Params = { locale: string }

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  return {
    title: locale === 'en' ? 'Saved stories' : 'सुरक्षित समाचार',
    // Per-reader list held in local storage. Nothing here is shareable or
    // crawlable, so keep it out of the index like the other reader surfaces.
    robots: { index: false, follow: false },
  }
}

export default async function SavedPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  return <SavedStoriesClient locale={locale} />
}
