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
  'home-top': {
    key: 'home-top',
    surface: 'home',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Homepage top leaderboard',
    descriptionNe: 'गृहपृष्ठको शीर्ष भागमा रहेको मानक 728×90 स्थान।',
    descriptionEn: 'Standard 728×90 placement at the top of the homepage.',
    position: 'Home / before hero',
  },
  'home-billboard': {
    key: 'home-billboard',
    surface: 'billboard',
    size: 'billboard',
    width: 970,
    height: 250,
    label: 'Homepage billboard',
    descriptionNe: 'मुख्य समाचारपछि देखिने ठूलो 970×250 ब्रान्ड स्थान।',
    descriptionEn: 'Large 970×250 brand placement after the homepage hero.',
    position: 'Home / after hero and live board',
  },
  'home-hero-rail': {
    key: 'home-hero-rail',
    surface: 'home',
    size: 'rectangle',
    width: 300,
    height: 250,
    label: 'Homepage hero rail',
    descriptionNe: 'मुख्य समाचारसँगै देखिने 300×250 स्थान।',
    descriptionEn: '300×250 slot beside the main story.',
    position: 'Home / hero sidebar',
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
  'sidebar-rectangle': {
    key: 'sidebar-rectangle',
    surface: 'sidebar',
    size: 'rectangle',
    width: 300,
    height: 250,
    label: 'Sidebar rectangle',
    descriptionNe: 'दायाँ रेलको सामान्य 300×250 स्थान।',
    descriptionEn: 'Reusable 300×250 placement for right rails.',
    position: 'Reusable sidebar / first slot',
  },
  'sidebar-tower': {
    key: 'sidebar-tower',
    surface: 'sidebar',
    size: 'skyscraper',
    width: 300,
    height: 600,
    label: 'Sidebar tower',
    descriptionNe: 'दायाँ रेलको लामो 300×600 स्थान।',
    descriptionEn: 'Reusable 300×600 placement for long right rails.',
    position: 'Reusable sidebar / long slot',
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
  'latest-top': {
    key: 'latest-top',
    surface: 'latest',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Latest page leaderboard',
    descriptionNe: 'ताजा समाचार पृष्ठको शीर्ष 728×90 स्थान।',
    descriptionEn: 'Top 728×90 placement on the latest page.',
    position: 'Latest / after header',
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
  'trending-top': {
    key: 'trending-top',
    surface: 'trending',
    size: 'leaderboard',
    width: 728,
    height: 90,
    label: 'Trending page leaderboard',
    descriptionNe: 'ट्रेन्डिङ पृष्ठको शीर्ष 728×90 स्थान।',
    descriptionEn: 'Top 728×90 placement on the trending page.',
    position: 'Trending / after header',
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
  return 'house'
}

export function isNetworkAdsReady(): boolean {
  return getAdMode() === 'network' && Boolean(process.env.NEXT_PUBLIC_AD_NETWORK?.trim())
}

export function isAdPlacementKey(value: string): value is AdPlacementKey {
  return value in AD_PLACEMENTS
}

export function adPlacement(key: AdPlacementKey): AdPlacement {
  return AD_PLACEMENTS[key]
}
