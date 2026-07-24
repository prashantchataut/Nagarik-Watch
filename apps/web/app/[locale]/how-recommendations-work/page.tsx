import type { Metadata } from 'next'
import Link from 'next/link'
import type { Locale } from '@nagarikwatch/db'
import { asLocale, localizeHref } from '@/lib/i18n/locales'

export const metadata: Metadata = {
  title: 'सिफारिस कसरी काम गर्छ',
  description: 'नागरिक वाचले सिफारिस समाचार र सूचना कसरी क्रमबद्ध गर्छ।',
}

const stages = [
  {
    number: '01',
    titleNe: 'पहिला योग्य समाचार मात्र',
    titleEn: 'Eligibility before ranking',
    bodyNe: 'प्रकाशित वा अद्यावधिक, मान्य मिति भएको र सिफारिसबाट नहटाइएको समाचार मात्र सूचीमा प्रवेश गर्छ। प्रायोजित सामग्री स्वतः हटाइन्छ।',
    bodyEn: 'Only published or updated stories with valid dates and recommendation permission enter the pool. Sponsored content is excluded by default.',
  },
  {
    number: '02',
    titleNe: 'तपाईंले स्पष्ट रूपमा छानेका संकेत',
    titleEn: 'Your explicit choices',
    bodyNe: 'पछ्याइएका विभाग, विषय, प्रदेश र पत्रकार सबैभन्दा स्पष्ट व्यक्तिगत संकेत हुन्। यी छनोट पाठक डेस्कबाट परिवर्तन वा हटाउन सकिन्छ।',
    bodyEn: 'Followed desks, topics, provinces and journalists are the clearest personal signals. You can change or remove them from your reader desk.',
  },
  {
    number: '03',
    titleNe: 'पढाइको सन्दर्भ, तर सीमित रूपमा',
    titleEn: 'Reading context, with limits',
    bodyNe: 'सुरक्षित समाचार, पूरा पढिएको अवस्था, हालको पढाइ र ताजापनले क्रम मिलाउँछन्। हालै पढिएको समाचार ४८ घण्टा दोहोरिँदैन।',
    bodyEn: 'Saved stories, completion, current-session context and freshness tune order. Recently read stories are held back for 48 hours.',
  },
  {
    number: '04',
    titleNe: 'विविधता अन्तिम चरणमा',
    titleEn: 'Diversity at the final step',
    bodyNe: 'एउटै विभाग, पत्रकार वा स्रोतले पूरा सूची नओगटोस् भनेर सीमा लगाइन्छ। ब्रेकिङ चिन्हले सानो सम्पादकीय महत्त्व संकेत मात्र थप्छ।',
    bodyEn: 'Caps prevent one desk, journalist or source from dominating. A breaking flag adds only a small editorial-priority signal.',
  },
] as const

export default async function RecommendationExplanationPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale: Locale = asLocale((await params).locale)
  const english = locale === 'en'
  const lang = english ? 'en' : 'ne'

  return (
    <main className="algorithm-page" lang={lang}>
      <header className="algorithm-page__hero">
        <p className="editorial-kicker" lang="en">Reader accountability</p>
        <h1>{english ? 'Why this story appears next' : 'यो समाचार किन अर्को देखिन्छ'}</h1>
        <p>{english
          ? 'Nagarik Watch uses a deterministic, explainable ranking system called nw-hybrid-v2. It is not a generative-AI feed and it does not invent reader interests.'
          : 'नागरिक वाचले nw-hybrid-v2 नामको स्पष्ट र परीक्षण गर्न मिल्ने क्रम प्रणाली प्रयोग गर्छ। यो generative-AI feed होइन र पाठकको रुचि आफैँ कल्पना गर्दैन।'}</p>
        <div className="algorithm-page__actions">
          <Link href={localizeHref(locale, '/reader-corner')}>{english ? 'Open my reader desk' : 'मेरो पाठक डेस्क खोल्नुहोस्'}</Link>
          <Link href={localizeHref(locale, '/privacy')}>{english ? 'Read the privacy policy' : 'गोपनीयता नीति पढ्नुहोस्'}</Link>
        </div>
      </header>

      <section className="algorithm-flow" aria-labelledby="ranking-flow-title">
        <div className="algorithm-section-heading">
          <p className="editorial-kicker" lang="en">Ranking flow</p>
          <h2 id="ranking-flow-title">{english ? 'Four auditable decisions' : 'जाँच्न मिल्ने चार निर्णय'}</h2>
        </div>
        <ol>
          {stages.map((stage) => (
            <li key={stage.number}>
              <span aria-hidden="true">{stage.number}</span>
              <div>
                <h3>{english ? stage.titleEn : stage.titleNe}</h3>
                <p>{english ? stage.bodyEn : stage.bodyNe}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="algorithm-page__grid">
        <section className="algorithm-ledger" aria-labelledby="signals-title">
          <div className="algorithm-section-heading">
            <p className="editorial-kicker" lang="en">Signals</p>
            <h2 id="signals-title">{english ? 'What can affect your order' : 'क्रममा असर गर्न सक्ने कुरा'}</h2>
          </div>
          <dl>
            <div><dt>{english ? 'Explicit follows' : 'स्पष्ट पछ्याइ'}</dt><dd>{english ? 'Desks, topics, provinces and journalists you select.' : 'तपाईंले छानेका विभाग, विषय, प्रदेश र पत्रकार।'}</dd></div>
            <div><dt>{english ? 'Reading completion' : 'पढाइ पूरा'}</dt><dd>{english ? 'Finished stories carry more signal than quickly abandoned ones.' : 'पूरा पढिएको समाचारले तुरुन्त छोडिएको समाचारभन्दा बढी संकेत दिन्छ।'}</dd></div>
            <div><dt>{english ? 'Saved stories' : 'सुरक्षित समाचार'}</dt><dd>{english ? 'A save is treated as stronger intent than an accidental open.' : 'सुरक्षित गर्नु आकस्मिक खोलाइभन्दा बलियो रुचि मानिन्छ।'}</dd></div>
            <div><dt>{english ? 'Freshness' : 'ताजापन'}</dt><dd>{english ? 'Recent reporting gets a decaying score rather than a permanent boost.' : 'नयाँ समाचारको अंक समयसँग घट्छ; स्थायी बढावा दिइँदैन।'}</dd></div>
          </dl>
        </section>

        <section className="algorithm-ledger" aria-labelledby="guardrails-title">
          <div className="algorithm-section-heading">
            <p className="editorial-kicker" lang="en">Guardrails</p>
            <h2 id="guardrails-title">{english ? 'What the system refuses to do' : 'प्रणालीले नगर्ने कुरा'}</h2>
          </div>
          <ul>
            <li>{english ? 'No collaborative filtering or “people like you” profiling.' : '“तपाईं जस्तै मानिस” भन्ने collaborative profiling छैन।'}</li>
            <li>{english ? 'No embedding or opaque semantic similarity claims.' : 'embedding वा अपारदर्शी semantic similarity दाबी छैन।'}</li>
            <li>{english ? 'No sponsored story inside editorial recommendations by default.' : 'सम्पादकीय सिफारिसमा प्रायोजित समाचार स्वतः मिसिँदैन।'}</li>
            <li>{english ? 'No future-dated, retracted or do-not-recommend story.' : 'भविष्य मितिको, फिर्ता लिइएको वा रोकिएको समाचार देखिँदैन।'}</li>
            <li>{english ? 'No selling recommendation profiles to advertisers.' : 'सिफारिस प्रोफाइल विज्ञापनदातालाई बेचिँदैन।'}</li>
          </ul>
        </section>
      </div>

      <section className="algorithm-alerts" aria-labelledby="alert-policy-title">
        <div className="algorithm-section-heading">
          <p className="editorial-kicker" lang="en">Notification policy</p>
          <h2 id="alert-policy-title">{english ? 'An alert must earn the interruption' : 'सूचनाले अवरोध गर्ने कारण कमाउनुपर्छ'}</h2>
        </div>
        <div>
          <p>{english
            ? 'Breaking alerts, followed-topic alerts and followed-journalist alerts are evaluated separately. Quiet hours use your device timezone. Non-urgent alerts wait during quiet hours, and per-reader cooldowns and daily limits prevent repeated interruptions.'
            : 'ब्रेकिङ, पछ्याइएको विषय र पछ्याइएको पत्रकारका सूचना छुट्टाछुट्टै जाँचिन्छन्। शान्त समय तपाईंको उपकरणको समय क्षेत्रअनुसार हुन्छ। गैर-तत्काल सूचना शान्त समयमा रोकिन्छ र cooldown तथा दैनिक सीमाले दोहोरिने अवरोध रोक्छ।'}</p>
          <dl>
            <div><dt>{english ? 'Daily ceiling' : 'दैनिक सीमा'}</dt><dd>8</dd></div>
            <div><dt>{english ? 'Breaking cooldown' : 'ब्रेकिङ अन्तराल'}</dt><dd>15 {english ? 'min' : 'मिनेट'}</dd></div>
            <div><dt>{english ? 'Topic cooldown' : 'विषय अन्तराल'}</dt><dd>45 {english ? 'min' : 'मिनेट'}</dd></div>
            <div><dt>{english ? 'Retry cap' : 'पुनः प्रयास सीमा'}</dt><dd>5</dd></div>
          </dl>
        </div>
      </section>
    </main>
  )
}
