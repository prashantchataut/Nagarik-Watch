'use client'

import { useMemo } from 'react'
import { desks, provinces, type Story } from '@/lib/news/data'
import { byDesk, latest, leadStory, storyUrl, supportPair } from '@/lib/news/utils'
import { href } from '@/lib/news/router'
import { nepseSnapshot } from '@/lib/news/nepse'
import { adToBs, formatBsFull } from '@/lib/news/patro'
import { HeroImage, SectionHeader } from './cards'
import { useSaved } from '@/lib/news/storage'

const container = 'mx-auto w-full max-w-[1180px] px-4'

function EnKicker({ desk }: { desk: string }) {
  const info = desks.find((d) => d.slug === desk)
  return (
    <a href={href(`/${desk}`)} className="kicker hover:underline underline-offset-4">
      {info?.nameEn ?? desk}
    </a>
  )
}

function EnMeta({ story }: { story: Story }) {
  const date = new Date(story.publishedAt)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return (
    <p className="mt-1.5 text-[12.5px] text-ink-faint">
      {story.author} · {months[date.getMonth()]} {date.getDate()} · {story.readingMinutes} min read
    </p>
  )
}

function EnRowCard({ story }: { story: Story }) {
  return (
    <article className="group flex gap-4 border-b border-rule pb-4 last:border-b-0 last:pb-0">
      <div className="min-w-0 flex-1">
        <EnKicker desk={story.desk} />
        <a href={storyUrl(story)} className="block">
          <h3 className="headline-card mt-1 text-[16.5px] leading-snug text-ink group-hover:text-crimson transition-colors">
            {story.titleEn}
          </h3>
          <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
            {story.deckEn}
          </p>
          <EnMeta story={story} />
        </a>
      </div>
      <div className="hidden shrink-0 sm:block">
        <HeroImage story={story} ratio="aspect-square size-[104px]" rounded="rounded-sm" sizes="104px" />
      </div>
    </article>
  )
}

export default function EnglishHome() {
  const lead = useMemo(() => leadStory(), [])
  const pair = useMemo(() => supportPair(lead.slug), [lead.slug])
  const latestItems = useMemo(
    () => latest(8, [lead.slug, ...pair.map((p) => p.slug)]),
    [lead.slug, pair],
  )
  const topDesks = useMemo(
    () => ['politics', 'business', 'society', 'sports'].map((d) => ({ d, items: byDesk(d) })),
    [],
  )
  const { saved } = useSaved()
  const bsToday = useMemo(() => formatBsFull(adToBs(new Date())), [])
  const { index } = nepseSnapshot

  return (
    <main id="main">
      {/* English banner */}
      <div className="border-b border-rule bg-surface-soft">
        <div className={`${container} flex flex-wrap items-center justify-between gap-2 py-2.5`}>
          <p className="font-headline text-[13px] font-semibold text-ink-soft">
            English Edition · Nagarik Watch · {bsToday} BS
          </p>
          <a
            href={href('/')}
            className="rounded-sm border border-crimson/50 px-2.5 py-1 font-headline text-[12.5px] font-bold uppercasest text-crimson transition-colors hover:bg-crimson hover:text-white"
          >
            नेपाली संस्करण
          </a>
        </div>
      </div>

      {/* Lead */}
      <section aria-label="Top story">
        <a href={storyUrl(lead)} className="group block">
          <div className="relative">
            <HeroImage story={lead} priority ratio="aspect-[4/5] sm:aspect-[16/9]" sizes="100vw" />
            <div className="lead-scrim absolute inset-0" />
            <div className="absolute inset-x-0 bottom-0">
              <div className={`${container} pb-5 pt-16 md:pb-7`}>
                <p className="mb-2 flex items-center gap-2.5">
                  <span className="rounded-sm bg-crimson px-2 py-0.5 font-headline text-[11px] font-bold uppercase text-white">
                    Top Story
                  </span>
                  <span className="font-headline text-[12px] font-bold uppercase text-white/85">
                    {desks.find((d) => d.slug === lead.desk)?.nameEn}
                  </span>
                </p>
                <h1 className="headline-lead max-w-[24ch] text-balance text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.45)]">
                  {lead.titleEn}
                </h1>
                <p className="mt-3 hidden max-w-[62ch] text-[16px] leading-relaxed text-white/85 sm:block">
                  {lead.deckEn}
                </p>
              </div>
            </div>
          </div>
        </a>
      </section>

      {/* Support pair */}
      <section className="border-b border-rule">
        <div className={`${container} grid gap-x-6 gap-y-8 py-7 sm:grid-cols-2 md:py-9`}>
          {pair.map((story) => (
            <article key={story.slug} className="group">
              <EnKicker desk={story.desk} />
              <a href={storyUrl(story)} className="block">
                <div className="mt-1.5">
                  <HeroImage story={story} ratio="aspect-[16/9]" rounded="rounded-sm" sizes="(max-width: 640px) 100vw, 50vw" />
                  <h2 className="headline-support mt-3 text-ink group-hover:text-crimson transition-colors">
                    {story.titleEn}
                  </h2>
                  <EnMeta story={story} />
                </div>
              </a>
            </article>
          ))}
        </div>
      </section>

      {/* Latest + market card */}
      <section className="border-b border-rule py-7 md:py-9">
        <div className={container}>
          <div className="grid gap-x-8 gap-y-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <SectionHeader title="Latest" />
              <div className="space-y-4">
                {latestItems.map((s) => (
                  <EnRowCard key={s.slug} story={s} />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="paper-card rounded-sm p-4">
                <div className="flex items-center justify-between border-b border-rule pb-3">
                  <h3 className="font-headline text-[17px] font-extrabold text-ink">NEPSE</h3>
                  <a href={href('/nepse')} className="font-headline text-[13px] font-bold text-crimson hover:underline">
                    Details →
                  </a>
                </div>
                <p className="mt-3 font-headline text-[30px] font-extrabold tabular-nums text-ink">
                  {index.value.toFixed(2)}
                </p>
                <p className="font-headline text-[13.5px] font-bold tabular-nums text-market-green">
                  ▲ {index.changeAbs.toFixed(2)} ({index.changePct.toFixed(2)}%)
                </p>
                <p className="mt-2 text-[11.5px] text-ink-faint">{nepseSnapshot.asOfEn}</p>
              </div>
              <div className="paper-card rounded-sm p-4">
                <h3 className="font-headline text-[17px] font-extrabold text-ink">
                  Saved on this device
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">
                  You have {saved.length} saved {saved.length === 1 ? 'story' : 'stories'} in the
                  Nepali edition. Saved stories sync across both editions on this device.
                </p>
                <a
                  href={href('/saved')}
                  className="mt-3 inline-flex rounded-sm bg-crimson px-3.5 py-2 font-headline text-[14px] font-bold text-white"
                >
                  View saved
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key desks */}
      {topDesks.map(({ d, items }) =>
        items.length === 0 ? null : (
          <section key={d} className="border-t border-rule py-7 md:py-9">
            <div className={container}>
              <SectionHeader
                title={desks.find((x) => x.slug === d)!.nameEn}
                link={`/${d}`}
              />
              <div className="grid gap-x-6 gap-y-7 md:grid-cols-[1.35fr_1fr]">
                <article className="group">
                  <a href={storyUrl(items[0]!)} className="block">
                    <HeroImage story={items[0]!} ratio="aspect-[16/9]" rounded="rounded-sm" sizes="(max-width: 768px) 100vw, 60vw" />
                    <div className="pt-2.5">
                      <h3 className="headline-support text-ink group-hover:text-crimson transition-colors">
                        {items[0]!.titleEn}
                      </h3>
                      <EnMeta story={items[0]!} />
                    </div>
                  </a>
                </article>
                <div className="space-y-4 md:border-l md:border-rule md:pl-6">
                  {items.slice(1, 4).map((s) => (
                    <EnRowCard key={s.slug} story={s} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ),
      )}

      {/* Provinces */}
      <section className="border-t border-rule bg-surface-soft py-7">
        <div className={container}>
          <SectionHeader title="Provinces" link="/province" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {provinces.map((p) => (
              <a
                key={p.slug}
                href={href(`/province/${p.slug}`)}
                className="rounded-sm border border-rule bg-surface p-3 transition-colors hover:border-crimson"
              >
                <p className="font-headline text-[15px] font-extrabold text-ink">{p.nameEn}</p>
                <p className="mt-1 text-[12px] text-ink-faint">HQ: {p.hqNe}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
