import Link from 'next/link'
import { asLocale, localizeHref } from '@/lib/i18n/locales'
import { articlesBatch1 } from '@/lib/content/seed/articles-1'
import { articlesBatch2 } from '@/lib/content/seed/articles-2'
import { articlesBatch3 } from '@/lib/content/seed/articles-3'
import { categories } from '@/lib/content/seed/categories'
import { AdSlot } from '@/components/AdSlot'
const articles=[...articlesBatch1,...articlesBatch2,...articlesBatch3]
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
 const locale=asLocale((await params).locale); const en=locale==='en'; const visible=en?articles.filter(a=>a.hasEnglish):articles; const lead=visible[0];
 return <div className="news-home"><AdSlot locale={locale} placementKey="home-top"/><AdSlot locale={locale} placementKey="home-billboard" variant="billboard"/>
  <section className="news-hero">
   <div><p className="section-kicker">{en?'Independent. Useful. Nepali.':'स्वतन्त्र। उपयोगी। नेपाली।'}</p><h1>{en?'News that helps you understand Nepal':'नेपाल बुझ्न सघाउने समाचार'}</h1><p>{en?'Reporting across politics, society, economy, sport, technology and daily life.':'राजनीति, समाज, अर्थतन्त्र, खेल, प्रविधि र दैनिक जीवनका समाचार।'}</p></div>
   <div className="news-hero__utility"><AdSlot locale={locale} placementKey="home-hero-rail" variant="rail"/><strong>{en?'Public service':'जनसेवा'}</strong><Link href={localizeHref(locale,'/utilities/date-converter')}>{en?'Convert BS and AD dates':'बि.सं. र इस्वी मिति बदल्नुहोस्'}</Link><Link href={localizeHref(locale,'/disaster-alerts')}>{en?'Check disaster alerts':'विपद् सूचना हेर्नुहोस्'}</Link></div>
  </section>
  {lead&&<section className="lead-story"><div className="lead-story__image"><img src={lead.heroImage?.url} alt={lead.heroImage?.alt||''}/></div><div><p className="section-kicker">{en?lead.category.nameEn:lead.category.nameNe}</p><h2><Link href={localizeHref(locale,`/${lead.category.slug}/${lead.slug}`)}>{en&&lead.titleEn?lead.titleEn:lead.titleNe}</Link></h2><p>{en&&lead.deckEn?lead.deckEn:lead.deckNe}</p><span>{lead.byline}</span></div></section>}
  <section className="story-river">{visible.slice(1,13).map(a=><article key={a.id}><img src={a.heroImage?.url} alt={a.heroImage?.alt||''}/><div><p className="section-kicker">{en?a.category.nameEn:a.category.nameNe}</p><h2><Link href={localizeHref(locale,`/${a.category.slug}/${a.slug}`)}>{en&&a.titleEn?a.titleEn:a.titleNe}</Link></h2><p>{en&&a.deckEn?a.deckEn:a.deckNe}</p></div></article>)}</section>
  <AdSlot locale={locale} placementKey="home-mid" variant="inline"/><section className="category-index"><h2>{en?'Explore every desk':'सबै विभाग हेर्नुहोस्'}</h2>{categories.map(c=><Link key={c.slug} href={localizeHref(locale,`/${c.slug}`)}><strong>{en?c.nameEn:c.nameNe}</strong><span>{en?c.descriptionEn:c.descriptionNe}</span></Link>)}</section>
 </div>
}
