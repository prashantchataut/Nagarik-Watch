'use client'

import { useMemo } from 'react'
import { Bookmark, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { adToBs, formatBsFull, toDevanagari } from '@/lib/news/patro'
import { go, href } from '@/lib/news/router'
import { stories } from '@/lib/news/data'
import { useSaved } from '@/lib/news/storage'
import { useMarket } from '@/lib/news/market-store'
import { AccountChip } from './AccountSheet'

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="text-[11px] font-semibold uppercase text-ink-faint">{label}</span>
      <span className="font-headline text-[14px] font-semibold text-ink">{value}</span>
    </span>
  )
}

export function NepseFact() {
  const { market } = useMarket()
  const index = market?.nepse.index
  const live = market?.nepse.source === 'live'
  const up = (index?.changePct ?? 0) >= 0
  return (
    <button
      type="button"
      onClick={() => go('/nepse')}
      className="flex items-baseline gap-1.5 whitespace-nowrap rounded-sm px-1.5 py-1 -mx-1.5 hover:bg-crimson-wash transition-colors"
      aria-label="बजार विवरण हेर्नुहोस्"
    >
      <span className="text-[11px] font-semibold uppercase text-ink-faint">नेप्से</span>
      {index ? (
        <>
          <span className="font-headline text-[14px] font-semibold tabular-nums">
            {toDevanagari(index.value.toFixed(2))}
          </span>
          <span
            className={`font-headline text-[13px] font-bold tabular-nums ${
              up ? 'text-market-green' : 'text-crimson'
            }`}
          >
            {up ? '▲' : '▼'} {toDevanagari(Math.abs(index.changePct).toFixed(2))}%
          </span>
          <span className="hidden text-[10.5px] font-semibold text-ink-faint xl:inline">
            [{live ? 'लाइभ' : 'अन्तिम'}]
          </span>
        </>
      ) : (
        <span className="font-headline text-[14px] font-semibold text-ink-faint">…</span>
      )}
    </button>
  )
}

export default function Masthead({
  theme,
  onToggleTheme,
  onOpenSearch,
  onOpenMenu,
  onOpenAccount,
}: {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onOpenSearch: () => void
  onOpenMenu: () => void
  onOpenAccount: () => void
}) {
  const tickerItems = useMemo(
    () =>
      [...stories]
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, 8)
        .map((s) => ({ slug: s.slug, desk: s.desk, title: s.titleNe })),
    [],
  )

  const todayLabel = useMemo(() => {
    const bs = adToBs(new Date())
    return formatBsFull(bs)
  }, [])

  const weekdayNe = useMemo(() => {
    const days = ['आइतबार', 'सोमबार', 'मङ्गलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार']
    return days[new Date().getDay()]
  }, [])

  const { saved } = useSaved()

  return (
    <header className="bg-paper border-b border-rule no-print">
      {/* Top strip: date facts + ticker (desktop) */}
      <div className="hidden md:block border-b border-rule">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-6 px-4 py-1.5">
          <div className="flex items-center gap-5 overflow-hidden">
            <Fact label="आज" value={`${weekdayNe}, ${todayLabel}`} />
            <Fact label="काठमाडौं" value={`${toDevanagari('24')}° मनसुन`} />
            <NepseFact />
          </div>
          <div className="flex-1 overflow-hidden text-right" aria-hidden="true">
            <div className="ticker-track gap-8 text-[12.5px] text-ink-soft">
              {[...tickerItems, ...tickerItems].map((t, i) => (
                <a
                  key={`${t.slug}-${i}`}
                  href={href(`/${t.desk}/${t.slug}`)}
                  className="whitespace-nowrap hover:text-crimson transition-colors"
                >
                  <span className="text-crimson font-semibold">●</span> {t.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main masthead row */}
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-3 px-4 py-3 md:py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            className="grid size-11 place-items-center rounded-sm text-ink hover:bg-crimson-wash transition-colors md:hidden"
            aria-label="विषय खोल्नुहोस्"
          >
            <Menu className="size-6" />
          </button>
          <a
            href={href('/')}
            className="group flex flex-col leading-none"
            aria-label="नागरिक वाच गृहपृष्ठ"
          >
            <span className="font-headline text-[11px] font-bold uppercase text-crimson">
              Nagarik Watch
            </span>
            <span className="font-headline text-[30px] font-extrabold text-ink md:text-[40px]">
              नागरिक वाच
            </span>
          </a>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3">
          <div className="hidden md:block">
            <Fact label="आज" value={`${weekdayNe}, ${todayLabel}`} />
          </div>
          <AccountChip onOpen={onOpenAccount} />
          <button
            type="button"
            onClick={onOpenSearch}
            className="grid size-11 place-items-center rounded-sm text-ink hover:bg-crimson-wash transition-colors"
            aria-label="खोज्नुहोस्"
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            onClick={onToggleTheme}
            className="grid size-11 place-items-center rounded-sm text-ink hover:bg-crimson-wash transition-colors"
            aria-label={theme === 'light' ? 'डार्क मोड' : 'लाइट मोड'}
          >
            {theme === 'light' ? <Moon className="size-5" /> : <Sun className="size-5" />}
          </button>
          <a
            href={href('/saved')}
            className="relative hidden size-11 place-items-center rounded-sm text-ink hover:bg-crimson-wash transition-colors sm:grid"
            aria-label="सेभ गरिएका समाचार"
          >
            <Bookmark className="size-5" />
            {saved.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-crimson px-1 font-headline text-[11px] font-bold text-white">
                {toDevanagari(saved.length)}
              </span>
            )}
          </a>
          <a
            href={href('/patro')}
            className="ml-1 rounded-sm bg-crimson px-3.5 py-2.5 font-headline text-[15px] font-bold text-white shadow-sm transition-transform hover:-translate-y-px active:translate-y-0"
          >
            पात्रो
          </a>
        </div>
      </div>
    </header>
  )
}

export function MobileTopFacts() {
  const today = useMemo(() => formatBsFull(adToBs(new Date())), [])
  return (
    <div className="flex items-center justify-between border-b border-rule px-4 py-1 text-[12px] text-ink-soft md:hidden">
      <span className="font-medium">{today}</span>
      <NepseFact />
    </div>
  )
}

export function MenuSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { saved } = useSaved()
  if (!open) return null
  const linkClass =
    'flex items-center justify-between rounded-sm px-3 py-3 font-headline text-[17px] font-semibold text-ink hover:bg-crimson-wash transition-colors'
  return (
    <div
      className="fixed inset-0 z-50 no-print"
      role="dialog"
      aria-modal="true"
      aria-label="विषय सूची"
    >
      <button
        type="button"
        aria-label="बन्द गर्नुहोस्"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-paper shadow-2xl">
        <div className="flex items-center justify-between border-b border-rule px-4 py-3">
          <span className="kicker">विषय र सेवा</span>
          <button
            type="button"
            onClick={onClose}
            className="grid size-10 place-items-center rounded-sm text-ink hover:bg-crimson-wash"
            aria-label="बन्द गर्नुहोस्"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="p-3">
          <a href={href('/')} className={linkClass} onClick={onClose}>
            गृहपृष्ठ <span className="text-ink-faint">→</span>
          </a>
          <a href={href('/en')} className={linkClass} onClick={onClose}>
            English Edition <span className="text-ink-faint">→</span>
          </a>
          {[
            ['politics', 'राजनीति'],
            ['society', 'समाज'],
            ['business', 'बजार'],
            ['sports', 'खेलकुद'],
            ['entertainment', 'मनोरञ्जन'],
            ['world', 'विश्व'],
            ['opinion', 'विचार'],
            ['literature', 'साहित्य'],
            ['technology', 'प्रविधि'],
            ['health', 'स्वास्थ्य'],
            ['education', 'शिक्षा'],
            ['interview', 'अन्तर्वार्ता'],
            ['photo-story', 'फोटो फिचर'],
            ['video', 'भिडियो'],
            ['diaspora', 'प्रवास'],
          ].map(([slug, label]) => (
            <a key={slug} href={href(`/${slug}`)} className={linkClass} onClick={onClose}>
              {label} <span className="text-ink-faint">→</span>
            </a>
          ))}
          <div className="my-2 border-t border-rule" />
          <a href={href('/province')} className={linkClass} onClick={onClose}>
            सात प्रदेश <span className="text-ink-faint">→</span>
          </a>
          <a href={href('/scores')} className={linkClass} onClick={onClose}>
            लाइभ स्कोर <span className="text-ink-faint">→</span>
          </a>
          <a href={href('/rashifal')} className={linkClass} onClick={onClose}>
            राशिफल <span className="text-ink-faint">→</span>
          </a>
          <a href={href('/tools')} className={linkClass} onClick={onClose}>
            उपकरणहरू (प्रिती, मिति) <span className="text-ink-faint">→</span>
          </a>
          <a href={href('/saved')} className={linkClass} onClick={onClose}>
            सेभ गरिएका{' '}
            <span className="text-crimson font-headline text-[13px] font-bold">
              {toDevanagari(saved.length)} वटा
            </span>
          </a>
          <a href={href('/journalist')} className={linkClass} onClick={onClose}>
            <span className="text-crimson">पत्रकार लगइन</span>{' '}
            <span className="text-ink-faint">→</span>
          </a>
        </nav>
      </div>
    </div>
  )
}
