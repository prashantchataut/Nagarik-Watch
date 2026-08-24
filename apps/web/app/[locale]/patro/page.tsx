import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getStories } from '@/lib/content'
import { getRealForex, getRealGoldSilver, getRealNepse } from '@/lib/live/real'
import { canonicalAlternates } from '@/lib/seo/canonical'
import { mainSiteHref } from '@/lib/calendar-host'
import { PatroShell } from '@/components/utilities/PatroShell'
import { PatroDesk } from '@/components/utilities/PatroDesk'
import { getPublishedCalendarSchedule } from '@/lib/calendar-schedule'
import { normalizeEditionHeroUrl } from '@/lib/content/store/seed-edition/_helpers'

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
  const onCalendarHost = (await headers()).get('x-nw-calendar-host') === '1'

  const [forex, gold, nepse, storiesPage, calendarSchedule] = await Promise.all([
    getRealForex(locale),
    getRealGoldSilver(locale),
    getRealNepse(locale),
    getStories({ locale, perPage: 9 }).catch(() => ({ items: [], total: 0 })),
    getPublishedCalendarSchedule(),
  ])

  const latestStories = storiesPage.items.slice(0, 6).map((story) => {
    const title = en && story.titleEn ? story.titleEn : story.titleNe
    const rawThumb = story.heroImage?.url
    // Desk rows can carry pre-compression .png paths that 404; normalize first,
    // then drop synthetic media so broken thumb boxes never render.
    const normalized =
      rawThumb && !rawThumb.startsWith('data:')
        ? normalizeEditionHeroUrl(rawThumb, story.slug) ?? rawThumb
        : null
    const thumb = normalized && !normalized.startsWith('data:') ? normalized : null
    const path = `/${story.category.slug}/${story.slug}`
    return {
      id: story.id,
      href: onCalendarHost ? mainSiteHref(locale, path) : localizeHref(locale, path),
      title,
      thumb,
    }
  })

  const desk = (
    <PatroDesk
      locale={locale}
      forex={forex.data ?? []}
      gold={gold.data ?? null}
      nepse={nepse.data ?? null}
      forexMeta={{ source: forex.source, updatedAt: forex.updatedAt }}
      goldMeta={{ source: gold.source, updatedAt: gold.updatedAt }}
      nepseMeta={{ source: nepse.source, updatedAt: nepse.updatedAt }}
      latestIndexHref={
        onCalendarHost ? mainSiteHref(locale, '/latest') : localizeHref(locale, '/latest')
      }
      latestStories={latestStories}
      calendarSchedule={calendarSchedule}
    />
  )

  // Calendar host already wraps with PatroChrome / standalone shell.
  if (onCalendarHost) return desk

  return <PatroShell locale={locale}>{desk}</PatroShell>
}
