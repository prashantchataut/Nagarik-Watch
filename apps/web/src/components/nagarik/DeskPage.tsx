'use client'

import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { desks, type Story } from '@/lib/news/data'
import { byDesk, deskRole, storyUrl } from '@/lib/news/utils'
import { href } from '@/lib/news/router'
import { toDevanagari } from '@/lib/news/patro'
import { useMarket } from '@/lib/news/market-store'
import {
  HeroImage,
  Kicker,
  MetaLine,
  PhotoCard,
  RowCard,
  SectionHeader,
  VoiceCard,
} from './cards'

const container = 'mx-auto w-full max-w-[1180px] px-4'

function DeskIntro({ desk }: { desk: string }) {
  const info = desks.find((d) => d.slug === desk)
  if (!info) return null
  return (
    <div className={`${container} pt-7 md:pt-9`}>
      <p className="kicker">डेस्क</p>
      <h1 className="mt-1.5 font-headline text-[clamp(32px,4.8vw,48px)] font-extrabold text-ink">
        {info.nameNe}
      </h1>
      <p className="mt-2 max-w-[64ch] text-[15.5px] leading-relaxed text-ink-soft">
        {info.descriptionNe}
      </p>
      <div className="mt-4 border-b-2 border-ink" />
    </div>
  )
}

/** Live market strip for the बजार desk — real data from /api/market/summary. */
function MarketStrip() {
  const { market, loading } = useMarket()
  const nepse = market?.nepse
  const usd = market?.forex.rates.find((r) => r.iso3 === 'USD')
  const gold = market?.metals
  const petrol = market?.fuel.items.find((f) => f.nameNe === 'पेट्रोल')
  const up = (nepse?.index.changePct ?? 0) >= 0

  const chips: { label: string; value: string; sub?: string; tone?: 'up' | 'down' }[] = []
  if (nepse) {
    chips.push({
      label: 'नेप्से',
      value: toDevanagari(nepse.index.value.toFixed(2)),
      sub: `${up ? '▲' : '▼'} ${toDevanagari(Math.abs(nepse.index.changePct).toFixed(2))}%`,
      tone: up ? 'up' : 'down',
    })
  }
  if (usd) {
    chips.push({
      label: 'डलर (किन्न)',
      value: toDevanagari(usd.buy.toFixed(2)),
      sub: `बेच्न ${toDevanagari(usd.sell.toFixed(2))}`,
    })
  }
  if (gold) {
    chips.push({
      label: 'सुन (तोला)',
      value: `रु ${toDevanagari(gold.goldTola.toLocaleString('en-IN'))}`,
      sub: `चाँदी रु ${toDevanagari(gold.silverTola.toLocaleString('en-IN'))}`,
    })
  }
  if (petrol) {
    chips.push({
      label: 'पेट्रोल',
      value: `रु ${toDevanagari(petrol.price.toFixed(2))}`,
      sub: 'प्रति लिटर',
    })
  }

  return (
    <section className={`${container} pt-6`} aria-label="आजको बजार">
      <div className="paper-card rounded-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-headline text-[15px] font-extrabold text-ink">आजको बजार</p>
          <a
            href={href('/nepse')}
            className="flex items-center gap-1.5 font-headline text-[13px] font-bold text-crimson hover:underline"
          >
            पूरै बजार ड्यासबोर्ड <ArrowRight className="size-3.5" />
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {chips.length > 0
            ? chips.map((c) => (
                <div key={c.label} className="rounded-sm border border-rule px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase text-ink-faint">{c.label}</p>
                  <p className="mt-0.5 font-headline text-[19px] font-extrabold tabular-nums leading-tight text-ink">
                    {c.value}
                  </p>
                  {c.sub && (
                    <p
                      className={`text-[11.5px] font-semibold ${
                        c.tone === 'up'
                          ? 'text-market-green'
                          : c.tone === 'down'
                            ? 'text-crimson'
                            : 'text-ink-faint'
                      }`}
                    >
                      {c.sub}
                    </p>
                  )}
                </div>
              ))
            : Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[74px] animate-pulse rounded-sm bg-surface-soft" />
              ))}
        </div>
        <p className="mt-2.5 text-[11.5px] text-ink-faint">
          {loading && !market
            ? 'राष्ट्र बैंक र अन्तर्राष्ट्रिय बजारबाट तथ्यांक लोड हुँदै…'
            : 'स्रोत: नेपाल राष्ट्र बैंक · अन्तर्राष्ट्रिय धातु बजार · नेपाल आयल निगम — स्वचालित अद्यावधिक'}
        </p>
      </div>
    </section>
  )
}

/** Featured essay block for the विचार desk. */
function EssayLead({ story }: { story: Story }) {
  const quote = useMemo(() => {
    const q = story.bodyNe.find((b) => b.k === 'quote')
    return q && q.k === 'quote' ? q.text : story.deckNe
  }, [story])

  return (
    <article className="group border-b border-rule pb-8">
      <div className="grid gap-x-8 gap-y-4 md:grid-cols-[1.5fr_1fr]">
        <div>
          <Kicker desk={story.desk} />
          <a href={storyUrl(story)} className="group/link block">
            <h2 className="headline-lead mt-2 text-ink transition-colors group-hover/link:text-crimson">
              {story.titleNe}
            </h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ink-soft">{story.deckNe}</p>
          </a>
          <MetaLine story={story} showTime={false} />
        </div>
        <figure className="relative flex flex-col justify-center border-l-[3px] border-crimson bg-surface-soft px-6 py-7">
          <span
            aria-hidden="true"
            className="absolute -top-2 left-4 font-headline text-[64px] font-extrabold leading-none text-crimson/20"
          >
            “
          </span>
          <blockquote className="font-headline text-[18px] font-semibold italic leading-relaxed text-ink">
            {quote}
          </blockquote>
          <figcaption className="mt-3 text-[12.5px] font-semibold text-ink-faint">
            — {story.author}
          </figcaption>
        </figure>
      </div>
    </article>
  )
}

export function DeskNotFound() {
  return (
    <main id="main" className="mx-auto max-w-[680px] px-4 py-20 text-center">
      <p className="kicker">डेस्क भेटिएन</p>
      <h1 className="mt-2 font-headline text-[32px] font-extrabold text-ink">
        यस्तो डेस्क हामीसँग छैन
      </h1>
      <p className="mt-3 text-[15.5px] text-ink-soft">
        माथिको क्रिमसन पट्टीबाट डेस्क छान्नुहोस् वा{' '}
        <a href={href('/')} className="font-semibold text-crimson hover:underline">
          गृहपृष्ठमा जानुहोस्
        </a>
        ।
      </p>
    </main>
  )
}

export default function DeskPage({ desk }: { desk: string }) {
  const items = useMemo(() => byDesk(desk), [desk])
  const info = desks.find((d) => d.slug === desk)
  const role = deskRole(desk)

  if (!info || items.length === 0) return <DeskNotFound />

  const lead = items[0]!
  const rest = items.slice(1)

  return (
    <main id="main">
      <DeskIntro desk={desk} />
      {desk === 'business' && <MarketStrip />}

      {/* Opinion desk: essay-first layout with pull-quote lead */}
      {desk === 'opinion' ? (
        <section className={`${container} py-7 md:py-9`}>
          <EssayLead story={lead} />
          <SectionHeader title="थप स्तम्भ र विश्लेषण" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((s) => (
              <VoiceCard key={s.slug} story={s} />
            ))}
          </div>
          <div className="paper-card mt-8 rounded-sm p-5">
            <p className="font-headline text-[16px] font-extrabold text-ink">
              विचार लेख्न चाहनुहुन्छ?
            </p>
            <p className="mt-1.5 max-w-[70ch] text-[14px] leading-relaxed text-ink-soft">
              नागरिक वाचमा नागरिक सरोकारका विषयमा तर्कसंगत र तथ्यमा आधारित विचार प्रकाशित गर्छ।
              आफ्नो लेख पठाउन पत्रकार खाता खोलेर सम्पादकीय डेस्कमा पिच गर्न सक्नुहुन्छ।
            </p>
            <a
              href={href('/journalist')}
              className="mt-3 inline-flex items-center gap-2 rounded-sm bg-crimson px-4 py-2.5 font-headline text-[14px] font-bold text-white transition-colors hover:bg-crimson-deep"
            >
              पत्रकार लगइन <ArrowRight className="size-4" />
            </a>
          </div>
        </section>
      ) : role === 'voices' ? (
        <section className={`${container} py-7 md:py-9`}>
          <div className="grid gap-5 sm:grid-cols-2">
            {items.map((s) => (
              <VoiceCard key={s.slug} story={s} />
            ))}
          </div>
        </section>
      ) : (
        <section className={`${container} py-7 md:py-9`}>
          <div className="grid gap-x-6 gap-y-7 md:grid-cols-[1.35fr_1fr]">
            {/* Lead story of the desk */}
            <article className="group">
              <a href={storyUrl(lead)} className="block">
                <HeroImage
                  story={lead}
                  priority
                  ratio={role === 'photo' ? 'aspect-[3/2]' : 'aspect-[16/9]'}
                  rounded="rounded-sm"
                  sizes="(max-width: 768px) 100vw, 60vw"
                />
                <div className="pt-3">
                  <h2 className="headline-support text-ink group-hover:text-crimson transition-colors">
                    {lead.titleNe}
                  </h2>
                  <p className="mt-2 line-clamp-3 text-[15.5px] leading-relaxed text-ink-soft">
                    {lead.deckNe}
                  </p>
                  <MetaLine story={lead} />
                </div>
              </a>
            </article>

            {/* Rest of the desk */}
            <div className="space-y-5">
              {rest.slice(0, 4).map((s) => (
                <RowCard key={s.slug} story={s} />
              ))}
            </div>
          </div>

          {role === 'photo' && rest.length > 4 && (
            <div className="mt-8">
              <SectionHeader title="थप तस्वीरहरू" />
              <div className="grid gap-x-5 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
                {rest.slice(4, 7).map((s) => (
                  <PhotoCard key={s.slug} story={s} />
                ))}
              </div>
            </div>
          )}

          {role !== 'photo' && rest.length > 4 && (
            <div className="mt-8 grid gap-x-8 md:grid-cols-2">
              {rest.slice(4).map((s) => (
                <div key={s.slug} className="mb-5">
                  <RowCard story={s} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Desk interlinks */}
      <section className="border-t border-rule bg-surface-soft py-6 no-print">
        <div className={container}>
          <p className="mb-3 text-[11px] font-semibold uppercase text-ink-faint">अन्य डेस्कहरू</p>
          <div className="flex flex-wrap gap-2">
            {desks
              .filter((d) => d.slug !== desk)
              .map((d) => (
                <a
                  key={d.slug}
                  href={href(`/${d.slug}`)}
                  className="rounded-full border border-rule bg-surface px-3.5 py-1.5 font-headline text-[14px] font-semibold text-ink-soft transition-colors hover:border-crimson hover:text-crimson"
                >
                  {d.nameNe}
                </a>
              ))}
          </div>
        </div>
      </section>
    </main>
  )
}

/** Shared mini desk strip used by province pages. */
export function DeskStrip({ items }: { items: Story[] }) {
  if (items.length === 0) return null
  return (
    <div className="grid gap-x-6 md:grid-cols-2">
      {items.map((s) => (
        <div key={s.slug} className="mb-5">
          <RowCard story={s} />
        </div>
      ))}
    </div>
  )
}

export function deskStoryCount(desk: string): string {
  return toDevanagari(byDesk(desk).length)
}
