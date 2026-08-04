import { Suspense, type ReactNode } from 'react'
import type { Locale } from '@nagarikwatch/db'
import { Masthead } from '@/components/Masthead'
import { Footer } from '@/components/Footer'
import { BottomChrome } from '@/components/BottomChrome'
import { PwaBoot } from '@/components/PwaBoot'
import { SaveDataBoot } from '@/components/SaveDataBoot'
import { SiteJsonLd } from '@/components/SiteJsonLd'
import { AnalyticsGate } from '@/components/analytics/AnalyticsGate'
import { NetworkAdScripts } from '@/components/ads/NetworkAdScripts'
import { RumBoot } from '@/components/RumBoot'
import { getNavCategories, getTags } from '@/lib/content'
import { getAdMode, getAdNetworkKind, getGamNetworkCode } from '@/lib/ads'
import { getSession } from '@/lib/auth/session'
import {
  accountKindLabel,
  resolveAccountKind,
  roleDisplayLabel,
  type AccountKind,
} from '@/lib/account-identity'
import { localizeHref } from '@/lib/i18n/locales'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { HtmlLangSync } from '@/components/HtmlLangSync'
import type { TopicChip } from '@/components/TopicsStrip'
import { UtilityStrip } from '@/components/live/UtilityStrip'

function buildTopicChips(locale: Locale, tags: Awaited<ReturnType<typeof getTags>>): TopicChip[] {
  const shortNe: Record<string, string> = {
    latest: 'ताजा',
    trending: 'ट्रेन्डिङ',
    'most-read': 'धेरै पढिएको',
    'editor-picks': 'सम्पादकीय छनोट',
    exclusive: 'विशेष',
    'fact-check': 'तथ्य-जाँच',
    market: 'बजार',
    rashifal: 'राशिफल',
  }
  const shortEn: Record<string, string> = {
    latest: 'Latest',
    trending: 'Trending',
    'most-read': 'Most read',
    'editor-picks': "Editor's pick",
    exclusive: 'Exclusive',
    'fact-check': 'Fact check',
    market: 'Market',
    rashifal: 'Horoscope',
  }

  const hubs: TopicChip[] = []
  for (const key of TOPICS_STRIP_HUBS) {
    const hub = STATIC_HUBS.find((h) => h.key === key)
    if (!hub) continue
    hubs.push({
      href: localizeHref(locale, hub.path),
      label: locale === 'en' ? shortEn[key] ?? hub.titleEn : shortNe[key] ?? hub.titleNe,
      lang: locale === 'en' ? 'en' : 'ne',
    })
  }

  const tagChips: TopicChip[] = tags.slice(0, 8).map((tag) => ({
    href: localizeHref(locale, `/tag/${tag.slug}`),
    label: locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe,
    lang: locale === 'en' && tag.nameEn ? 'en' : 'ne',
  }))

  return [...hubs, ...tagChips]
}

export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale)
  const [navCategories, tags, session] = await Promise.all([
    getNavCategories(),
    getTags().catch(() => []),
    getSession().catch(() => null),
  ])
  const topics = buildTopicChips(locale, tags)
  const account = session
    ? (() => {
        const kind: AccountKind = resolveAccountKind(session.role)
        return {
          kind,
          displayName: session.displayName || session.email.split('@')[0] || session.email,
          kindLabel: accountKindLabel(kind, locale),
          roleLabel: roleDisplayLabel(session.role, locale),
          profileHref: localizeHref(locale, '/auth/profile'),
        }
      })()
    : null

  return (
    <>
      <HtmlLangSync locale={locale} />
      <a className="skip-link" href="#main">
        {dict.skipToContent}
      </a>
      <SiteJsonLd siteName={PUBLICATION.publisherName} />
      <Masthead locale={locale} navCategories={navCategories} topics={topics} account={account} />
      <Suspense
        fallback={
          <div
            className="h-9 border-b border-rule bg-surface-raised"
            aria-hidden="true"
          />
        }
      >
        <UtilityStrip locale={locale} />
      </Suspense>
      <main id="main" className="min-h-[55vh] pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
      <Footer locale={locale} navCategories={navCategories} />
      <BottomChrome locale={locale} accountHref={account?.profileHref ?? localizeHref(locale, '/auth/login')} />
      <SaveDataBoot />
      <PwaBoot />
      <RumBoot />
      <AnalyticsGate
        domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'}
      />
      <NetworkAdScripts
        mode={getAdMode()}
        network={getAdNetworkKind()}
        adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        gamNetworkCode={getGamNetworkCode() || undefined}
      />
    </>
  )
}
