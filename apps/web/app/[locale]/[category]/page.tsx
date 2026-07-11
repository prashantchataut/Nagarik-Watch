import Link from 'next/link'
import { notFound } from 'next/navigation'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { categories } from '@/lib/content/seed/categories'
import { articlesBatch1 } from '@/lib/content/seed/articles-1'
import { articlesBatch2 } from '@/lib/content/seed/articles-2'
import { AdSlot } from '@/components/AdSlot'
import { articlesBatch3 } from '@/lib/content/seed/articles-3'
const articles=[...articlesBatch1,...articlesBatch2,...articlesBatch3]
export default async function CategoryPage({params}:{params:Promise<{locale:string;category:string}>}){const {locale:raw,category}=await params;const locale=asLocale(raw);const en=locale==='en';const cat=categories.find(c=>c.slug===category);if(!cat)notFound();const list=articles.filter(a=>a.category.slug===category&&(!en||a.hasEnglish));return <div className="section-page"><AdSlot locale={locale} placementKey="category-top"/><header><p className="section-kicker">{en?'News desk':'समाचार विभाग'}</p><h1>{en?cat.nameEn:cat.nameNe}</h1><p>{en?cat.descriptionEn:cat.descriptionNe}</p></header><div className="story-river">{list.map(a=><article key={a.id}><img src={a.heroImage?.url} alt={a.heroImage?.alt||''}/><div><p className="section-kicker">{a.byline}</p><h2><Link href={localizeHref(locale,`/${category}/${a.slug}`)}>{en&&a.titleEn?a.titleEn:a.titleNe}</Link></h2><p>{en&&a.deckEn?a.deckEn:a.deckNe}</p></div></article>)}<AdSlot locale={locale} placementKey="category-inline" variant="inline"/></div>{!list.length&&<p className="empty-news">{en?'No reviewed stories are available yet.':'यो विभागमा सामग्री चाँडै थपिँदैछ।'}</p>}</div>}
