import type { Locale } from '@nagarikwatch/db'
import { AdSlot } from '@/components/AdSlot'

export function HomeMidAd({ locale, className }: { locale: Locale; className?: string }) {
  return <AdSlot locale={locale} placementKey="home-mid" variant="inline" className={className} />
}
