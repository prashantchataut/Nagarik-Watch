import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { AdSlot } from '@/components/AdSlot'
import { articlesBatch1 } from '@/lib/content/seed/articles-1'
import { articlesBatch2 } from '@/lib/content/seed/articles-2'
import { articlesBatch3 } from '@/lib/content/seed/articles-3'
const all=[...articlesBatch3,...articlesBatch2,...articlesBatch1]
export default async function Trending({params}:{params:Promise<{locale:string}>}){const locale=asLocale((await params).locale),en=locale==='en',list=en?all.filter(a=>a.hasEnglish):all;return <div className="section-page"><AdSlot locale={locale} placementKey="trending-top"/><header><p className="section-kicker">{en?'Reader interest':'पाठक रुचि'}</p><h1>{en?'Trending':'चर्चामा'}</h1></header><div className="story-river">{list.slice(0,18).map((a,i)=><article key={a.id}><p className="section-kicker">{String(i+1).padStart(2,'0')}</p><h2><Link href={localizeHref(locale,`/${a.category.slug}/${a.slug}`)}>{en&&a.titleEn?a.titleEn:a.titleNe}</Link></h2><p>{en&&a.deckEn?a.deckEn:a.deckNe}</p></article>)}</div><AdSlot locale={locale} placementKey="trending-inline" variant="inline"/></div>}
