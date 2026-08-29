export type AdMode = 'off' | 'house' | 'network'
export type AdSize = 'leaderboard' | 'billboard' | 'rectangle' | 'skyscraper' | 'mobile' | 'native'
export type AdSurface =
  | 'home'
  | 'article'
  | 'category'
  | 'latest'
  | 'trending'
  | 'hub'
  | 'sidebar'
  | 'inline'
  | 'native'
  | 'mobile'
  | 'billboard'

export type AdPlacement = {
  key: string
  surface: AdSurface
  size: AdSize
  width: number
  height: number
  label: string
  descriptionNe: string
  descriptionEn: string
  position: string
}

export const AD_PLACEMENTS = {
  'home-billboard': {
    key: 'home-billboard',
    surface: 'billboard',
    size: 'billboard',
    width: 970,
    height: 250,
    label: 'Homepage billboard',
    descriptionNe: 'मुख्य समाचारपछि देखिने ठूलो 970×250 ब्रान्ड स्थान।',
    descriptionEn: 'Large 970×250 brand placement after the homepage hero.',
    position: 'Home / after lead package',
  },
  'home-mid': {
    key: 'home-mid',
    surface: 'home',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Homepage mid leaderboard',
    descriptionNe: 'मध्य गृहपृष्ठको 728×90 स्थान।',
    descriptionEn: 'Mid-page 728×90 placement on the homepage.',
    position: 'Home / before section rails',
  },
  'article-top-billboard': {
    key: 'article-top-billboard',
    surface: 'article',
    size: 'billboard',
    width: 970,
    height: 250,
    label: 'Article top billboard',
    descriptionNe: 'लेख शीर्षक र मुख्य तस्बिरबीच प्रयोग हुने ठूलो स्थान।',
    descriptionEn: 'Large slot between article header and article media.',
    position: 'Article / after headline block',
  },
  'article-inline-1': {
    key: 'article-inline-1',
    surface: 'inline',
    size: 'rectangle',
    width: 300,
    height: 250,
    label: 'Article inline rectangle',
    descriptionNe: 'लेखको बीचमा स्पष्ट लेबलसहित देखिने 300×250 स्थान।',
    descriptionEn: 'Labelled 300×250 placement inside article body.',
    position: 'Article / after fourth paragraph or body ad block',
  },
  'article-sidebar-top': {
    key: 'article-sidebar-top',
    surface: 'article',
    size: 'rectangle',
    width: 300,
    height: 250,
    label: 'Article sidebar rectangle',
    descriptionNe: 'लेख पढ्दा दायाँतर्फ देखिने 300×250 स्थान।',
    descriptionEn: '300×250 sidebar slot on article pages.',
    position: 'Article / right rail top',
  },
  'article-sidebar-sticky': {
    key: 'article-sidebar-sticky',
    surface: 'article',
    size: 'skyscraper',
    width: 300,
    height: 600,
    label: 'Article sticky sidebar tower',
    descriptionNe: 'डेस्कटप लेख पृष्ठको sticky 300×600 स्थान।',
    descriptionEn: 'Sticky 300×600 desktop rail placement on article pages.',
    position: 'Article / sticky right rail',
  },
  'article-native-related': {
    key: 'article-native-related',
    surface: 'native',
    size: 'native',
    width: 680,
    height: 120,
    label: 'Article native recommendation',
    descriptionNe: 'सम्बन्धित समाचार क्षेत्रमा राखिने clearly-labelled native स्थान।',
    descriptionEn: 'Clearly labelled native placement near related stories.',
    position: 'Article / before related stories',
  },
  'category-top': {
    key: 'category-top',
    surface: 'category',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Category top leaderboard',
    descriptionNe: 'विभाग पृष्ठको शीर्ष 728×90 स्थान।',
    descriptionEn: 'Top 728×90 placement on category pages.',
    position: 'Category / after section header',
  },
  'category-inline': {
    key: 'category-inline',
    surface: 'category',
    size: 'native',
    width: 680,
    height: 120,
    label: 'Category native inline',
    descriptionNe: 'विभाग सूचीभित्र राखिने native स्थान।',
    descriptionEn: 'Native placement inside category story lists.',
    position: 'Category / story stream',
  },
  'latest-inline': {
    key: 'latest-inline',
    surface: 'latest',
    size: 'native',
    width: 680,
    height: 120,
    label: 'Latest stream native',
    descriptionNe: 'ताजा समाचार सूचीमा राखिने native स्थान।',
    descriptionEn: 'Native placement inside the latest-news stream.',
    position: 'Latest / story stream',
  },
  'trending-inline': {
    key: 'trending-inline',
    surface: 'trending',
    size: 'native',
    width: 680,
    height: 120,
    label: 'Trending stream native',
    descriptionNe: 'ट्रेन्डिङ सूचीभित्र राखिने native स्थान।',
    descriptionEn: 'Native placement inside the trending stream.',
    position: 'Trending / story stream',
  },
  'hub-top': {
    key: 'hub-top',
    surface: 'hub',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Public hub leaderboard',
    descriptionNe: 'हब पृष्ठको शीर्ष 728×90 स्थान।',
    descriptionEn: '728×90 placement on public hub pages.',
    position: 'Hub / after header',
  },
  'hub-inline': {
    key: 'hub-inline',
    surface: 'hub',
    size: 'native',
    width: 680,
    height: 120,
    label: 'Hub stream native',
    descriptionNe: 'हब सूचीभित्र राखिने native स्थान।',
    descriptionEn: 'Native placement inside hub story lists.',
    position: 'Hub / story stream',
  },
  'mobile-sticky': {
    key: 'mobile-sticky',
    surface: 'mobile',
    size: 'mobile',
    width: 320,
    height: 50,
    label: 'Mobile sticky banner',
    descriptionNe: 'मोबाइल पाठकका लागि 320×50 स्थान।',
    descriptionEn: '320×50 placement for mobile readers.',
    position: 'Mobile / sticky bottom dock',
  },
} as const satisfies Record<string, AdPlacement>

export type AdPlacementKey = keyof typeof AD_PLACEMENTS

export function getAdMode(): AdMode {
  const value = process.env.NEXT_PUBLIC_ADS_MODE
  if (value === 'off' || value === 'house' || value === 'network') return value
  // Default off until house creatives or a network ID are intentionally configured.
  return 'off'
}

export function getAdNetworkKind(): 'adsense' | 'gam' | '' {
  const value = process.env.NEXT_PUBLIC_AD_NETWORK?.trim().toLowerCase()
  if (value === 'adsense' || value === 'gam') return value
  return ''
}

/** Canonical GAM network code (prefer NEXT_PUBLIC_GAM_NETWORK_CODE). */
export function getGamNetworkCode(): string {
  return (
    process.env.NEXT_PUBLIC_GAM_NETWORK_CODE?.trim() ||
    process.env.NEXT_PUBLIC_AD_NETWORK_CODE?.trim() ||
    ''
  )
}

/**
 * Network mode is ready only when publisher credentials are complete enough to
 * actually fill a unit (AdSense needs client + slot; GAM needs network code).
 */
export function isNetworkAdsReady(): boolean {
  if (getAdMode() !== 'network') return false
  const kind = getAdNetworkKind()
  if (kind === 'adsense') {
    return Boolean(
      process.env.NEXT_PUBLIC_ADSENSE_CLIENT?.trim() &&
      process.env.NEXT_PUBLIC_ADSENSE_SLOT?.trim(),
    )
  }
  if (kind === 'gam') return Boolean(getGamNetworkCode())
  return false
}

export function isAdPlacementKey(value: string): value is AdPlacementKey {
  return value in AD_PLACEMENTS
}

export function adPlacement(key: AdPlacementKey): AdPlacement {
  return AD_PLACEMENTS[key]
}
