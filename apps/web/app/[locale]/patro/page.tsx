import type { Metadata } from 'next'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getRealForex, getRealGoldSilver } from '@/lib/live/real'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { PatroShell } from '@/components/utilities/PatroShell'
import { PatroDesk } from '@/components/utilities/PatroDesk'

export const revalidate = 300

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Nepali calendar' : 'नेपाली पात्रो',
    description: en
      ? 'Bikram Sambat calendar with festivals, holidays, gold, forex and date tools.'
      : 'विक्रम संवत् पात्रो, पर्व, बिदा, सुनचाँदी, मुद्रा र मिति उपकरण।',
    alternates: canonicalAlternates(locale, '/patro'),
  }
}

export default async function PatroPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const [forex, gold, storiesPage] = await Promise.all([
    getRealForex(locale),
    getRealGoldSilver(locale),
    getStories({ locale, perPage: 9 }).catch(() => ({ items: [], total: 0 })),
  ])

  const latestStories = storiesPage.items.slice(0, 6).map((story) => {
    const title = en && story.titleEn ? story.titleEn : story.titleNe
    const rawThumb = story.heroImage?.url
    const thumb =
      rawThumb && !rawThumb.startsWith('data:') ? rawThumb : null
    return {
      id: story.id,
      href: localizeHref(locale, `/${story.category.slug}/${story.slug}`),
      title,
      thumb,
    }
  })

  return (
    <PatroShell locale={locale}>
      <PatroDesk
        locale={locale}
        forex={forex.data ?? []}
        gold={gold.data ?? null}
        latestStories={latestStories}
      />
    </PatroShell>
  )
}
