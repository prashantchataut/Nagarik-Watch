import type { Locale } from '@nagarikwatch/db'
import { AdSlot } from '@/components/AdSlot'

export function MobileAdDock({ locale }: { locale: Locale }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-3 lg:hidden">
      <div className="pointer-events-auto w-full max-w-[22rem]">
        <AdSlot locale={locale} placementKey="mobile-sticky" className="rounded-full px-3 py-2" />
      </div>
    </div>
  )
}
