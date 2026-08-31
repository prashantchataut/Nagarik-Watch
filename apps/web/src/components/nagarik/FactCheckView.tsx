'use client'

/**
 * तथ्य जाँच (Fact Check) — the trust desk.
 * Verdict system (सही/मिश्रित/गलत/सन्दर्भ चाहिन्छ), methodology, checked
 * stories with verdict chips, and a reader claim-submission form.
 */

import { useMemo, useState } from 'react'
import { CheckCircle2, HelpCircle, AlertOctagon, Shuffle, Send, ClipboardCheck } from 'lucide-react'
import { PageHead, container } from './PatroView'
import { Kicker, MetaLine, SectionHeader } from './cards'
import { stories, type Story } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import { toDevanagari } from '@/lib/news/patro'

type VerdictKey = 'verified' | 'mixed' | 'false' | 'context'

const VERDICTS: Record<VerdictKey, { ne: string; en: string; icon: typeof CheckCircle2; chip: string; desc: string }> = {
  verified: {
    ne: 'सही',
    en: 'Verified',
    icon: CheckCircle2,
    chip: 'bg-green/10 text-green border-green/40',
    desc: 'दाबी प्रमाणसँग मिल्छ।',
  },
  mixed: {
    ne: 'मिश्रित',
    en: 'Mixed',
    icon: Shuffle,
    chip: 'bg-gold/10 text-gold border-gold/40',
    desc: 'केही अंश सही, केही अंश अपूर्ण वा भ्रामक।',
  },
  false: {
    ne: 'गलत',
    en: 'False',
    icon: AlertOctagon,
    chip: 'bg-crimson/10 text-crimson border-crimson/40',
    desc: 'मुख्य दाबी प्रमाणबाट समर्थन हुँदैन।',
  },
  context: {
    ne: 'सन्दर्भ चाहिन्छ',
    en: 'Needs context',
    icon: HelpCircle,
    chip: 'bg-ink/5 text-ink-soft border-rule',
    desc: 'दाबी बुझ्न थप समय, स्थान वा स्रोत चाहिन्छ।',
  },
}

const WORKFLOW: { ne: string; en: string }[] = [
  { ne: 'दाबी छुट्याउने', en: 'Separate the claim' },
  { ne: 'मूल स्रोत खोज्ने', en: 'Find the primary source' },
  { ne: 'स्वतन्त्र प्रमाण मिलाउने', en: 'Match independent evidence' },
  { ne: 'निर्णय र सच्याइ देखाउने', en: 'Publish the verdict + correction path' },
]

/** Verdict inference for display: flood coverage + tagged stories. */
function verdictForStory(s: Story): VerdictKey | null {
  if (s.desk !== 'fact-check') return null
  const t = s.titleNe
  if (t.includes('भविष्यवाणी')) return 'false'
  if (t.includes('गलत भिडियो')) return 'mixed'
  if (t.includes('बाँध फुट्यो')) return 'false'
  if (t.includes('१५ दिन बन्द')) return 'mixed'
  if (t.includes('आँकडा')) return 'context'
  return 'mixed'
}

export default function FactCheckView() {
  const [filter, setFilter] = useState<VerdictKey | 'all'>('all')
  const [claim, setClaim] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<{ sending: boolean; sent: boolean; error: string | null }>({
    sending: false,
    sent: false,
    error: null,
  })

  const checked = useMemo(
    () =>
      stories
        .filter((s) => s.desk === 'fact-check')
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .map((s) => ({ story: s, verdict: verdictForStory(s) })),
    [],
  )

  const visible = filter === 'all' ? checked : checked.filter((c) => c.verdict === filter)
  const counts = {
    verified: checked.filter((c) => c.verdict === 'verified').length,
    mixed: checked.filter((c) => c.verdict === 'mixed').length,
    false: checked.filter((c) => c.verdict === 'false').length,
    context: checked.filter((c) => c.verdict === 'context').length,
  }

  async function submitClaim(e: React.FormEvent) {
    e.preventDefault()
    if (claim.trim().length < 12) {
      setState({ sending: false, sent: false, error: 'दाबी कम्तीमा १२ अक्षरको लेख्नुहोस्।' })
      return
    }
    setState({ sending: true, sent: false, error: null })
    try {
      const res = await fetch('/api/fact-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, sourceUrl, email }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'पठाउन सकिएन।')
      setState({ sending: false, sent: true, error: null })
      setClaim('')
      setSourceUrl('')
      setEmail('')
    } catch (err) {
      setState({
        sending: false,
        sent: false,
        error: err instanceof Error ? err.message : 'सञ्जाल त्रुटि।',
      })
    }
  }

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="विश्वास डेस्क"
          title="तथ्य जाँच"
          sub="भाइरल दाबीहरू प्रमाणसँग मिलाएर सार्वजनिक निर्णय — सही, मिश्रित, गलत वा सन्दर्भ चाहिन्छ। विपद् समयमा गलत सूचनाले ज्यानसम्म जान सक्छ; जाँचिएको जानकारीले मात्र हाइरो गर्छ।"
        />

        {/* Verdict legend */}
        <section aria-label="निर्णय प्रणाली" className="grid gap-3 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(VERDICTS) as VerdictKey[]).map((k) => {
            const v = VERDICTS[k]
            const Icon = v.icon
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(filter === k ? 'all' : k)}
                className={`rounded-md border p-4 text-left transition-colors ${
                  filter === k ? 'border-crimson' : 'border-rule hover:border-rule-strong'
                }`}
              >
                <span className={`inline-flex items-center gap-2 rounded-sm border px-2 py-1 font-headline text-[13px] font-bold ${v.chip}`}>
                  <Icon className="size-4" aria-hidden /> {v.ne}
                </span>
                <span className="mt-2 block text-[12.5px] leading-relaxed text-ink-soft">{v.desc}</span>
                <span className="mt-1 block font-headline text-[12px] font-bold text-ink-faint">
                  {toDevanagari(counts[k])} कथा
                </span>
              </button>
            )
          })}
        </section>

        {/* Methodology strip */}
        <section aria-label="कार्यविधि" className="mb-10 rounded-md border border-rule bg-surface-soft p-5">
          <h3 className="flex items-center gap-2 font-headline text-[17px] font-bold text-ink">
            <ClipboardCheck className="size-4 text-crimson" aria-hidden /> हामी कसरी जाँच्छौं
          </h3>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {WORKFLOW.map((w, i) => (
              <li key={w.ne} className="rounded-sm border border-rule bg-paper p-3">
                <p className="font-headline text-[12px] font-black text-crimson">
                  {toDevanagari(i + 1)}
                </p>
                <p className="mt-0.5 font-headline text-[14.5px] font-bold text-ink">{w.ne}</p>
                <p className="text-[11.5px] text-ink-faint">{w.en}</p>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[12.5px] leading-relaxed text-ink-soft">
            जाँच नतिजा परिवर्तन भए लेखमा स्पष्ट रूपमा अद्यावधिक लेखिन्छ — चुपचाप मेटाइँदैन। स्रोत नदेखिने
            दाबी "जाँच नसकिएको" कायम रहन्छ, अनुमानमा "सही" लेखिँदैन।
          </p>
        </section>

        {/* Checked stories */}
        <SectionHeader
          title={filter === 'all' ? 'जाँचिएका कथा' : `${VERDICTS[filter].ne} निर्णय भएका कथा`}
        />
        <div className="divide-y divide-rule border-t border-b border-rule">
          {visible.length === 0 ? (
            <p className="py-10 text-center text-[14px] text-ink-faint">
              यो निर्णय वर्गमा हाल कथा छैनन्।
            </p>
          ) : (
            visible.map(({ story, verdict }) => {
              const v = verdict ? VERDICTS[verdict] : null
              const Icon = v?.icon ?? HelpCircle
              return (
                <article key={story.slug} className="group py-5">
                  <a href={href(`/${story.desk}/${story.slug}`)} className="block">
                    <div className="flex flex-wrap items-center gap-3">
                      <Kicker desk={story.desk} />
                      {v && (
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-headline text-[12px] font-bold ${v.chip}`}
                        >
                          <Icon className="size-3.5" aria-hidden /> निर्णय: {v.ne}
                        </span>
                      )}
                    </div>
                    <h3 className="mt-1.5 max-w-3xl font-headline text-[19px] font-extrabold leading-snug text-ink group-hover:text-crimson sm:text-[21px]">
                      {story.titleNe}
                    </h3>
                    <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed text-ink-soft">{story.deckNe}</p>
                    <MetaLine story={story} />
                  </a>
                </article>
              )
            })
          )}
        </div>

        {/* Claim submission */}
        <section aria-label="दाबी पठाउनुहोस्" className="my-12 grid gap-6 rounded-md border-2 border-crimson/60 bg-surface-soft p-6 sm:p-8 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="font-headline text-[24px] font-extrabold leading-tight text-ink">
              तपाईंलाई शङ्का लागेको दाबी पठाउनुहोस्
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              सामाजिक सञ्जालमा देखिएको कुनै खबर, भिडियो वा "तथ्याङ्क" शङ्कास्पद लाग्यो? लिङ्कसहित पठाउनुहोस् —
              डेस्कले प्रमाणसँग मिलाएर सार्वजनिक गर्नेछ। नाम चाहिँदैन; इमेल वैकल्पिक (जवाफ चाहेमा मात्र)।
            </p>
            <p className="mt-3 text-[12px] text-ink-faint">
              प्राथमिकता: जनस्वास्थ्य, विपद्, चुनाव र सार्वजनिक निर्णयसँग जोडिएका दाबी।
            </p>
          </div>
          <form onSubmit={submitClaim} className="space-y-3">
            <label className="block">
              <span className="mb-1 block font-headline text-[13px] font-bold text-ink">दाबी (आवश्यक)</span>
              <textarea
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                rows={3}
                maxLength={600}
                required
                placeholder="जस्तै: '… भन्ने भिडियो फलानो ठाउँको हो भनिएको छ'"
                className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-[14px] leading-relaxed text-ink focus:border-crimson focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-headline text-[13px] font-bold text-ink">स्रोत लिङ्क (वैकल्पिक)</span>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-[14px] text-ink focus:border-crimson focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-headline text-[13px] font-bold text-ink">इमेल (वैकल्पिक)</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="तपाईं@उदाहरण.कम"
                className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-[14px] text-ink focus:border-crimson focus:outline-none"
              />
            </label>
            {state.error && <p className="text-[13px] font-bold text-crimson">{state.error}</p>}
            {state.sent && (
              <p className="text-[13px] font-bold text-green">
                पाइयो — डेस्कले जाँचेर नतिजा प्रकाशित गर्नेछ। धन्यवाद!
              </p>
            )}
            <button
              type="submit"
              disabled={state.sending}
              className="inline-flex items-center gap-2 rounded-sm bg-crimson px-5 py-2.5 font-headline text-[15px] font-bold text-white hover:bg-crimson-deep disabled:opacity-60"
            >
              <Send className="size-4" aria-hidden /> {state.sending ? 'पठाइँदै…' : 'दाबी पठाउनुहोस्'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
