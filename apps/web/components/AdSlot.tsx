import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import type { Locale } from '@nagarikwatch/db'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizeHref } from '@/lib/i18n/locales'
import {
  adPlacement,
  getAdMode,
  getAdNetworkKind,
  isNetworkAdsReady,
  type AdPlacementKey,
  type AdSize,
} from '@/lib/ads'
import { AdTracker } from '@/components/ads/AdTracker'
import { HouseAdLink } from '@/components/ads/HouseAdLink'
import { NetworkAdUnit } from '@/components/ads/NetworkAdUnit'
import { SponsoredBadge } from '@nagarikwatch/ui'
import { getHouseAd, houseAdExperimentId, type HouseAdCreative } from '@/lib/house-ads'
import { assignAndRecordExperiment } from '@/lib/experiments/store'

const SIZE_CLASS: Record<AdSize, string> = {
  leaderboard: 'min-h-[90px] w-full max-w-[728px]',
  billboard: 'min-h-[180px] w-full max-w-[970px] sm:min-h-[250px]',
  rectangle: 'min-h-[250px] w-full max-w-[300px]',
  skyscraper: 'min-h-[600px] w-full max-w-[300px]',
  mobile: 'min-h-[50px] w-full max-w-[320px]',
  native: 'min-h-[120px] w-full',
}

type AdVariant = 'standard' | 'billboard' | 'rail' | 'inline' | 'native' | 'mobile'

export async function AdSlot({
  locale,
  className = '',
  placementKey,
  collapseWhenOff = true,
  variant,
}: {
  locale: Locale
  className?: string
  placementKey: AdPlacementKey
  collapseWhenOff?: boolean
  variant?: AdVariant
}) {
  const dict = getDictionary(locale)
  const lang = locale === 'en' ? 'en' : 'ne'
  const placement = adPlacement(placementKey)
  const mode = getAdMode()
  const adLabel = dict.adLabel
  const houseAd = mode === 'house' ? await getHouseAd(placement.key as AdPlacementKey) : null
  const mediaKitHref = localizeHref(locale, '/advertise')
  const resolvedVariant = variant ?? resolveVariant(placement.size)

  let creative: HouseAdCreative | null =
    houseAd?.active
      ? {
          title: houseAd.title,
          body: houseAd.body,
          cta: houseAd.cta,
          href: houseAd.href,
          imageUrl: houseAd.imageUrl,
        }
      : null
  let experimentId: string | undefined

  if (houseAd?.active && houseAd.abEnabled && houseAd.challenger) {
    experimentId = houseAdExperimentId(placement.key)
    const cookieStore = await cookies()
    const headerStore = await headers()
    const visitorKey =
      cookieStore.get('nw_reader')?.value?.trim() ||
      headerStore.get('cf-connecting-ip')?.trim() ||
      headerStore.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'anon'
    const assignment = await assignAndRecordExperiment({
      experimentId,
      visitorKey,
      eventType: 'exposure',
    }).catch(() => null)
    if (assignment?.variantId === 'challenger') {
      creative = houseAd.challenger
    }
  }

  if (mode === 'off' && collapseWhenOff) return null

  const description = locale === 'en' ? placement.descriptionEn : placement.descriptionNe

  return (
    <aside
      className={`${slotClass(resolvedVariant)} ${SIZE_CLASS[placement.size]} ${className}`}
      aria-label={`${adLabel}: ${placement.label}`}
      lang={lang}
      data-ad-placement={placement.key}
      data-ad-mode={mode}
      data-ad-size={`${placement.width}x${placement.height}`}
      data-ad-surface={placement.surface}
      style={{ minHeight: placement.height }}
    >
      <AdTracker placementKey={placement.key} mode={mode} />
      <span
        className={
          resolvedVariant === 'mobile' ? 'sr-only' : 'absolute inset-x-0 top-0 h-1 bg-brand-tint'
        }
        aria-hidden={resolvedVariant !== 'mobile'}
      />
      <div
        className={
          resolvedVariant === 'native'
            ? 'flex w-full flex-col gap-2 text-left sm:flex-row sm:items-center sm:justify-between'
            : 'flex flex-col items-center text-center'
        }
      >
        <div>
          {resolvedVariant === 'native' ? (
            <SponsoredBadge locale={locale} className="mb-1" />
          ) : (
            <span
              className={
                locale === 'en'
                  ? 'text-caption font-bold uppercase tracking-[0.06em] text-ink-soft'
                  : 'text-caption font-bold text-ink-soft'
              }
              lang={lang}
            >
              {adLabel}
            </span>
          )}
        </div>
        {mode === 'house' && creative ? (
          <HouseAdLink
            href={creative.href}
            className={resolvedVariant === 'native' ? 'max-w-[28rem] text-left' : 'max-w-[24rem]'}
            experimentId={experimentId}
            placementKey={placement.key}
          >
            {creative.imageUrl && !creative.imageUrl.startsWith('data:') ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote house-ad creative URL
              <img
                src={creative.imageUrl}
                alt=""
                className={
                  resolvedVariant === 'native'
                    ? 'mb-2 max-h-28 w-full rounded-md object-cover'
                    : 'mb-2 max-h-36 w-full rounded-md object-cover'
                }
              />
            ) : null}
            <span className="block font-display text-body-lg font-bold text-ink">
              {creative.title}
            </span>
            <span className="mt-1 block text-caption leading-relaxed text-ink-soft">
              {creative.body}
            </span>
            <span className="mt-3 inline-flex rounded-full border border-rule bg-surface px-3 py-1.5 text-caption font-bold text-ink transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-strong">
              {creative.cta}
            </span>
          </HouseAdLink>
        ) : mode === 'network' ? (
          isNetworkAdsReady() ? (
            <NetworkAdUnit
              network={getAdNetworkKind()}
              adsenseClient={process.env.NEXT_PUBLIC_ADSENSE_CLIENT}
              adsenseSlot={process.env.NEXT_PUBLIC_ADSENSE_SLOT}
              gamPath={
                process.env.NEXT_PUBLIC_GAM_NETWORK_CODE
                  ? `/${process.env.NEXT_PUBLIC_GAM_NETWORK_CODE}/${placement.key}`
                  : undefined
              }
              width={placement.width}
              height={placement.height}
            />
          ) : (
            <span className="mt-2 max-w-[22rem] text-caption leading-relaxed text-ink-soft sm:mt-0">
              {locale === 'en'
                ? 'Network inventory reserved. Publisher credentials are not configured yet.'
                : 'नेटवर्क स्थान सुरक्षित छ। प्रकाशक प्रमाणपत्र अहिले कन्फिगर छैन।'}
              <span className="mt-1 block text-mute">{description}</span>
            </span>
          )
        ) : resolvedVariant === 'mobile' ? (
          <Link
            href={mediaKitHref}
            className="mt-1 text-caption font-semibold text-brand-strong"
            lang={lang}
          >
            {locale === 'en' ? 'Advertise here' : 'यहाँ विज्ञापन'}
          </Link>
        ) : (
          <div className={resolvedVariant === 'native' ? 'max-w-[24rem]' : ''}>
            <span className="mt-2 block max-w-[22rem] text-caption leading-relaxed text-ink-soft">
              {description}
            </span>
            <Link
              href={mediaKitHref}
              className="mt-3 inline-flex min-h-9 items-center rounded-full border border-rule bg-surface px-3 text-caption font-bold text-ink transition-colors hover:border-brand hover:bg-brand-tint hover:text-brand-strong"
              lang={lang}
            >
              {locale === 'en' ? 'View media kit' : 'मिडिया किट हेर्नुहोस्'}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}

export function AdStack({ locale, className = '' }: { locale: Locale; className?: string }) {
  const lang = locale === 'en' ? 'en' : 'ne'
  return (
    <aside
      className={`grid gap-4 ${className}`}
      aria-label={locale === 'en' ? 'Advertisement rail' : 'विज्ञापन रेल'}
      lang={lang}
    >
      <AdSlot locale={locale} placementKey="sidebar-rectangle" variant="rail" />
      <div className="rounded-lg border border-rule bg-surface-raised p-4">
        <p
          className="text-caption font-bold uppercase tracking-[0.16em] text-brand-strong"
          lang="en"
        >
          Media kit
        </p>
        <h2 className="mt-1 font-display text-h3 text-ink">
          {locale === 'en'
            ? 'Commercial space is clearly labelled'
            : 'व्यावसायिक स्थान स्पष्ट लेबल हुन्छ'}
        </h2>
        <p className="mt-2 text-meta leading-relaxed text-ink-soft">
          {locale === 'en'
            ? 'Each placement has a stable key, reserved size, surface and reader-facing label before campaign delivery is connected.'
            : 'हरेक स्थानमा स्थिर key, सुरक्षित आकार, surface र पाठकले देख्ने label छ।'}
        </p>
      </div>
      <AdSlot
        locale={locale}
        placementKey="sidebar-tower"
        variant="rail"
        className="hidden xl:flex"
      />
    </aside>
  )
}

function resolveVariant(size: AdSize): AdVariant {
  if (size === 'billboard') return 'billboard'
  if (size === 'skyscraper' || size === 'rectangle') return 'rail'
  if (size === 'native') return 'native'
  if (size === 'mobile') return 'mobile'
  return 'standard'
}

function slotClass(variant: AdVariant) {
  const base =
    'ad-slot group relative isolate mx-auto overflow-hidden border border-dashed border-rule bg-surface-raised text-center'
  switch (variant) {
    case 'billboard':
      return `${base} flex flex-col items-center justify-center rounded-xl p-5`
    case 'rail':
      return `${base} flex flex-col items-center justify-center rounded-lg p-4`
    case 'inline':
      return `${base} flex flex-col items-center justify-center rounded-lg p-4`
    case 'native':
      return `${base} rounded-xl p-4`
    case 'mobile':
      return `${base} flex flex-col items-center justify-center rounded-full px-3 py-2`
    case 'standard':
    default:
      return `${base} flex flex-col items-center justify-center rounded-lg p-4`
  }
}
