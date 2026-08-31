'use client'

/**
 * सदस्यता (Subscribe) — plans, demo checkout, what membership unlocks,
 * and honest disclosure of the payment-gateway wiring state.
 */

import { useState } from 'react'
import { Check, Crown, Loader2 } from 'lucide-react'
import { container, PageHead } from './PatroView'
import { href, go } from '@/lib/news/router'
import { useMe } from '@/lib/news/auth-store'
import { usePaywall, subscribe } from '@/lib/news/paywall-store'
import { toDevanagari } from '@/lib/news/patro'

interface Plan {
  id: 'monthly' | 'yearly' | 'patron'
  labelNe: string
  priceNpr: number
  perNe: string
  noteNe: string
  perksNe: string[]
  highlight?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'monthly',
    labelNe: 'मासिक',
    priceNpr: 300,
    perNe: 'प्रति महिना',
    noteNe: 'जहिले पनि रद्द गर्न सकिन्छ।',
    perksNe: ['प्रिमियम कथा असीमित', 'विज्ञापन-न्यून अनुभव', 'सेभ यन्त्रमा सिन्क'],
  },
  {
    id: 'yearly',
    labelNe: 'वार्षिक',
    priceNpr: 2500,
    perNe: 'प्रति वर्ष',
    noteNe: 'दुई महिना निःशुल्क — एक तिर्ने।',
    perksNe: ['मासिकका सबै सुविधा', 'साँझ ब्रिफिङ निःशुल्क', 'तुरुन्तै सुरु हुने'],
    highlight: true,
  },
  {
    id: 'patron',
    labelNe: 'संरक्षक',
    priceNpr: 5000,
    perNe: 'प्रति वर्ष',
    noteNe: 'संरक्षक समुदायको सदस्य।',
    perksNe: ['वार्षिकका सबै सुविधा', 'आभार पृष्ठमा नाम', 'सम्पादकसँग वार्षिक संवाद'],
  },
]

export default function SubscribeView({ onOpenAccount }: { onOpenAccount: () => void }) {
  const { me } = useMe()
  const paywall = usePaywall()
  const [busy, setBusy] = useState<'monthly' | 'yearly' | 'patron' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function pick(plan: Plan['id']) {
    setError(null)
    if (!me) {
      onOpenAccount()
      return
    }
    setBusy(plan)
    const result = await subscribe(plan, 'demo')
    setBusy(null)
    if (!result.ok) {
      setError(result.errorNe ?? 'सदस्यता लिन सकिएन।')
      return
    }
    setDone(true)
    paywall.refresh()
  }

  return (
    <main id="main">
      <div className={container}>
        <PageHead
          kicker="पाठक सहयोग"
          title="नागरिक वाच सदस्य बन्नुहोस्"
          sub="विज्ञापनमा मात्र भर पर्दा समाचार निर्णय बिक्रीका लागि निक्लिन सक्छन्। पाठकको सीधा सहयोगले स्वतन्त्र पत्रकारिता टिक्छ — र मुख्य समाचार त सधैं निःशुल्क नै रहन्छन्।"
        />

        {paywall.subscribed && !done && (
          <div className="mt-6 rounded-md border border-green/50 bg-green/5 p-4">
            <p className="flex items-center gap-2 font-headline text-[15px] font-bold text-green">
              <Crown className="size-4" aria-hidden /> तपाईं पहिले नै सक्रिय सदस्य हुनुहुन्छ। धन्यवाद!
            </p>
          </div>
        )}

        {done && (
          <div className="mt-6 rounded-md border-2 border-green bg-green/5 p-5">
            <p className="font-headline text-[18px] font-extrabold text-green">सदस्यता सक्रिय भयो!</p>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              (डेमो मोड) eSewa/Khalti जडान भएपछि यहीँबाट वास्तविक भुक्तानी हुनेछ।
            </p>
            <a
              href={href('/')}
              className="mt-3 inline-block rounded-sm bg-crimson px-4 py-2 font-headline text-[14px] font-bold text-white hover:bg-crimson-deep"
            >
              समाचार पढ्न फर्कनुहोस्
            </a>
          </div>
        )}

        {/* Plans */}
        <div className="grid gap-6 py-10 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-md border p-6 ${
                plan.highlight ? 'border-2 border-crimson bg-surface-soft shadow-sm' : 'border-rule bg-paper'
              }`}
            >
              {plan.highlight && (
                <p className="mb-2 self-start rounded-sm bg-crimson px-2.5 py-1 font-headline text-[11.5px] font-bold uppercase text-white">
                  धेरैले रोजेको
                </p>
              )}
              <h2 className="font-headline text-[22px] font-extrabold text-ink">{plan.labelNe}</h2>
              <p className="mt-2 font-headline text-[36px] font-black leading-none text-ink">
                रु. {toDevanagari(plan.priceNpr)}
              </p>
              <p className="mt-1 text-[12.5px] text-ink-faint">{plan.perNe}</p>
              <ul className="mt-4 flex-1 space-y-2.5">
                {plan.perksNe.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-ink-soft">
                    <Check className="mt-0.5 size-4 shrink-0 text-crimson" aria-hidden /> {perk}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[12px] text-ink-faint">{plan.noteNe}</p>
              <button
                type="button"
                disabled={busy !== null || paywall.subscribed}
                onClick={() => pick(plan.id)}
                className={`mt-5 rounded-sm px-5 py-2.5 font-headline text-[15px] font-bold disabled:opacity-60 ${
                  plan.highlight
                    ? 'bg-crimson text-white hover:bg-crimson-deep'
                    : 'border border-rule-strong text-ink hover:border-crimson hover:text-crimson'
                }`}
              >
                {busy === plan.id ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden /> प्रक्रियामा…
                  </span>
                ) : paywall.subscribed ? (
                  'सक्रिय छ'
                ) : (
                  'छान्नुहोस्'
                )}
              </button>
            </div>
          ))}
        </div>

        {error && <p className="text-[13.5px] font-bold text-crimson">{error}</p>}

        {/* Honest payment disclosure */}
        <section className="mb-6 rounded-md border border-rule bg-surface-soft p-5">
          <h3 className="font-headline text-[16px] font-bold text-ink">भुक्तानीको इमानदार नोट</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            हाल सदस्यता डेमो मोडमा चलिरहेको छ — बटन थिच्दा खाता तुरुन्तै सक्रिय हुन्छ, कुनै पैसा निक्लँदैन।
            उत्पादनमा eSewa/Khaltि गेटवे जोड्न एउटा कोड परिवर्तन र व्यापारिक खाता चाहिन्छ; जडानको
            गाइड डेभलपर कागजातमा छ। बैंक स्थानान्तरण र वार्षिक संस्थागत सदस्यता पनि सम्भव छ।
          </p>
        </section>

        {/* What stays free */}
        <section className="mb-16 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-rule p-5">
            <h3 className="font-headline text-[16px] font-bold text-ink">सधैं निःशुल्क रहने</h3>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
              <li>— विपद् चेतावनी, सुरक्षा जानकारी र विपद् केन्द्र</li>
              <li>— तथ्य जाँच प्रतिवेदन</li>
              <li>— मुख्य ब्रेकिङ समाचार र मुख्य पृष्ठ</li>
              <li>— पात्रो, बजार डाटा र उपकरण</li>
            </ul>
          </div>
          <div className="rounded-md border border-rule p-5">
            <h3 className="font-headline text-[16px] font-bold text-ink">सदस्यका लागि मात्र</h3>
            <ul className="mt-2 space-y-1.5 text-[13px] leading-relaxed text-ink-soft">
              <li>— गहन रिपोर्टिङ र अनुसन्धान (प्रिमियम बिल्ला)</li>
              <li>— दीर्घ विश्लेषण र विशेष सिरिज</li>
              <li>— विज्ञापन-न्यून पढाइ अनुभव</li>
              <li>— साँझ ब्रिफिङ इमेल</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
