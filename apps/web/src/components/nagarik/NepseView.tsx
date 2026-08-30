'use client'

import { useMemo } from 'react'
import { Droplets, ExternalLink, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { nepseMovers, nepseSectors } from '@/lib/news/nepse'
import { toDevanagari } from '@/lib/news/patro'
import { refreshMarket, useMarket } from '@/lib/news/market-store'
import { stories } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import { PageHead, container } from './PatroView'

function IndexCard({
  label,
  value,
  changeAbs,
  changePct,
}: {
  label: string
  value: number
  changeAbs: number
  changePct: number
}) {
  const up = changePct >= 0
  return (
    <div className="paper-card rounded-sm p-4">
      <p className="text-[11px] font-semibold uppercase text-ink-faint">{label}</p>
      <p className="mt-1 font-headline text-[30px] font-extrabold leading-none tabular-nums text-ink">
        {toDevanagari(value.toFixed(2))}
      </p>
      <p
        className={`mt-1.5 font-headline text-[14px] font-bold tabular-nums ${
          up ? 'text-market-green' : 'text-crimson'
        }`}
      >
        {up ? '▲' : '▼'} {toDevanagari(Math.abs(changeAbs).toFixed(2))} (
        {toDevanagari(Math.abs(changePct).toFixed(2))}%)
      </p>
    </div>
  )
}

function npr(n: number): string {
  return toDevanagari(n.toLocaleString('en-IN', { maximumFractionDigits: 0 }))
}

export default function NepseView() {
  const { market, loading } = useMarket()
  const gainers = useMemo(() => nepseMovers.filter((m) => m.changePct > 0), [])
  const losers = useMemo(() => nepseMovers.filter((m) => m.changePct < 0), [])
  const marketStories = useMemo(
    () => stories.filter((s) => s.desk === 'business').slice(0, 4),
    [],
  )

  const nepse = market?.nepse
  const forex = market?.forex
  const metals = market?.metals
  const fuel = market?.fuel

  const updatedLabel = nepse
    ? new Date(nepse.updatedAt).toLocaleTimeString('ne-NP', { hour: '2-digit', minute: '2-digit' })
    : '…'

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="बजार"
          title="बजार ड्यासबोर्ड"
          sub="नेपाल राष्ट्र बैंकको आधिकारिक विदेशी मुद्रा दर, अन्तर्राष्ट्रिय बजारमा आधारित सुन–चाँदीको सूचक मूल्य, नेप्से सूचकांक र नेपाल आयल निगमको इन्धन मूल्य — सबै एकै ठाउँमा।"
        />

        {/* Market toolbar */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
          <p className="text-[12.5px] text-ink-soft">
            {loading && !market ? (
              'बजार तथ्यांक लोड हुँदै…'
            ) : (
              <>
                अद्यावधिक: <span className="font-semibold text-ink">{updatedLabel}</span> बजे ·
                नेप्से{' '}
                <span className="font-semibold text-ink">
                  [{nepse?.source === 'live' ? 'लाइभ' : 'अन्तिम उपलब्ध'}]
                </span>{' '}
                · विदेशी मुद्रा{' '}
                <span className="font-semibold text-ink">
                  [{forex?.source === 'nrb' ? 'राष्ट्र बैंक' : 'पछिल्लो'}]
                </span>
              </>
            )}
          </p>
          <button
            type="button"
            onClick={() => void refreshMarket()}
            className="flex items-center gap-2 rounded-sm border border-rule px-3.5 py-2 font-headline text-[13.5px] font-bold text-ink transition-colors hover:border-crimson hover:text-crimson"
          >
            <RefreshCw className="size-4" /> अद्यावधिक गर्नुहोस्
          </button>
        </div>

        {/* NEPSE index cards */}
        {nepse && (
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <IndexCard
              label="नेप्से सूचकांक"
              value={nepse.index.value}
              changeAbs={nepse.index.changeAbs}
              changePct={nepse.index.changePct}
            />
            <IndexCard
              label="संवेदनशील सूचकांक"
              value={nepse.sensitive.value}
              changeAbs={nepse.sensitive.changeAbs}
              changePct={nepse.sensitive.changePct}
            />
            <IndexCard
              label="फ्लोट सूचकांक"
              value={nepse.float.value}
              changeAbs={nepse.float.changeAbs}
              changePct={nepse.float.changePct}
            />
          </div>
        )}

        {/* Metals + turnover strip */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {metals && (
            <>
              <div className="paper-card rounded-sm p-5">
                <p className="font-headline text-[14px] font-bold text-ink-soft">सुन (हलमार्क)</p>
                <p className="mt-1 font-headline text-[28px] font-extrabold tabular-nums text-ink">
                  रु {npr(metals.goldTola)}
                </p>
                <p className="text-[12.5px] text-ink-faint">प्रति तोला · १० ग्राम रु {npr(metals.goldTola10g)}</p>
              </div>
              <div className="paper-card rounded-sm p-5">
                <p className="font-headline text-[14px] font-bold text-ink-soft">चाँदी</p>
                <p className="mt-1 font-headline text-[28px] font-extrabold tabular-nums text-ink">
                  रु {npr(metals.silverTola)}
                </p>
                <p className="text-[12.5px] text-ink-faint">प्रति तोला</p>
              </div>
              <div className="paper-card rounded-sm p-5">
                <p className="font-headline text-[14px] font-bold text-ink-soft">बजार अवस्था</p>
                <p className="mt-1 font-headline text-[20px] font-extrabold text-ink">
                  {nepse?.turnover || '…'}
                </p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">
                  {nepse && (
                    <>
                      <span className="font-semibold text-market-green">बढ्यो {toDevanagari(nepse.advancing)}</span>
                      {' · '}
                      <span className="font-semibold text-crimson">घट्यो {toDevanagari(nepse.declining)}</span>
                      {' · '}
                      उस्तै {toDevanagari(nepse.unchanged)}
                    </>
                  )}
                </p>
              </div>
            </>
          )}
        </div>
        {metals && (
          <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
            सुन–चाँदीको मूल्य अन्तर्राष्ट्रिय बजार (औंस मूल्य × राष्ट्र बैंक डलर दर × तोला रूपान्तरण)
            बाट हरेक आधा घण्टा स्वचालित गणना हुन्छ — स्थानीय सुन व्यापारी संघको दर यसभन्दा केही फरक
            पर्न सक्छ।
          </p>
        )}

        {/* Forex table */}
        {forex && (
          <section className="mt-8" aria-label="विदेशी मुद्रा दर">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-headline text-[22px] font-extrabold text-ink">
                विदेशी मुद्रा दर
              </h2>
              <p className="text-[12.5px] text-ink-faint">
                नेपाल राष्ट्र बैंक ·{' '}
                {forex.source === 'nrb' ? `मिति ${forex.dateAd}` : 'पछिल्लो उपलब्ध'} ·{' '}
                <a
                  href="https://www.nrb.org.np/forex/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-crimson hover:underline"
                >
                  आधिकारिक स्रोत <ExternalLink className="size-3.5" />
                </a>
              </p>
            </div>
            <div className="paper-card mt-3 overflow-x-auto rounded-sm">
              <table className="w-full min-w-[520px] text-[14.5px]">
                <thead>
                  <tr className="border-b border-rule text-left">
                    <th className="px-4 py-3 font-headline text-[13px] font-bold text-ink-soft">
                      मुद्रा
                    </th>
                    <th className="px-4 py-3 text-right font-headline text-[13px] font-bold text-ink-soft">
                      एकाइ
                    </th>
                    <th className="px-4 py-3 text-right font-headline text-[13px] font-bold text-ink-soft">
                      किन्न (रु)
                    </th>
                    <th className="px-4 py-3 text-right font-headline text-[13px] font-bold text-ink-soft">
                      बेच्न (रु)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {forex.rates.map((r) => (
                    <tr key={r.iso3} className="transition-colors hover:bg-surface-soft">
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-ink">{r.nameNe}</span>{' '}
                        <span className="font-headline text-[12px] font-bold text-ink-faint">
                          {r.iso3}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ink-soft">
                        {toDevanagari(r.unit)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-headline font-bold tabular-nums text-ink">
                        {toDevanagari(r.buy.toFixed(2))}
                      </td>
                      <td className="px-4 py-2.5 text-right font-headline font-bold tabular-nums text-ink">
                        {toDevanagari(r.sell.toFixed(2))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Fuel + movers */}
        <div className="mt-8 grid gap-x-8 gap-y-8 lg:grid-cols-2">
          {fuel && (
            <section aria-label="इन्धन मूल्य">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="flex items-center gap-2 font-headline text-[22px] font-extrabold text-ink">
                  <Droplets className="size-5 text-crimson" /> इन्धन मूल्य
                </h2>
                <p className="text-[12.5px] text-ink-faint">{fuel.effectiveNe}</p>
              </div>
              <ul className="paper-card mt-3 divide-y divide-rule rounded-sm">
                {fuel.items.map((f) => (
                  <li key={f.nameNe} className="flex items-baseline justify-between px-4 py-3">
                    <span className="text-[15px] font-semibold text-ink">
                      {f.nameNe}{' '}
                      <span className="text-[12px] font-normal text-ink-faint">{f.unitNe}</span>
                    </span>
                    <span className="font-headline text-[18px] font-extrabold tabular-nums text-ink">
                      रु {toDevanagari(f.price.toFixed(2))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[12px] text-ink-faint">
                नेपाल आयल निगमको काठमाडौं मूल्य — निगमले समायोजन गरेपछि अद्यावधिक हुन्छ।
              </p>
            </section>
          )}

          <section aria-label="शेयर बजारका कम्पनी">
            <h2 className="font-headline text-[22px] font-extrabold text-ink">उतार–चढाव</h2>
            <p className="mt-1 text-[12.5px] text-ink-faint">
              नमूना तालिका — वास्तविक कम्पनी दर नेप्सेको आधिकारिक प्रणालीबाट आउँदा लागू हुनेछ।
            </p>
            <div className="paper-card mt-3 rounded-sm p-4">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="flex items-center gap-1.5 font-headline text-[14px] font-extrabold text-market-green">
                    <TrendingUp className="size-4" /> बढ्ने
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {gainers.slice(0, 4).map((m) => (
                      <li key={m.symbol} className="flex justify-between text-[13.5px]">
                        <span className="font-headline font-bold text-ink">{m.symbol}</span>
                        <span className="tabular-nums text-ink-soft">
                          {toDevanagari(m.ltp.toFixed(2))}{' '}
                          <span className="font-semibold text-market-green">
                            +{toDevanagari(m.changePct.toFixed(2))}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 font-headline text-[14px] font-extrabold text-crimson">
                    <TrendingDown className="size-4" /> घट्ने
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {losers.slice(0, 4).map((m) => (
                      <li key={m.symbol} className="flex justify-between text-[13.5px]">
                        <span className="font-headline font-bold text-ink">{m.symbol}</span>
                        <span className="tabular-nums text-ink-soft">
                          {toDevanagari(m.ltp.toFixed(2))}{' '}
                          <span className="font-semibold text-crimson">
                            −{toDevanagari(Math.abs(m.changePct).toFixed(2))}%
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="paper-card mt-4 rounded-sm p-4">
              <p className="font-headline text-[14px] font-extrabold text-ink">क्षेत्रगत सूचकांक</p>
              <ul className="mt-2 space-y-1.5">
                {nepseSectors.slice(0, 5).map((s) => (
                  <li key={s.nameNe} className="flex justify-between text-[13.5px]">
                    <span className="text-ink">{s.nameNe}</span>
                    <span className="tabular-nums text-ink-soft">
                      {toDevanagari(s.value.toFixed(2))}{' '}
                      <span
                        className={
                          s.changePct >= 0 ? 'font-semibold text-market-green' : 'font-semibold text-crimson'
                        }
                      >
                        {s.changePct >= 0 ? '+' : '−'}
                        {toDevanagari(Math.abs(s.changePct).toFixed(2))}%
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        {/* Market desk stories */}
        <section className="mt-10 border-t-2 border-ink pt-6" aria-label="बजारका समाचार">
          <div className="flex items-baseline justify-between">
            <h2 className="font-headline text-[22px] font-extrabold text-ink">बजारका समाचार</h2>
            <a
              href={href('/business')}
              className="font-headline text-[13.5px] font-bold text-crimson hover:underline"
            >
              सबै हेर्नुहोस् →
            </a>
          </div>
          <ul className="mt-4 grid gap-6 md:grid-cols-2">
            {marketStories.map((s) => (
              <li key={s.slug}>
                <a href={href(`/${s.desk}/${s.slug}`)} className="group block">
                  <p className="kicker">{s.tags[0] ?? 'बजार'}</p>
                  <p className="mt-1 font-headline text-[18px] font-bold leading-snug text-ink group-hover:text-crimson">
                    {s.titleNe}
                  </p>
                  <p className="mt-1 line-clamp-2 text-[14px] leading-relaxed text-ink-soft">
                    {s.deckNe}
                  </p>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  )
}
