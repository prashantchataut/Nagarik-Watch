'use client'

import { useMemo, useState } from 'react'
import { dateSeed, horoscopeFor, rashis } from '@/lib/news/rashifal'
import { adToBs, formatBsFull } from '@/lib/news/patro'
import { PageHead, container } from './PatroView'

export default function RashifalView() {
  const today = useMemo(() => adToBs(new Date()), [])
  const seed = useMemo(() => dateSeed(new Date()), [])
  const [open, setOpen] = useState<string | null>(null)

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="राशिफल"
          title="आजको राशिफल"
          sub={`आज ${formatBsFull(today)} — बाह्र राशिका दैनिक भविष्यवाणी। आफ्नो राशि थिचेर विस्तृत हेर्नुहोस्।`}
        />

        <div className="grid gap-4 py-7 sm:grid-cols-2 md:grid-cols-3 md:py-9 lg:grid-cols-4">
          {rashis.map((r) => {
            const h = horoscopeFor(r.slug, seed)
            const isOpen = open === r.slug
            return (
              <article key={r.slug} className="paper-card rounded-sm p-4">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : r.slug)}
                  className="flex w-full items-center justify-between gap-2 text-left"
                  aria-expanded={isOpen}
                >
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-full bg-crimson-wash font-headline text-[22px] font-extrabold text-crimson">
                      {r.symbol}
                    </span>
                    <span>
                      <span className="block font-headline text-[19px] font-extrabold text-ink">
                        {r.nameNe}
                      </span>
                      <span className="block text-[12px] text-ink-faint">{r.nameEn}</span>
                    </span>
                  </span>
                  <span className="text-[12px] text-ink-faint">{isOpen ? '−' : '+'}</span>
                </button>
                <div className="mt-3 space-y-2.5">
                  <p className="text-[14.5px] leading-relaxed text-ink">{h.opening}</p>
                  {isOpen && (
                    <>
                      <div className="border-t border-rule pt-2.5">
                        <p className="text-[11px] uppercase text-crimson">करियर</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{h.career}</p>
                      </div>
                      <div className="border-t border-rule pt-2.5">
                        <p className="text-[11px] uppercase text-crimson">सम्बन्ध</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{h.relations}</p>
                      </div>
                      <div className="border-t border-rule pt-2.5">
                        <p className="text-[11px] uppercase text-crimson">स्वास्थ्य</p>
                        <p className="mt-0.5 text-[14px] leading-relaxed text-ink-soft">{h.health}</p>
                      </div>
                      <p className="flex gap-4 border-t border-rule pt-2.5 text-[13px]">
                        <span className="text-ink-soft">
                          भाग्यशाली अंक: <b className="text-crimson">{r.luckyNumber}</b>
                        </span>
                        <span className="text-ink-soft">
                          रंग: <b className="text-crimson">{r.luckyColorNe}</b>
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <p className="pb-8 text-[12px] leading-relaxed text-ink-faint">
          राशिफल मनोरञ्जन र सामान्य चेतनाका लागि मात्र हो — यसलाई ज्योतिषीय परामर्श नठान्नुहोस्।
          पाठकहरूले ठूला निर्णय आफ्नै विवेक र विज्ञसँगको परामर्शमा गर्नुहुन अनुरोध छ।
        </p>
      </div>
    </main>
  )
}
