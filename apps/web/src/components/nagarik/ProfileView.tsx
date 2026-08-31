'use client'

/**
 * प्रोफाइल (Profile) — full account page: identity, subscription,
 * bookmarks, reading history, comments, newsletter, cookie choices.
 * The masthead AccountSheet links here for the full view.
 */

import { useMemo, useState } from 'react'
import { Bookmark, History, LogOut, Mail, ShieldCheck, Crown, Trash2, MessageCircle } from 'lucide-react'
import { container } from './PatroView'
import { SectionHeader } from './cards'
import { stories, type Story } from '@/lib/news/data'
import { href } from '@/lib/news/router'
import { useSaved } from '@/lib/news/storage'
import { useMe } from '@/lib/news/auth-store'
import { useReadHistory, clearReadHistory } from '@/lib/news/read-history'
import { usePaywall, cancelSubscription } from '@/lib/news/paywall-store'
import { formatDevanagariCount } from '@/lib/news/ad-store'
import { useConsent } from '@/lib/news/consent'
import { toDevanagari } from '@/lib/news/patro'

export default function ProfileView({ onLogout, onOpenAccount }: { onLogout: () => void; onOpenAccount: () => void }) {
  const { me } = useMe()
  const { saved } = useSaved()
  const history = useReadHistory()
  const paywall = usePaywall()
  const consent = useConsent()
  const [cancelState, setCancelState] = useState<string | null>(null)

  const savedStories = useMemo(
    () =>
      saved
        .map((slug) => stories.find((s) => s.slug === slug))
        .filter((s): s is NonNullable<typeof s> => Boolean(s)),
    [saved],
  )

  const historyStories = useMemo(() => {
    return history
      .map((entry) => {
        const story = stories.find((s) => `${s.desk}/${s.slug}` === entry.key)
        return story ? { story, at: entry.at } : null
      })
      .filter((h): h is { story: Story; at: number } => h !== null)
      .slice(0, 12)
  }, [history])

  if (!me) {
    return (
      <main id="main">
        <div className={container}>
          <div className="mx-auto max-w-md py-20 text-center">
            <ShieldCheck className="mx-auto size-12 text-ink-faint" strokeWidth={1.5} />
            <h1 className="mt-4 font-headline text-[26px] font-extrabold text-ink">पाठक खाता</h1>
            <p className="mt-2 text-[14.5px] leading-relaxed text-ink-soft">
              प्रोफाइल हेर्न लगइन आवश्यक छ। खाता निःशुल्क हो — बुकमार्क सिन्क, टिप्पणी, सदस्यता र
              पढाइ-इतिहास पाउनुहुन्छ।
            </p>
            <button
              type="button"
              onClick={onOpenAccount}
              className="mt-6 rounded-sm bg-crimson px-6 py-2.5 font-headline text-[15px] font-bold text-white hover:bg-crimson-deep"
            >
              लगइन / खाता खोल्नुहोस्
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main id="main">
      <div className={container}>
        {/* Identity card */}
        <section className="mt-8 rounded-md border border-rule bg-surface-soft p-6">
          <div className="flex flex-wrap items-center gap-5">
            <div
              aria-hidden
              className="flex size-16 items-center justify-center rounded-full bg-crimson font-headline text-[26px] font-black text-white"
            >
              {me.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-headline text-[26px] font-extrabold leading-tight text-ink sm:text-[30px]">
                {me.name}
              </h1>
              <p className="text-[14px] text-ink-soft">{me.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {paywall.subscribed ? (
                  <span className="inline-flex items-center gap-1.5 rounded-sm bg-ink px-2.5 py-1 font-headline text-[12px] font-bold uppercase text-paper">
                    <Crown className="size-3.5" aria-hidden /> {paywall.plan === 'patron' ? 'संरक्षक' : 'सदस्य'}
                  </span>
                ) : (
                  <span className="rounded-sm border border-rule-strong px-2.5 py-1 font-headline text-[12px] font-bold text-ink-soft">
                    निःशुल्क पाठक
                  </span>
                )}
                <span className="rounded-sm border border-rule px-2.5 py-1 font-headline text-[12px] font-bold text-ink-soft">
                  {toDevanagari(savedStories.length)} सेभ
                </span>
                <span className="rounded-sm border border-rule px-2.5 py-1 font-headline text-[12px] font-bold text-ink-soft">
                  {formatDevanagariCount(history.length)} पढाइ
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-sm border border-rule-strong px-4 py-2 font-headline text-[14px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
            >
              <LogOut className="size-4" aria-hidden /> लगआउट
            </button>
          </div>

          {/* Subscription status */}
          <div className="mt-6 rounded-sm border border-rule bg-paper p-4">
            <h2 className="font-headline text-[16px] font-bold text-ink">सदस्यता अवस्था</h2>
            {paywall.subscribed ? (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  सक्रिय सदस्यता — प्रिमियम कथा र विज्ञापन-न्यून अनुभव पाउनुहुन्छ।
                  {cancelState && <span className="mt-1 block text-[12px] text-crimson">{cancelState}</span>}
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await cancelSubscription()
                    setCancelState('सदस्यता रद्द गरियो।')
                  }}
                  className="rounded-sm border border-rule-strong px-3.5 py-1.5 font-headline text-[13px] font-bold text-ink-soft hover:border-crimson hover:text-crimson"
                >
                  रद्द गर्नुहोस्
                </button>
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13.5px] leading-relaxed text-ink-soft">
                  निःशुल्क सीमा: यस महिना बाँकी {formatDevanagariCount(Math.max(0, paywall.remaining))} कथा।
                </p>
                <a
                  href={href('/subscribe')}
                  className="rounded-sm bg-crimson px-4 py-1.5 font-headline text-[13.5px] font-bold text-white hover:bg-crimson-deep"
                >
                  सदस्य बन्नुहोस्
                </a>
              </div>
            )}
          </div>

          {/* Cookie choices */}
          <div className="mt-3 rounded-sm border border-rule bg-paper p-4">
            <h2 className="font-headline text-[16px] font-bold text-ink">कुकी छनोट</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">
              हालको छनोट:{' '}
              <span className="font-bold text-ink">
                {consent.choice === 'all' ? 'सबै स्वीकार (विश्लेषण + विज्ञापन नापाइ)' : 'आवश्यक मात्र'}
              </span>
              . छनोट फेर्न:
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => consent.set('necessary')}
                className="rounded-sm border border-rule-strong px-3.5 py-1.5 font-headline text-[13px] font-bold text-ink hover:bg-surface-soft"
              >
                आवश्यक मात्र
              </button>
              <button
                type="button"
                onClick={() => consent.set('all')}
                className="rounded-sm bg-ink px-3.5 py-1.5 font-headline text-[13px] font-bold text-paper hover:bg-ink/85"
              >
                सबै स्वीकार
              </button>
            </div>
          </div>
        </section>

        {/* Reading history */}
        <section className="mt-12">
          <SectionHeader title="हालै पढिएको" />
          {historyStories.length === 0 ? (
            <p className="border-t border-rule py-8 text-[14px] text-ink-faint">
              अझै पढाइ सुरु गर्नुभएको छैन — यन्त्रमा मात्र राखिने यो सूची आफैं बन्छ।
            </p>
          ) : (
            <>
              <div className="divide-y divide-rule border-y border-rule">
                {historyStories.map(({ story, at }) => (
                  <a
                    key={story.slug}
                    href={href(`/${story.desk}/${story.slug}`)}
                    className="flex items-baseline justify-between gap-4 py-3 group"
                  >
                    <span className="min-w-0 flex-1 font-headline text-[15px] font-bold leading-snug text-ink group-hover:text-crimson">
                      {story.titleNe}
                    </span>
                    <time className="shrink-0 text-[11.5px] text-ink-faint">
                      {new Date(at).toLocaleDateString('ne-NP')}
                    </time>
                  </a>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11.5px] text-ink-faint">
                  <History className="mr-1 inline size-3.5" aria-hidden />
                  यो सूची यही यन्त्रमा मात्र राखिन्छ; खाताभित्र सर्भरमा पनि दर्ता हुन्छ (सिफारिसका लागि)।
                </p>
                <button
                  type="button"
                  onClick={() => clearReadHistory()}
                  className="inline-flex items-center gap-1.5 font-headline text-[12.5px] font-bold text-ink-faint hover:text-crimson"
                >
                  <Trash2 className="size-3.5" aria-hidden /> इतिहास मेट्नुहोस्
                </button>
              </div>
            </>
          )}
        </section>

        {/* Bookmarks */}
        <section className="mt-12">
          <SectionHeader title="सेभ गरिएका समाचार" link="/saved" />
          {savedStories.length === 0 ? (
            <p className="border-t border-rule py-8 text-[14px] text-ink-faint">
              कुनै समाचार सेभ गर्नुभएको छैन।
            </p>
          ) : (
            <div className="grid gap-x-6 gap-y-6 py-2 sm:grid-cols-2 lg:grid-cols-3">
              {savedStories.slice(0, 6).map((s) => (
                <a key={s.slug} href={href(`/${s.desk}/${s.slug}`)} className="group block">
                  <Bookmark className="size-4 text-crimson" aria-hidden />
                  <h3 className="mt-1 font-headline text-[16px] font-bold leading-snug text-ink group-hover:text-crimson">
                    {s.titleNe}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-relaxed text-ink-soft">{s.deckNe}</p>
                </a>
              ))}
            </div>
          )}
        </section>

        {/* Newsletter + privacy note */}
        <section className="mt-12 mb-16 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-rule bg-surface-soft p-5">
            <h3 className="flex items-center gap-2 font-headline text-[16px] font-bold text-ink">
              <Mail className="size-4 text-crimson" aria-hidden /> साँझ ब्रिफिङ
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              हरेक साँझ दिनका ५ मुख्य समाचार इमेलमा। खातासँगै सदस्यता लिन सकिन्छ; कुनै पनि समय निकाल्न सकिन्छ।
            </p>
            <a href={href('/#footer-newsletter')} className="mt-3 inline-block font-headline text-[13.5px] font-bold text-crimson hover:underline">
              ब्रिफिङ सदस्यता →
            </a>
          </div>
          <div className="rounded-md border border-rule bg-surface-soft p-5">
            <h3 className="flex items-center gap-2 font-headline text-[16px] font-bold text-ink">
              <MessageCircle className="size-4 text-crimson" aria-hidden /> गोपनीयता
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
              पासवर्ड स्क्रिप्ट-ह्यास भएर राखिन्छ; सेसन कुकी httpOnly। पढाइ-इतिहास जस्ता तथ्याङ्क कसरी
              प्रयोग हुन्छन्, सबै खुला छ।
            </p>
            <a href={href('/privacy')} className="mt-3 inline-block font-headline text-[13.5px] font-bold text-crimson hover:underline">
              गोपनीयता नीति →
            </a>
          </div>
        </section>
      </div>
    </main>
  )
}
