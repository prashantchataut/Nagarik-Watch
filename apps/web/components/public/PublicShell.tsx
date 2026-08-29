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
import { getNavCategories } from '@/lib/content'
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
import { MastheadReference } from '@/components/live/MastheadReference'
import { FALLBACK_NAV_CATEGORIES, PUBLICATION } from '@/lib/site'

export async function PublicShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const dict = getDictionary(locale)
  const [sourceNavCategories, session] = await Promise.all([
    getNavCategories().catch(() => []),
    getSession().catch(() => null),
  ])
  const navCategories =
    sourceNavCategories.length >= 5
      ? sourceNavCategories
      : ([...FALLBACK_NAV_CATEGORIES] as unknown as typeof sourceNavCategories)
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
        account={account}
        reference={
          <Suspense fallback={null}>
            <MastheadReference locale={locale} />
          </Suspense>
        }
      />
      <main id="main" className="min-h-[55vh] pb-[calc(3.5rem+env(safe-area-inset-bottom))] lg:pb-0">
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
