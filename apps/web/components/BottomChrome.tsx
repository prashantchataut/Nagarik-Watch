import type { Locale } from '@nagarikwatch/db'
import { BottomNav } from '@/components/BottomNav'
import { CookieConsent } from '@/components/CookieConsent'
import { AdSlot } from '@/components/AdSlot'
import { getAdMode } from '@/lib/ads'

/**
 * Single owner of the mobile bottom stack.
 * Order (bottom → top): BottomNav → optional sticky ad → CookieConsent.
 * Server component so AdSlot can keep its server-only house-ad data path.
 */
export async function BottomChrome({
  locale,
  accountHref,
}: {
  locale: Locale
  accountHref?: string
}) {
  const adsOn = getAdMode() !== 'off'

  return (
    <div className="contents lg:contents" data-bottom-chrome="true">
      <BottomNav locale={locale} accountHref={accountHref} />
      {adsOn ? (
        <div
          className="pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 lg:hidden bottom-[calc(3.5rem+env(safe-area-inset-bottom))]"
          data-bottom-slot="ad"
        >
          <div className="pointer-events-auto w-full max-w-[22rem]">
            <AdSlot locale={locale} placementKey="mobile-sticky" className="px-3 py-2" />
          </div>
        </div>
      ) : null}
      <CookieConsent locale={locale} adsElevated={adsOn} />
    </div>
  )
}
