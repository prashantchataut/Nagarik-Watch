import type { ArticleBlock } from '@nagarikwatch/db'
import type { StoredArticle } from './json-store'

function p(text: string): ArticleBlock {
  return { type: 'paragraph', text }
}

function h2(text: string): ArticleBlock {
  return { type: 'heading2', text }
}

function isoDaysAgo(days: number, hour = 8): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  d.setUTCHours(hour, 15, 0, 0)
  return d.toISOString()
}

/**
 * Original Nagarik Watch starter edition — manageable via /admin/articles.
 * Not scraped from other outlets; editors can edit/replace these from the newsroom.
 */
export function buildOriginalStarterArticles(createdBy = 'newsroom-boot'): StoredArticle[] {
  const base = (
    partial: Pick<
      StoredArticle,
      'id' | 'slug' | 'categorySlug' | 'titleNe' | 'bodyNe' | 'publishedAt' | 'updatedAt'
    > &
      Partial<StoredArticle>,
  ): StoredArticle => {
    const bodyNe = partial.bodyNe
    const words = bodyNe
      .map((b) => ('text' in b ? b.text : ''))
      .join(' ')
      .split(/\s+/)
      .filter(Boolean).length
    return {
      authorIds: ['aut-newsroom-desk'],
      tagSlugs: [],
      isBreaking: false,
      isFeatured: 'none',
      workflowStage: 'published',
      sourceType: 'original',
      premium: false,
      commentsEnabled: true,
      locale: 'ne',
      noIndex: false,
      includeInNewsSitemap: true,
      ...partial,
      hasEnglish: Boolean(partial.titleEn && partial.bodyEn?.length),
      readingMinutes: Math.max(1, Math.round(words / 200)),
      createdBy,
      updatedBy: createdBy,
    }
  }

  return [
    base({
      id: 'art-nw-lead-monsoon',
      slug: 'monsoon-preparedness-kathmandu-valley-2026',
      categorySlug: 'society',
      titleNe: 'काठमाडौं उपत्यकामा मनसुन पूर्वतयारी: नाली सफाइ र बाढी जोखिम क्षेत्र',
      titleEn: 'Kathmandu Valley monsoon readiness: drains and flood hotspots',
      deckNe: 'महानगरहरूले नाली सफाइ तीव्र पारेका छन्। उच्च जोखिम बस्तीमा उद्धार टोली तयारी अवस्थामा छन्।',
      deckEn: 'Municipalities stepped up drain clearing; rescue teams are on standby in high-risk settlements.',
      publishedAt: isoDaysAgo(0, 6),
      updatedAt: isoDaysAgo(0, 6),
      isFeatured: 'lead',
      isBreaking: true,
      bodyNe: [
        p('काठमाडौं, ललितपुर र भक्तपुर महानगरपालिकाले मनसुनअघि नाली र ढल सफाइ अभियान तेज पारेका छन्। नागरिक वाचले स्थलगत भ्रमणमा उपत्यकाका घना बस्तीमा पानी जम्ने समस्या दोहोरिएको भेट्टायो।'),
        h2('जोखिम बस्ती'),
        p('बागमती किनारका केही बस्तीमा बाढीको पूर्व चेतावनी प्रणाली सक्रिय छ। स्थानीय वडाले रातको समयमा सूचना प्रवाह गर्ने संयन्त्र तयार पारेको जनाएको छ।'),
        p('नागरिक वाचले पाठकलाई आग्रह गर्छ — आफ्नो वडाको आपत्कालीन सम्पर्क नम्बर नोट गर्नुहोस् र नालीमा फोहोर नफाल्नुहोस्।'),
      ],
      bodyEn: [
        p('Kathmandu, Lalitpur and Bhaktapur municipalities intensified drain clearing ahead of the monsoon. On the ground, Nagarik Watch found recurring waterlogging in dense neighbourhoods.'),
        h2('At-risk settlements'),
        p('Flood early-warning systems are active along parts of the Bagmati corridor. Ward offices say overnight information chains are in place.'),
      ],
      tagSlugs: ['monsoon', 'kathmandu'],
      reportingLocation: 'काठमाडौं उपत्यका',
    }),
    base({
      id: 'art-nw-politics-house',
      slug: 'parliament-monsoon-session-agenda',
      categorySlug: 'politics',
      titleNe: 'मनसुन अधिवेशन: बजेट कार्यान्वयन र बिल प्राथमिकतामा',
      titleEn: 'Monsoon session: budget delivery and bill priorities',
      deckNe: 'सङ्घीय संसदको अधिवेशनमा सरकारको प्राथमिकतासूची र विपक्षी दलको रणनीति स्पष्ट हुँदैछ।',
      publishedAt: isoDaysAgo(1, 9),
      updatedAt: isoDaysAgo(1, 9),
      isFeatured: 'secondary',
      bodyNe: [
        p('संसद् सचिवालय स्रोतअनुसार मनसुन अधिवेशनमा बजेट कार्यान्वयनसँग जोडिएका विधेयकहरूलाई प्राथमिकता दिने तयारी छ।'),
        p('विपक्षी दलहरूले सार्वजनिक खरिद र पारदर्शितासम्बन्धी छलफल खोज्ने संकेत गरेका छन्। नागरिक वाचले दलगत धारणा माग्ने क्रम जारी राख्नेछ।'),
      ],
      bodyEn: [
        p('Parliamentary sources say the monsoon session will prioritise bills tied to budget delivery.'),
        p('Opposition parties signalled interest in debates on public procurement and transparency.'),
      ],
      tagSlugs: ['parliament'],
      reportingLocation: 'काठमाडौं',
    }),
    base({
      id: 'art-nw-business-nepse',
      slug: 'nepse-week-ahead-liquidity-watch',
      categorySlug: 'business',
      titleNe: 'सेयर बजार: तरलता र बैंक ब्याजदरको असर',
      titleEn: 'Share market: liquidity and rate pressure ahead',
      deckNe: 'लगानीकर्ताले बैंक ब्याज र विदेशी मुद्रा सञ्चितिको संकेत नियाल्दै छन्।',
      publishedAt: isoDaysAgo(1, 11),
      updatedAt: isoDaysAgo(1, 11),
      isFeatured: 'secondary',
      bodyNe: [
        p('नेप्से परिसूचक हप्ताभरि संकुचित दायरामा किनबेच भएको थियो। ब्रोकर हाउसहरूले तरलताको अवस्था हेरेर कारोबार गर्ने सल्लाह दिएका छन्।'),
        p('नागरिक वाचको बजार डेस्कले साप्ताहिक सारांशलाई अद्यावधिक गर्दै जानेछ — स्रोत: नेप्से तथ्यांक र खुला बजार जानकारी।'),
      ],
      bodyEn: [
        p('NEPSE traded in a narrow range through the week. Brokerages advised watching liquidity before sizing positions.'),
      ],
      tagSlugs: ['nepse', 'markets'],
      reportingLocation: 'काठमाडौं',
    }),
    base({
      id: 'art-nw-sports-cricket',
      slug: 'nepal-cricket-domestic-league-preview',
      categorySlug: 'sports',
      titleNe: 'घरेलु क्रिकेट लिग: युवा खेलाडीको अवसर',
      titleEn: 'Domestic cricket league: a lane for young players',
      deckNe: 'बोर्डले घरेलु सिजनको तालिका सार्वजनिक गर्दै गर्दा युवा खेलाडीको प्रदर्शनलाई प्राथमिक मूल्यांकनमा राखिएको छ।',
      publishedAt: isoDaysAgo(2, 10),
      updatedAt: isoDaysAgo(2, 10),
      bodyNe: [
        p('क्रिकेट संघले घरेलु प्रतियोगिताको तालिका अगाडि सारेको छ। प्रशिक्षकहरूले फिटनेस र फिल्डिङमा जोड दिएका छन्।'),
        p('नागरिक वाच खेल डेस्कले मैदानबाटै अपडेट दिनेछ।'),
      ],
      bodyEn: [
        p('The cricket board brought forward the domestic calendar. Coaches are stressing fitness and fielding.'),
      ],
      tagSlugs: ['cricket'],
      reportingLocation: 'कीर्तिपुर',
    }),
    base({
      id: 'art-nw-world-climate',
      slug: 'himalaya-climate-report-briefing',
      categorySlug: 'world',
      titleNe: 'हिमाली जलवायु: हिउँ पग्लने दर र तराईको जोखिम',
      titleEn: 'Himalayan climate: melt rates and Tarai risk',
      deckNe: 'वैज्ञानिकहरूले हिउँ पग्लने गति र तल्लो तटीय बाढी जोखिमबीचको सम्बन्ध दोहोर्याएका छन्।',
      publishedAt: isoDaysAgo(2, 14),
      updatedAt: isoDaysAgo(2, 14),
      bodyNe: [
        p('अन्तर्राष्ट्रिय अध्ययनले हिमालय क्षेत्रमा तापक्रम वृद्धि र हिउँ पग्लने दर उल्लेख गरेको छ। नेपालका नदी प्रणालीमा यसको प्रभाव दीर्घकालीन छ।'),
        p('नागरिक वाचले पाठकलाई वैज्ञानिक स्रोतसहित सारांश दिन्छ — विस्तृत अनुसन्धान मूल स्रोतबाट हेर्नुहोस्, हामी कपी गर्दैनौं।'),
      ],
      bodyEn: [
        p('International research again flagged Himalayan warming and snowmelt. Downstream river basins in Nepal face longer-term risks.'),
      ],
      tagSlugs: ['climate'],
      reportingLocation: 'काठमाडौं',
    }),
    base({
      id: 'art-nw-opinion-local',
      slug: 'editorial-local-government-accountability',
      categorySlug: 'opinion',
      titleNe: 'सम्पादकीय: स्थानीय सरकारको जवाफदेहिता',
      titleEn: 'Editorial: accountability in local government',
      deckNe: 'वडाको बजेट पारदर्शितामाथि पाठकको प्रश्न बढ्दो छ।',
      publishedAt: isoDaysAgo(3, 7),
      updatedAt: isoDaysAgo(3, 7),
      bodyNe: [
        p('स्थानीय सरकार नजिकको सरकार हो। तर बजेटको सार्वजनिक सूचना अपर्याप्त हुँदा विश्वास कमजोर हुन्छ।'),
        p('नागरिक वाचको धारणा हो — प्रत्येक वडाले त्रैमासिक खर्च सार्वजनिक गर्नुपर्छ। यो सम्पादकीय हो, समाचार रिपोर्ट होइन।'),
      ],
      bodyEn: [
        p('Local government is closest to citizens. When budget disclosure lags, trust thins.'),
        p('Nagarik Watch’s view: every ward should publish quarterly spending. This is an editorial, not a news report.'),
      ],
      tagSlugs: ['editorial'],
      reportingLocation: 'काठमाडौं',
    }),
    base({
      id: 'art-nw-tech-digital',
      slug: 'digital-public-services-access-gap',
      categorySlug: 'technology',
      titleNe: 'डिजिटल सेवा: पहुँचको खाडल घटाउने चुनौती',
      titleEn: 'Digital services: closing the access gap',
      deckNe: 'ई-गभर्नेन्स सेवा शहरमुखी रहँदा गाउँको पहुँच अपूर्ण छ।',
      publishedAt: isoDaysAgo(3, 12),
      updatedAt: isoDaysAgo(3, 12),
      bodyNe: [
        p('सरकारी अनलाइन सेवा विस्तार भए पनि ब्यान्डविथ र डिजिटल साक्षरता असमान छ। नागरिक वाचले प्रदेशस्तरका सेवा केन्द्रको अनुभव सङ्कलन गरेको छ।'),
      ],
      bodyEn: [
        p('Online public services expanded, but bandwidth and digital literacy remain uneven. Nagarik Watch gathered province-level service desk experiences.'),
      ],
      tagSlugs: ['digital'],
      reportingLocation: 'बागमती',
    }),
    base({
      id: 'art-nw-health-hospital',
      slug: 'public-hospital-waiting-lists-update',
      categorySlug: 'health',
      titleNe: 'सार्वजनिक अस्पताल: प्रतीक्षा सूची र औषधि आपूर्ति',
      titleEn: 'Public hospitals: waiting lists and medicine supply',
      deckNe: 'विशेषज्ञ सेवाको प्रतीक्षा र अत्यावश्यक औषधिको स्टक दबाबमा छ।',
      publishedAt: isoDaysAgo(4, 8),
      updatedAt: isoDaysAgo(4, 8),
      bodyNe: [
        p('काठमाडौंका प्रमुख सार्वजनिक अस्पतालमा बाह्य बिरामी सेवाको भीड बढेको छ। प्रशासनले शिफ्ट थपेर व्यवस्थापन गर्ने योजना सुनाएको छ।'),
        p('नागरिक वाचले बिरामी र स्वास्थ्यकर्मी दुवैसँग कुरा गरेको छ — व्यक्तिगत पहिचान सार्वजनिक गरिएको छैन।'),
      ],
      bodyEn: [
        p('Major public hospitals in Kathmandu reported heavier OPD loads. Administrators say they plan extra shifts.'),
      ],
      tagSlugs: ['health'],
      reportingLocation: 'काठमाडौं',
    }),
  ]
}
