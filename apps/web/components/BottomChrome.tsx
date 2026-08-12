import type { Locale } from '@nagarikwatch/db'
import { BottomNav } from '@/components/BottomNav'
import { CookieConsent } from '@/components/CookieConsent'
import { AdSlot } from '@/components/AdSlot'
import { getAdMode } from '@/lib/ads'

export async function BottomChrome({
  locale,
  accountHref,
  adsOn: adsOnProp,
}: {
  locale: Locale
  accountHref?: string
  adsOn?: boolean
}) {
  const adsOn = adsOnProp ?? (getAdMode() !== 'off')

  return (
    <div
      className="nw-bottom-chrome lg:contents"
      data-bottom-chrome="true"
      data-sticky-ad={adsOn ? 'true' : 'false'}
    >
      <BottomNav locale={locale} accountHref={accountHref} />
      {adsOn ? (
        <>
          <div
            className="nw-bottom-chrome__ad pointer-events-none fixed inset-x-0 z-30 flex justify-center px-3 lg:hidden"
            data-bottom-slot="ad"
          >
            <div className="pointer-events-auto w-full max-w-[22rem]">
              <AdSlot locale={locale} placementKey="mobile-sticky" className="px-3 py-2" />
            </div>
          </div>
          <div className="nw-bottom-chrome__spacer h-[5.75rem] lg:hidden" aria-hidden="true" />
        </>
      ) : null}
      <CookieConsent locale={locale} />
    </div>
  )
}
