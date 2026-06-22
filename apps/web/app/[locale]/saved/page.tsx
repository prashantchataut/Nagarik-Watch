import type { Metadata } from 'next'
import type { Locale } from '@nagarikwatch/db'
import { getStories } from '@/lib/content'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { asLocale, localePrefix } from '@/lib/i18n/locales'
import { SavedStoriesClient } from '@/components/reader/SavedStoriesClient'

type Params = { locale: string }

export default async function SavedPage({ params }: { params: Promise<Params> }) {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const { items } = await getStories({ locale, perPage: 80 })

  return <SavedStoriesClient locale={locale} catalog={items} />
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale: Locale = asLocale(rawLocale)
  const dict = getDictionary(locale)
  const prefix = localePrefix(locale)
  return {
    title: dict.navSaved,
    robots: { index: false },
    alternates: { canonical: `${prefix}/saved`, languages: { ne: '/saved', en: '/en/saved' } },
  }
}
