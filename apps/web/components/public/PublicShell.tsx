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
import { MastheadReference } from '@/components/live/MastheadReference'
import type { TopicLink } from '@/components/TopicsLinks'
import { PUBLICATION } from '@/lib/site'

/** Hub routes that already live in the primary nav; a tag echo of them is noise. */
const HUB_SLUGS = new Set(['fact-check', 'province', 'latest', 'home'])

function buildTopicLinks(
  locale: Locale,
  tags: Awaited<ReturnType<typeof getTags>>,
  navCategories: Awaited<ReturnType<typeof getNavCategories>>,
): TopicLink[] {
  // The trending band shows live tags, not synonyms of links one row above it.
  const taken = new Set([...HUB_SLUGS, ...navCategories.map((category) => category.slug)])
  return tags
    .filter((tag) => !taken.has(tag.slug))
    .slice(0, 12)
    .map((tag) => ({
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
  const topics = buildTopicLinks(locale, tags, navCategories)
  const adMode = getAdMode()
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
        reference={
          <Suspense fallback={null}>
            <MastheadReference locale={locale} />
          </Suspense>
        }
      />
      <main
        id="main"
        className="min-h-[55vh] pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0"
      >
        {children}
      </main>
      <Footer locale={locale} navCategories={navCategories} />
      <BottomChrome
        locale={locale}
        accountHref={account?.profileHref ?? localizeHref(locale, '/auth/login')}
        adsOn={adMode !== 'off'}
      />
      <SaveDataBoot />
      <PwaBoot />
      <RumBoot />
      <AnalyticsGate
        domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
        src={process.env.NEXT_PUBLIC_PLAUSIBLE_SRC || 'https://plausible.io/js/script.js'}
      />
      <NetworkAdScripts
        mode={adMode}
        network={getAdNetworkKind()}
        adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
        gamNetworkCode={getGamNetworkCode() || undefined}
      />
    </>
  )
}
