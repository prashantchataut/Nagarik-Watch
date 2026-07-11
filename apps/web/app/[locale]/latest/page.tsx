import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { AdSlot } from '@/components/AdSlot'
import { articlesBatch1 } from '@/lib/content/seed/articles-1'
import { articlesBatch2 } from '@/lib/content/seed/articles-2'
import { articlesBatch3 } from '@/lib/content/seed/articles-3'
const all=[...articlesBatch1,...articlesBatch2,...articlesBatch3].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt))
export default async function Latest({params}:{params:Promise<{locale:string}>}){const locale=asLocale((await params).locale),en=locale==='en',list=en?all.filter(a=>a.hasEnglish):all;return <div className="section-page"><AdSlot locale={locale} placementKey="latest-top"/><header><p className="section-kicker">{en?'News stream':'समाचार प्रवाह'}</p><h1>{en?'Latest news':'ताजा समाचार'}</h1></header><div className="story-river">{list.slice(0,24).map(a=><article key={a.id}><img src={a.heroImage?.url} alt={a.heroImage?.alt||''}/><h2><Link href={localizeHref(locale,`/${a.category.slug}/${a.slug}`)}>{en&&a.titleEn?a.titleEn:a.titleNe}</Link></h2></article>)}</div><AdSlot locale={locale} placementKey="latest-inline" variant="inline"/></div>}
