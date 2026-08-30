'use client'

import { useMemo } from 'react'
import { MapPin } from 'lucide-react'
import { provinces, stories } from '@/lib/news/data'
import { byProvince, storyUrl } from '@/lib/news/utils'
import { toDevanagari } from '@/lib/news/patro'
import { href } from '@/lib/news/router'
import { PageHead, container } from './PatroView'
import { HeroImage, Kicker, MetaLine, RowCard, SectionHeader } from './cards'

export function ProvinceHub() {
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const s of stories) map.set(s.province, (map.get(s.province) ?? 0) + 1)
    return map
  }, [])
  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="प्रदेश"
          title="सातै प्रदेश, एउटै पत्रिका"
          sub="संघीय नेपालका सातै प्रदेशका समाचार रिपोर्टिङ स्थान अनुसार छुट्टिएका छन्। आफ्नो प्रदेश छान्नुहोस्।"
        />
        <div className="grid gap-4 py-7 sm:grid-cols-2 md:grid-cols-3 md:py-9 lg:grid-cols-4">
          {provinces.map((p, i) => (
            <a
              key={p.slug}
              href={href(`/province/${p.slug}`)}
              className="group paper-card rounded-sm p-5 transition-colors hover:border-crimson"
            >
              <p className="font-headline text-[11px] font-bold uppercase text-crimson">
                प्रदेश {toDevanagari(i + 1)}
              </p>
              <h2 className="mt-1.5 font-headline text-[21px] font-extrabold text-ink group-hover:text-crimson transition-colors">
                {p.nameNe}
              </h2>
              <p className="mt-1 flex items-center gap-1 text-[13px] text-ink-soft">
                <MapPin className="size-3.5" /> राजधानी: {p.capitalNe}
              </p>
              <p className="mt-3 font-headline text-[24px] font-extrabold leading-none text-crimson tabular-nums">
                {toDevanagari(counts.get(p.slug) ?? 0)}
                <span className="ml-1.5 text-[12px] font-semibold text-ink-faint">समाचार</span>
              </p>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}

export function ProvincePage({ slug }: { slug: string }) {
  const province = provinces.find((p) => p.slug === slug)
  const items = useMemo(() => (province ? byProvince(province.slug) : []), [province])

  if (!province) {
    return (
      <main id="main" className="mx-auto max-w-[680px] px-4 py-20 text-center">
        <p className="kicker">प्रदेश भेटिएन</p>
        <h1 className="mt-2 font-headline text-[30px] font-extrabold text-ink">
          यस्तो प्रदेश छैन
        </h1>
        <a href={href('/province')} className="mt-4 inline-block font-semibold text-crimson hover:underline">
          सबै प्रदेश हेर्नुहोस्
        </a>
      </main>
    )
  }

  const idx = provinces.findIndex((p) => p.slug === slug)
  const lead = items[0]
  const rest = items.slice(1)

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker={`प्रदेश ${toDevanagari(idx + 1)}`}
          title={province.nameNe}
          sub={`राजधानी ${province.capitalNe} · यस संग्रहमा ${toDevanagari(items.length)} समाचार — रिपोर्टिङ स्थान अनुसार।`}
        />

        {items.length === 0 ? (
          <p className="py-12 text-[15px] text-ink-soft">
            यस प्रदेशका समाचार हाल संग्रहमा छैनन्। अन्य प्रदेश हेर्नुहोस्।
          </p>
        ) : (
          <div className="py-7 md:py-9">
            {lead && (
              <article className="group mb-8">
                <Kicker desk={lead.desk} />
                <a href={storyUrl(lead)} className="block">
                  <div className="mt-1.5">
                    <HeroImage story={lead} priority ratio="aspect-[16/9]" rounded="rounded-sm" sizes="100vw" />
                    <h2 className="headline-support mt-3 text-ink group-hover:text-crimson transition-colors">
                      {lead.titleNe}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-[15.5px] leading-relaxed text-ink-soft">
                      {lead.deckNe}
                    </p>
                    <MetaLine story={lead} />
                  </div>
                </a>
              </article>
            )}

            {rest.length > 0 && (
              <>
                <SectionHeader title={`${province.nameNe} — थप समाचार`} />
                <div className="grid gap-x-8 md:grid-cols-2">
                  {rest.map((s) => (
                    <div key={s.slug} className="mb-5">
                      <RowCard story={s} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Other provinces */}
        <section className="border-t border-rule py-6">
          <p className="mb-3 text-[11px] uppercase text-ink-faint">अन्य प्रदेश</p>
          <div className="flex flex-wrap gap-2">
            {provinces
              .filter((p) => p.slug !== slug)
              .map((p) => (
                <a
                  key={p.slug}
                  href={href(`/province/${p.slug}`)}
                  className="rounded-full border border-rule bg-surface px-3.5 py-1.5 font-headline text-[14px] font-semibold text-ink-soft transition-colors hover:border-crimson hover:text-crimson"
                >
                  {p.nameNe}
                </a>
              ))}
          </div>
        </section>
      </div>
    </main>
  )
}
