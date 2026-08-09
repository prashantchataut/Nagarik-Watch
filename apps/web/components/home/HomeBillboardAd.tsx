import type { Locale } from '@nagarikwatch/db'
import { AdSlot } from '@/components/AdSlot'

export function HomeBillboardAd({ locale, className }: { locale: Locale; className?: string }) {
  return (
    <AdSlot locale={locale} placementKey="home-billboard" variant="billboard" className={className} />
  )
}
