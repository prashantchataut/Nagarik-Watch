import Link from 'next/link'
import type { Metadata } from 'next'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { getCricketScores, getFootballScores } from '@/lib/live/sports'
import { LiveDeskShell } from '@/components/public/LiveDeskShell'
import { canonicalAlternates } from '@/lib/seo/canonical'

export const dynamic = 'force-static'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  return {
    title: en ? 'Live scores' : 'प्रत्यक्ष स्कोर',
    description: en
      ? 'Verified football and cricket scores.'
      : 'प्रमाणित फुटबल र क्रिकेट स्कोर।',
    alternates: canonicalAlternates(locale, '/live-scores'),
  }
}

export default async function LiveScoresPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale)
  const en = locale === 'en'
  const [football, cricket] = await Promise.all([getFootballScores(), getCricketScores()])

  return (
    <LiveDeskShell
      locale={en ? 'en' : 'ne'}
      title={en ? 'Live scores' : 'प्रत्यक्ष स्कोर'}
      dek={
        en
          ? 'Scores appear only when a verified provider feed is available.'
          : 'प्रमाणित प्रदायक फिड उपलब्ध हुँदा मात्र स्कोर देखाइन्छ।'
      }
      aside={
        <p className="text-meta text-ink-soft" lang={en ? 'en' : 'ne'}>
          <Link href={localizeHref(locale, '/sports')} className="font-semibold text-brand-strong">
            {en ? 'Sports desk' : 'खेलकुद'}
          </Link>
          {en ? ' for stories and fixtures context.' : ' मा कथा र खेलतालिका हेर्नुहोस्।'}
        </p>
      }
    >
      <ScoreSection
        title={en ? 'Football' : 'फुटबल'}
        envelope={football}
        emptyNe="प्रमाणित फुटबल स्कोर अहिले उपलब्ध छैन।"
        emptyEn="No verified football scores are available right now."
        locale={locale}
      />
      <ScoreSection
        title={en ? 'Cricket' : 'क्रिकेट'}
        envelope={cricket}
        emptyNe="प्रमाणित क्रिकेट स्कोर अहिले उपलब्ध छैन।"
        emptyEn="No verified cricket scores are available right now."
        locale={locale}
      />
    </LiveDeskShell>
  )
}

function ScoreSection({
  title,
  envelope,
  emptyNe,
  emptyEn,
  locale,
}: {
  title: string
  envelope: {
    status: string
    source: string
    updatedAt: string
    data: Array<Record<string, unknown>>
  }
  emptyNe: string
  emptyEn: string
  locale: 'ne' | 'en'
}) {
  const en = locale === 'en'
  const ok = envelope.status === 'ok' && envelope.data.length > 0
  return (
    <section className="border-t border-rule py-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-h2 font-extrabold text-ink">{title}</h2>
        <span className="text-caption text-mute">{envelope.source}</span>
      </div>
      {ok ? (
        <ul className="mt-4 divide-y divide-rule border-y border-rule">
          {envelope.data.map((m, i) => (
            <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-3 font-display text-body text-ink">
              <strong className="font-semibold">{String(m.home ?? m.teamA ?? '')}</strong>
              <b className="tabular-nums">{String(m.score ?? '-')}</b>
              <strong className="text-right font-semibold">{String(m.away ?? m.teamB ?? '')}</strong>
              <span className="col-span-3 text-caption text-mute">{String(m.status ?? m.league ?? '')}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 border-y border-rule py-6 text-body text-ink-soft" lang={en ? 'en' : 'ne'}>
          {en ? emptyEn : emptyNe}
        </p>
      )}
    </section>
  )
}
