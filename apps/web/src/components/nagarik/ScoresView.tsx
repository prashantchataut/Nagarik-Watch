'use client'

import { liveScores, scoreBoardNote } from '@/lib/news/scores'
import { PageHead, container } from './PatroView'

export default function ScoresView() {
  const live = liveScores.filter((s) => s.statusEn === 'live')
  const upcoming = liveScores.filter((s) => s.statusEn === 'upcoming')
  const done = liveScores.filter((s) => s.statusEn === 'done')

  const Card = ({ item }: { item: (typeof liveScores)[number] }) => (
    <article className="paper-card rounded-sm p-4">
      <div className="flex items-center justify-between border-b border-rule pb-2.5">
        <p className="text-[12px] font-semibold uppercase text-ink-faint">
          {item.sportNe} · {item.leagueNe}
        </p>
        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-headline text-[12px] font-bold ${
            item.statusEn === 'live'
              ? 'bg-crimson text-white'
              : item.statusEn === 'done'
                ? 'bg-surface-soft text-ink-faint'
                : 'bg-crimson-wash text-crimson'
          }`}
        >
          {item.statusEn === 'live' && (
            <span className="size-1.5 animate-pulse rounded-full bg-white" aria-hidden="true" />
          )}
          {item.statusNe}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1">
        <p className="font-headline text-[16.5px] font-bold text-ink">{item.teamA}</p>
        <p className="text-right font-headline text-[16.5px] font-extrabold tabular-nums text-ink">
          {item.scoreA}
        </p>
        <p className="font-headline text-[16.5px] font-bold text-ink">{item.teamB}</p>
        <p className="text-right font-headline text-[16.5px] font-extrabold tabular-nums text-ink">
          {item.scoreB}
        </p>
      </div>
      <p className="mt-2.5 border-t border-rule pt-2.5 text-[13px] leading-relaxed text-ink-soft">
        {item.detailNe}
      </p>
    </article>
  )

  return (
    <main id="main">
      <div className={container}>
        <PageHead kicker="खेलकुद" title="लाइभ स्कोर" sub="क्रिकेट, फुटबल र भलिबलका चालु र नजिकका खेलहरू एकै पानोमा।" />

        {live.length > 0 && (
          <section className="py-6" aria-label="चालु खेल">
            <h2 className="mb-3 flex items-center gap-2 font-headline text-[20px] font-extrabold text-ink">
              <span className="size-2.5 animate-pulse rounded-full bg-crimson" aria-hidden="true" />
              अहिले खेलिँदै
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {live.map((item, i) => (
                <Card key={`${item.teamA}-${i}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {upcoming.length > 0 && (
          <section className="py-6" aria-label="आउँदै गरेका खेल">
            <h2 className="mb-3 font-headline text-[20px] font-extrabold text-ink">आउँदै गरेका</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((item, i) => (
                <Card key={`${item.teamA}-${i}`} item={item} />
              ))}
            </div>
          </section>
        )}

        {done.length > 0 && (
          <section className="py-6" aria-label="समाप्त खेल">
            <h2 className="mb-3 font-headline text-[20px] font-extrabold text-ink">हालसालै समाप्त</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {done.map((item, i) => (
                <Card key={`${item.teamA}-${i}`} item={item} />
              ))}
            </div>
          </section>
        )}

        <p className="mb-8 rounded-sm bg-crimson-wash/70 p-3.5 text-[13px] leading-relaxed text-ink-soft">
          <strong className="text-crimson">नोट:</strong> {scoreBoardNote}
        </p>
      </div>
    </main>
  )
}
