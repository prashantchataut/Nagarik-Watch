'use client'

/**
 * विपद् केन्द्र (Disaster Hub) — special coverage page for the 26 Aug 2026
 * Bhote Koshi flood + monsoon disaster season. Situation dashboard, district
 * impact, timeline, live USGS earthquake feed, helplines, safety guide and
 * the related coverage. Data sources are shown on-page (honesty contract).
 */

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Radio, PhoneCall, ShieldCheck, LifeBuoy, Activity } from 'lucide-react'
import { PageHead, container } from './PatroView'
import { Kicker, RowCard, SectionHeader } from './cards'
import { stories, type Story } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import {
  disasterStats,
  districtImpacts,
  timeline,
  helplines,
  reliefPartners,
  safetyGuide,
  disasterSources,
  DISASTER_LAST_UPDATED,
} from '@/lib/news/disaster'
import { toDevanagari } from '@/lib/news/patro'

interface Quake {
  id: string
  mag: number
  place: string
  time: number
  url: string
}

const TONE_STYLES: Record<string, string> = {
  critical: 'border-crimson bg-crimson/5',
  warning: 'border-amber-700/40 bg-amber-700/5',
  info: 'border-rule bg-surface-soft',
}

export default function DisasterHub() {
  const [quakes, setQuakes] = useState<Quake[] | null>(null)
  const [openGuide, setOpenGuide] = useState<number | null>(0)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/disaster/earthquakes', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { quakes?: Quake[] } | null) => {
        if (!cancelled && data) setQuakes(data.quakes ?? [])
      })
      .catch(() => {
        if (!cancelled) setQuakes([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  const coverage = useMemo(
    () =>
      stories
        .filter((s: Story) => s.desk === 'disaster' || s.tags.includes('बाढी'))
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .slice(0, 12),
    [],
  )

  const [lead, ...rest] = coverage

  return (
    <main id="main">
      {/* Hero band */}
      <div className="border-b-2 border-crimson bg-ink text-paper">
        <div className={container}>
          <div className="py-8 sm:py-10">
            <p className="flex items-center gap-2 font-headline text-[13px] font-bold uppercase text-crimson-wash">
              <AlertTriangle className="size-4" aria-hidden /> विशेष कभरेज
            </p>
            <h1 className="mt-2 font-headline text-[34px] font-black leading-[1.1] sm:text-[44px]">
              विपद् केन्द्र — बाढी तथा प्रकोप
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-paper/75">
              भोटेकोशी बाढी र यस वर्षायामका घटनाको एकै ठाउँमा तथ्याङ्क, अद्यावधिक, सुरक्षा जानकारी र
              तपाईंलाई चाहिने स्रोत। आँकडा स्रोतसहित; उद्धार चलिरहँदा सङ्ख्या फेरिन्छन्।
            </p>
            <p className="mt-3 text-[12px] text-paper/55">
              अन्तिम अद्यावधिक: {DISASTER_LAST_UPDATED} · तथ्याङ्कका स्रोत तल उल्लेखित
            </p>
          </div>
        </div>
      </div>

      <div className={container}>
        {/* Situation dashboard */}
        <section aria-label="स्थिति तथ्याङ्क" className="py-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {disasterStats.map((stat) => (
              <div
                key={stat.labelNe}
                className={`rounded-md border p-4 ${TONE_STYLES[stat.tone] ?? TONE_STYLES.info}`}
              >
                <p className="font-headline text-[12px] font-bold uppercase text-ink-soft">{stat.labelNe}</p>
                <p className="mt-1 font-headline text-[26px] font-black leading-none text-ink sm:text-[30px]">
                  {stat.value}
                </p>
                <p className="mt-2 text-[11px] leading-snug text-ink-faint">{stat.noteNe}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Lead story + timeline */}
        <div className="grid gap-10 pb-10 lg:grid-cols-[1.4fr_1fr]">
          <section aria-label="मुख्य कभरेज">
            {lead && (
              <article>
                <a href={href(`/${lead.desk}/${lead.slug}`)} className="group block">
                  { }
                  <img
                    src={lead.hero}
                    alt={lead.heroCaption}
                    className="aspect-[16/9] w-full rounded-md object-cover"
                    loading="eager"
                  />
                  <Kicker desk={lead.desk} />
                  <h2 className="mt-1 font-headline text-[24px] font-extrabold leading-tight text-ink group-hover:text-crimson sm:text-[28px]">
                    {lead.titleNe}
                  </h2>
                  <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">{lead.deckNe}</p>
                </a>
                {rest.length > 0 && (
                  <div className="mt-6 divide-y divide-rule border-t border-rule">
                    {rest.slice(0, 4).map((s) => (
                      <RowCard key={s.slug} story={s} />
                    ))}
                  </div>
                )}
          </article>
            )}
          </section>

          <aside aria-label="घटनाक्रम" className="space-y-8">
            <div className="rounded-md border border-rule bg-surface-soft p-5">
              <h3 className="flex items-center gap-2 font-headline text-[17px] font-bold text-ink">
                <Activity className="size-4 text-crimson" aria-hidden /> घटनाक्रम
              </h3>
              <ol className="mt-4 space-y-4">
                {timeline.map((t, i) => (
                  <li key={i} className="relative border-l-2 border-crimson/40 pl-4">
                    <span className="absolute -left-[5px] top-1.5 size-2 rounded-full bg-crimson" />
                    <p className="font-headline text-[12px] font-bold text-crimson">{t.timeNe}</p>
                    <p className="mt-0.5 font-headline text-[15px] font-bold leading-snug text-ink">{t.titleNe}</p>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{t.bodyNe}</p>
                  </li>
                ))}
              </ol>
            </div>

            {/* Live earthquakes */}
            <div className="rounded-md border border-rule bg-surface-soft p-5">
              <h3 className="flex items-center gap-2 font-headline text-[17px] font-bold text-ink">
                <Radio className="size-4 text-crimson" aria-hidden /> भूकम्प अनुगमन (USGS लाइभ)
              </h3>
              {quakes === null ? (
                <p className="mt-3 text-[13px] text-ink-faint">लोड हुँदै…</p>
              ) : quakes.length === 0 ? (
                <p className="mt-3 text-[13px] leading-relaxed text-ink-soft">
                  पछिल्लो ७ दिन नेपाल क्षेत्रमा M २.५+ भूकम्प दर्ता भएको छैन (USGS)।
                </p>
              ) : (
                <ul className="mt-3 divide-y divide-rule">
                  {quakes.slice(0, 6).map((q) => (
                    <li key={q.id} className="flex items-baseline gap-3 py-2">
                      <span
                        className={`font-headline text-[15px] font-black ${
                          q.mag >= 5 ? 'text-crimson' : q.mag >= 4 ? 'text-amber-700' : 'text-ink-soft'
                        }`}
                      >
                        M {toDevanagari(q.mag.toFixed(1))}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12.5px] text-ink-soft">{q.place}</span>
                      <a
                        href={q.url}
                        target="_blank"
                        rel="noopener"
                        className="text-[11.5px] font-bold text-crimson hover:underline"
                      >
                        विवरण
                      </a>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-[11px] text-ink-faint">स्रोत: USGS सार्वजनिक फिड — ५ मिनेट क्यास</p>
            </div>
          </aside>
        </div>

        {/* District impact */}
        <section aria-label="जिल्लागत असर" className="pb-10">
          <SectionHeader title="जिल्लागत असर" />
          <div className="overflow-x-auto rounded-md border border-rule">
            <table className="w-full min-w-[640px] text-left text-[13px]">
              <thead className="bg-surface-soft">
                <tr className="font-headline text-[12px] font-bold uppercase text-ink-soft">
                  <th className="px-4 py-3">जिल्ला</th>
                  <th className="px-4 py-3">मृत्यु*</th>
                  <th className="px-4 py-3">बेपत्ता</th>
                  <th className="px-4 py-3">विस्थापित</th>
                  <th className="px-4 py-3">टिप्पणी</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule bg-paper">
                {districtImpacts.map((d) => (
                  <tr key={d.districtEn} className="align-top">
                    <td className="px-4 py-3 font-headline font-bold text-ink">{d.districtNe}</td>
                    <td className="px-4 py-3 font-bold text-crimson">{d.deadNe}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.missingNe}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.displacedNe}</td>
                    <td className="px-4 py-3 text-ink-soft">{d.noteNe}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11.5px] text-ink-faint">
            * सङ्ख्या आँकिएको आधारसहित प्रकाशित; उद्धार प्रगतिसँगै बदलिन्छ। अघिल्ला घटनाका आँकडा पनि जोडिएका छन्।
          </p>
        </section>

        {/* Helplines + relief partners */}
        <div className="grid gap-8 pb-10 lg:grid-cols-2">
          <section aria-label="आपत्कालीन सम्पर्क" className="rounded-md border-2 border-crimson bg-paper p-5">
            <h3 className="flex items-center gap-2 font-headline text-[18px] font-bold text-ink">
              <PhoneCall className="size-4 text-crimson" aria-hidden /> आपत्कालीन फोन
            </h3>
            <ul className="mt-4 space-y-3">
              {helplines.map((h) => (
                <li key={h.number} className="flex items-center gap-3">
                  <span className="min-w-[92px] rounded-sm bg-crimson px-2.5 py-1.5 text-center font-headline text-[15px] font-black text-white">
                    {h.number}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-headline text-[14px] font-bold text-ink">{h.nameNe}</span>
                    <span className="block text-[12px] text-ink-soft">{h.descNe}</span>
                  </span>
                </li>
              ))}
            </ul>
            <a
              href={href('/contact')}
              className="mt-4 inline-block font-headline text-[13.5px] font-bold text-crimson hover:underline"
            >
              सम्पादकीय टोलीसम्पर्क (जानकारी/सुझाव) →
            </a>
          </section>

          <section aria-label="राहत र उद्धार" className="rounded-md border border-rule bg-surface-soft p-5">
            <h3 className="flex items-center gap-2 font-headline text-[18px] font-bold text-ink">
              <LifeBuoy className="size-4 text-crimson" aria-hidden /> उद्धार र राहतमा को-को
            </h3>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {reliefPartners.map((p) => (
                <li key={p.nameEn} className="rounded-sm border border-rule bg-paper p-3">
                  <p className="font-headline text-[14px] font-bold text-ink">{p.nameNe}</p>
                  <p className="text-[12px] text-ink-faint">{p.nameEn}</p>
                  <p className="mt-1 text-[12px] leading-snug text-ink-soft">{p.roleNe}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Safety guide */}
        <section aria-label="सुरक्षा निर्देशन" className="pb-10">
          <SectionHeader title="बाढी–पहिरोबाट जोगिने" />
          <div className="divide-y divide-rule rounded-md border border-rule bg-paper">
            {safetyGuide.map((g, i) => (
              <div key={g.titleNe}>
                <button
                  type="button"
                  onClick={() => setOpenGuide(openGuide === i ? null : i)}
                  aria-expanded={openGuide === i}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                >
                  <span className="flex items-center gap-2 font-headline text-[16px] font-bold text-ink">
                    <ShieldCheck className="size-4 text-crimson" aria-hidden /> {g.titleNe}
                  </span>
                  <span className="font-headline text-[13px] font-bold text-crimson">
                    {openGuide === i ? '−' : '+'}
                  </span>
                </button>
                {openGuide === i && (
                  <ul className="space-y-2 px-5 pb-5 pl-12">
                    {g.itemsNe.map((item) => (
                      <li key={item} className="text-[13.5px] leading-relaxed text-ink-soft">
                        — {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section aria-label="स्रोतहरू" className="pb-12">
          <p className="font-headline text-[13px] font-bold uppercase text-ink-soft">यी आँकडा कहाँबाट</p>
          <ul className="mt-2 space-y-1.5">
            {disasterSources.map((s) => (
              <li key={s} className="text-[12.5px] leading-relaxed text-ink-faint">
                · {s}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-soft">
            नागरिक वाचले आँकडा फेर्दा तत्काल अद्यावधिक गर्छ। स्थानीय सूचना र गलत दाबी भेटिए तथ्य जाँच
            डेस्कमा पठाउनुहोस्।
          </p>
        </section>
      </div>
    </main>
  )
}
