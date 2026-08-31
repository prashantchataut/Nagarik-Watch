'use client'

/**
 * Monetization UI — labeled ad slots, cookie consent, paywall gate,
 * view counters and the premium badge. Per DESIGN.md: ads are always
 * labeled "विज्ञापन", never mimic editorial cards; consent is honest.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { BadgeCheck, Cookie, Eye, Crown, X } from 'lucide-react'
import { useAd, trackImpression, trackClick, formatDevanagariCount, type AdPlacement, type AdCampaign } from '@/lib/news/ad-store'
import { useConsent } from '@/lib/news/consent'
import { usePaywall, recordMeteredView } from '@/lib/news/paywall-store'
import { href, go } from '@/lib/news/router'
import { useSaved } from '@/lib/news/storage'

/* ------------------------------ Ad slots -------------------------------- */

const HOUSE_ADS: Record<AdPlacement, { title: string; body: string; cta: string; link: string }> = {
  leaderboard: {
    title: 'नागरिक वाचमा विज्ञापन दिनुहोस्',
    body: 'नेपालको डेवनागरी-प्रथम समाचार प्लेटफर्ममा तपाईंको ब्रान्ड हरेक दिन हजारौं पाठकसम्म पुग्छ।',
    cta: 'विज्ञापन जानकारी',
    link: '/advertise',
  },
  infeed: {
    title: 'साँझ ब्रिफिङ — दिनका ५ मुख्य समाचार',
    body: 'हरेक साँझ इमेलमा दिनको सार, सन्तुलित र संक्षिप्त। निःशुल्क।',
    cta: 'सदस्यता लिनुहोस्',
    link: '#footer-newsletter',
  },
  sidebar: {
    title: 'नागरिक वाच संरक्षक बन्नुहोस्',
    body: 'विज्ञापनमा भर पर्नुको सट्टा, पाठकको सीधा सहयोगले स्वतन्त्र पत्रकारिता बाँच्छ।',
    cta: 'सदस्यता/सहयोग',
    link: '/subscribe',
  },
  article_inline: {
    title: 'कुनै पनि समाचार सेभ गर्नुहोस्',
    body: 'खाता खोले सबै यन्त्रमा सेभ सिन्क हुन्छ; टिप्पणी लेख्न पाउनुहुन्छ।',
    cta: 'निःशुल्क खाता',
    link: '#account',
  },
}

export function AdSlot({ placement, className = '' }: { placement: AdPlacement; className?: string }) {
  const ad = useAd(placement)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ad) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            trackImpression(ad.id)
            observer.disconnect()
          }
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [ad])

  return (
    <div ref={ref} className={className}>
      <p className="mb-1 text-center font-headline text-[10.5px] font-bold uppercase text-ink-faint">
        विज्ञापन
      </p>
      {ad ? <PaidAd ad={ad} /> : <HouseAd placement={placement} />}
    </div>
  )
}

function PaidAd({ ad }: { ad: AdCampaign }) {
  return (
    <a
      href={ad.link ?? '#'}
      target={ad.link?.startsWith('http') ? '_blank' : undefined}
      rel="noopener sponsored"
      onClick={() => trackClick(ad.id)}
      className="block rounded-md border border-rule bg-surface-soft p-4 transition-colors hover:border-crimson/50"
    >
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
        {ad.image ? (
          <img
            src={ad.image}
            alt={ad.title}
            className="h-16 w-full rounded object-cover sm:h-20 sm:w-40"
            loading="lazy"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded bg-crimson/10 font-headline text-[26px] font-black text-crimson">
            ना
          </div>
        )}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <p className="font-headline text-[17px] font-bold leading-snug text-ink">{ad.title}</p>
          {ad.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{ad.body}</p>}
          {ad.ctaLabel && (
            <p className="mt-2 inline-block rounded-sm bg-crimson px-3 py-1 font-headline text-[13px] font-bold text-white">
              {ad.ctaLabel}
            </p>
          )}
        </div>
      </div>
    </a>
  )
}

function HouseAd({ placement }: { placement: AdPlacement }) {
  const house = HOUSE_ADS[placement]
  const ink = placement === 'sidebar' || placement === 'article_inline'
  return (
    <a
      href={href(house.link)}
      className="block rounded-md border border-dashed border-rule-strong bg-surface-soft p-4 transition-colors hover:border-crimson/60"
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded font-headline text-[20px] font-black ${
            ink ? 'bg-ink text-paper' : 'bg-crimson text-white'
          }`}
        >
          ना
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-headline text-[16px] font-bold leading-snug text-ink">{house.title}</p>
          <p className="mt-0.5 hidden text-[12.5px] leading-relaxed text-ink-soft sm:block">{house.body}</p>
          <p className="mt-1.5 font-headline text-[13px] font-bold text-crimson">{house.cta} →</p>
        </div>
      </div>
    </a>
  )
}

/* --------------------------- Cookie consent ------------------------------ */

export function CookieConsent() {
  const { choice, decided, set } = useConsent()
  const [dismissed, setDismissed] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
  const open = !decided && !dismissed

  if (!open) return null
  void choice

  return (
    <div
      role="dialog"
      aria-label="कुकी सहमति"
      className="fixed inset-x-0 bottom-0 z-[70] border-t-2 border-crimson bg-paper shadow-[0_-8px_30px_rgba(0,0,0,0.15)]"
    >
      <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-6">
        <Cookie className="mx-auto size-8 shrink-0 text-crimson sm:mx-0" strokeWidth={1.75} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-headline text-[16px] font-bold text-ink">कुकी र पाठक-तथ्याङ्क</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">
            आवश्यक कुकीले साइट चलाउँछन्। थप सहमति दिए विश्लेषण (कुन समाचार पढियो) र विज्ञापन नाप्ने
            कुकी पनि राखिन्छन्। छनोट जहिले पनि बदल्न सकिन्छ।{' '}
            <a href={href('/cookies')} className="text-crimson underline">
              कुकी नीति
            </a>
          </p>
          {showPrefs && (
            <div className="mt-2 space-y-1.5 text-[12.5px] text-ink-soft">
              <p>
                <span className="font-bold text-ink">आवश्यक</span> — सेसन, सुरक्षा, भाषा/थिम (सधैं सक्रिय)
              </p>
              <p>
                <span className="font-bold text-ink">विश्लेषण + विज्ञापन नापाइ</span> — पृष्ठ-दृश्य, ट्रेन्डिङ,
                सिफारिस सुधार, विज्ञापन गणना
              </p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => setShowPrefs((v) => !v)}
            className="rounded-sm border border-rule px-4 py-2 font-headline text-[14px] font-bold text-ink-soft hover:border-rule-strong"
          >
            विवरण
          </button>
          <button
            type="button"
            onClick={() => {
              set('necessary')
              setDismissed(true)
            }}
            className="rounded-sm border border-rule-strong px-4 py-2 font-headline text-[14px] font-bold text-ink hover:bg-surface-soft"
          >
            आवश्यक मात्र
          </button>
          <button
            type="button"
            onClick={() => {
              set('all')
              setDismissed(true)
            }}
            className="rounded-sm bg-crimson px-4 py-2 font-headline text-[14px] font-bold text-white hover:bg-crimson-deep"
          >
            सबै स्वीकार
          </button>
        </div>
        <button
          type="button"
          aria-label="बन्द गर्नुहोस्"
          onClick={() => setDismissed(true)}
          className="absolute right-2 top-2 rounded p-1 text-ink-faint hover:text-ink"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

/** Small button for footer/profile to reopen consent choices. */
export function ConsentSettingsButton({ className = '' }: { className?: string }) {
  const { set } = useConsent()
  return (
    <button
      type="button"
      onClick={() => {
        set('necessary')
      }}
      onDoubleClick={() => set('all')}
      title="कुकी छनोट: आवश्यक मात्र राख्न क्लिक गर्नुहोस्; सबै स्वीकार्न डबल-क्लिक"
      className={className}
    >
      कुकी छनोट बदल्नुहोस्
    </button>
  )
}

/* ------------------------------ View count ------------------------------- */

export function ViewCount({ count, className = '' }: { count: number; className?: string }) {
  if (!count) return null
  return (
    <span className={`inline-flex items-center gap-1 text-ink-faint ${className}`} title="कति पटक पढियो">
      <Eye className="size-3.5" aria-hidden />
      {formatDevanagariCount(count)} पटक पढिएको
    </span>
  )
}

/* ------------------------------ Premium mark ----------------------------- */

export function PremiumBadge({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm bg-ink px-1.5 py-0.5 font-headline text-[10.5px] font-bold uppercase text-paper">
        <Crown className="size-3" aria-hidden /> प्रिमियम
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-ink/30 bg-ink/5 px-2 py-1 font-headline text-[11.5px] font-bold uppercase text-ink">
      <Crown className="size-3.5" aria-hidden /> प्रिमियम कथा
    </span>
  )
}

/* ------------------------------- Paywall --------------------------------- */

/**
 * Metered paywall hook — records one metered open and reports whether this
 * story should be gated for the current reader/visitor.
 * Enforcement data always comes from the server (/api/paywall).
 */
export function usePaywallGate(storyKey: string, premium: boolean): { blocked: boolean; ready: boolean } {
  const paywall = usePaywall()
  const hasRecorded = useRef(false)

  useEffect(() => {
    if (hasRecorded.current) return
    hasRecorded.current = true
    recordMeteredView(storyKey)
    paywall.refresh()
  }, [storyKey])

  const blocked = premium
    ? !paywall.subscribed
    : !paywall.subscribed && paywall.used > paywall.freeLimit

  return { blocked, ready: paywall.ready }
}

/** The wall itself — rendered after the teaser portion of the body. */
export function PaywallWall({ premium, remaining }: { premium: boolean; remaining: number }) {
  return (
    <div
      className="relative my-8 rounded-lg border-2 border-crimson bg-surface-soft p-6 sm:p-8"
      role="region"
      aria-label="सदस्यता आग्रह"
    >
      <PremiumBadge />
      <h3 className="mt-3 font-headline text-[24px] font-extrabold leading-tight text-ink sm:text-[28px]">
        {premium ? 'यो प्रिमियम कथा पूरा पढ्न सदस्य बन्नुहोस्' : 'निःशुल्क सीमा सकियो — पढिरहन सदस्य बन्नुहोस्'}
      </h3>
      <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
        {premium
          ? 'गहन रिपोर्टिङ र विश्लेषण प्रिमियम छन् — तर मुख्य समाचार, विपद् जानकारी र तथ्य जाँच सधैं निःशुल्क रहन्छन्।'
          : `यस महिनाको निःशुल्क कथा सीमा पुग्यो (बाँकी ${formatDevanagariCount(Math.max(0, remaining))})। मासिक रु. ३०० देखि सुरु।`}
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => go('/subscribe')}
          className="rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white hover:bg-crimson-deep"
        >
          सदस्यता लिनुहोस्
        </button>
        <a
          href={href('#account')}
          className="rounded-sm border border-rule-strong px-5 py-2.5 font-headline text-[15px] font-bold text-ink hover:bg-surface-soft"
        >
          लगइन / निःशुल्क खाता
        </a>
      </div>
      <p className="mt-4 text-[12px] text-ink-faint">
        भुक्तानी हाल डेमो मोडमा छ (eSewa/Khaltि जडानका लागि तयार)।
      </p>
    </div>
  )
}
