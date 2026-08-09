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
import { AdSlot } from '@/components/AdSlot'
import { UtilityStrip } from '@/components/live/UtilityStrip'
import type { TopicChip } from '@/components/TopicsStrip'
import { PUBLICATION } from '@/lib/site'

function buildTopicChips(locale: Locale, tags: Awaited<ReturnType<typeof getTags>>): TopicChip[] {
  // Phase 0: strip shows live tags / topics, not hub synonyms of bottom nav.
  return tags.slice(0, 12).map((tag) => ({
    href: localizeHref(locale, `/tag/${tag.slug}`),
    label: locale === 'en' && tag.nameEn ? tag.nameEn : tag.nameNe,
    lang: locale === 'en' && tag.nameEn ? 'en' : 'ne',
  }))
}

export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale)
  const [navCategories, tags, session] = await Promise.all([
    getNavCategories().catch(() => []),
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
      <Masthead
        locale={locale}
        navCategories={navCategories}
        topics={topics}
        account={account}
        leaderboard={
          <Suspense fallback={null}>
            <AdSlot
              locale={locale}
              placementKey="masthead-leaderboard"
              variant="inline"
              collapseWhenOff
              className="!my-0"
            />
          </Suspense>
        }
      />
      <div className="hidden md:block">
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
      </div>
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
