import type { Article } from '@nagarikwatch/db'
import { unsplash } from './media'

/**
 * Seed articles, batch 2: sports, entertainment, world, opinion, diaspora, plus extra
 * politics/society/business. Headlines reflect real June 2026 stories — the FIFA World Cup,
 * the Iran-US conflict over Hormuz, and ongoing Nepal beats. Intentionally mixes
 * `sourceType` — aggregated and wire entries carry the `source` block so the attribution
 * line renders and the Article source-attribution hook stays exercised. A subset have an
 * author-reviewed English version.
 */
export const articlesBatch2: Article[] = [
  // -- SPORTS (FIFA World Cup 2026 is live) ----------------------------------
  {
    id: 'art-010',
    slug: 'germany-undav-world-cup-hero',
    category: { id: 'cat-sports', slug: 'sports', nameNe: 'खेलकुद', nameEn: 'Sports' },
    categoryLabel: 'खेलकुद',
    titleNe: 'फ्याक्ट्रीको मजदुरदेखि विश्वकपको नायकसम्म: डेनिज उन्डाभ',
    titleEn: 'From factory worker to World Cup hero: Deniz Undav',
    deckNe: 'प्रशिक्षकसँगको विवादपछि चर्चामा रहेका उन्डाभ अहिले जर्मनीका लागि सबैभन्दा महत्त्वपूर्ण खेलाडी बनेका छन्।',
    heroImage: unsplash('1551958219-acbc608c6377', 'फुटबल मैदानमा खेलाडी', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'रोशन महर्जन',
    authors: [{ id: 'aut-roshan', slug: 'roshan-maharjan', name: 'रोशन महर्जन' }],
    publishedAt: '2026-06-21T03:00:00.000Z',
    hasEnglish: true,
    isBreaking: true,
    readingMinutes: 3,
    tags: [
      {
        id: 'tag-football',
        slug: 'fifa-world-cup',
        nameNe: 'फिफा विश्वकप',
        nameEn: 'FIFA World Cup',
      },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'केही समयअघिसम्म प्रशिक्षक जुलियन नागेल्सम्यानसँगको विवादका कारण चर्चामा रहेका डेनिज उन्डाभ अहिले विश्वकपमा जर्मनीका लागि सबैभन्दा महत्त्वपूर्ण खेलाडी बनेका छन्। उनले फ्याक्ट्रीमा काम गर्दै खेल सुरु गरेका थिए।',
      },
      {
        type: 'pullQuote',
        quoteNe: 'कठिन समयले नै मलाई यो स्तरसम्म पुर्यायो, म यो मौका बिर्सन्नँ।',
        attribution: 'डेनिज उन्डाभ',
      },
      {
        type: 'paragraph',
        text: 'उनको यात्राले धेरै युवा फुटबल खेलाडीलाई प्रेरणा दिएको छ। पत्रकारहरूले उनलाई यस विश्वकपको "सरप्राइज प्याकेज" भन्दै आएका छन्।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Deniz Undav, recently in the spotlight over a dispute with coach Julian Nagelsmann, has become Germany\'s most important player at the World Cup. He began his career working in a factory.',
      },
      {
        type: 'paragraph',
        text: '"The hard times got me here — I won\'t forget this chance," Undav said.',
      },
    ],
    seoDescriptionNe: 'फ्याक्ट्रीको मजदुरदेखि विश्वकपको नायकसम्मको यात्रामा डेनिज उन्डाभ।',
    seoDescriptionEn: 'Deniz Undav: from factory worker to World Cup hero for Germany.',
  },
  {
    id: 'art-011',
    slug: 'fifa-world-cup-ivory-coast-lead',
    category: { id: 'cat-sports', slug: 'sports', nameNe: 'खेलकुद', nameEn: 'Sports' },
    categoryLabel: 'खेलकुद',
    titleNe: 'विश्वकप: जर्मनीका दुई गोल बदाइए, आइभरी कोस्ट पहिलो हाफमा अघि',
    heroImage: unsplash('1522778526097-ce0a22ceb253', 'फुटबल खेलाडी', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'रोशन महर्जन',
    authors: [{ id: 'aut-roshan', slug: 'roshan-maharjan', name: 'रोशन महर्जन' }],
    publishedAt: '2026-06-20T05:00:00.000Z',
    hasEnglish: false,
    isBreaking: true,
    readingMinutes: 2,
    tags: [
      {
        id: 'tag-football',
        slug: 'fifa-world-cup',
        nameNe: 'फिफा विश्वकप',
        nameEn: 'FIFA World Cup',
      },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'फिफा विश्वकपको एक खेलमा जर्मनीका दुई गोल VAR मार्फत बदाइए, र पहिलो हाफमा आइभरी कोस्ट १-० ले अघि बढ्यो। रोमाञ्चक खेलमा दुवै टोलीले आक्रमण जारी राखे।',
      },
    ],
    seoDescriptionNe: 'विश्वकपमा जर्मनीका दुई गोल बदाइए, आइभरी कोस्ट अघि छ।',
  },
  {
    id: 'art-012',
    slug: 'athletics-record-national',
    category: { id: 'cat-sports', slug: 'sports', nameNe: 'खेलकुद', nameEn: 'Sports' },
    categoryLabel: 'खेलकुद',
    titleNe: 'राष्ट्रिय एथलेटिक्समा नयाँ रेकर्ड बन्यो',
    heroImage: unsplash('1552674605-db6ffd4facb5', 'दौड प्रतियोगिता', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'रोशन महर्जन',
    authors: [{ id: 'aut-roshan', slug: 'roshan-maharjan', name: 'रोशन महर्जन' }],
    publishedAt: '2026-06-14T02:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'राष्ट्रिय एथलेटिक्स प्रतियोगितामा महिला तीन हजार मिटर दौडमा नयाँ राष्ट्रिय रेकर्ड बनेको छ।',
      },
    ],
    seoDescriptionNe: 'राष्ट्रिय एथलेटिक्समा नयाँ रेकर्ड बनेको छ।',
  },

  // -- ENTERTAINMENT ---------------------------------------------------------
  {
    id: 'art-013',
    slug: 'film-festival-entries',
    category: {
      id: 'cat-entertainment',
      slug: 'entertainment',
      nameNe: 'मनोरञ्जन',
      nameEn: 'Entertainment',
    },
    categoryLabel: 'मनोरञ्जन',
    titleNe: 'अन्तर्राष्ट्रिय चलचित्र महोत्सवमा नेपाली चलचित्रको प्रतिनिधित्व',
    titleEn: 'Nepali films selected for the international festival',
    deckNe: 'तीन नेपाली चलचित्रले अन्तर्राष्ट्रिय महोत्सवमा प्रदर्शनको अवसर पाएका छन्।',
    heroImage: unsplash('1489599849927-2ee91cede3ba', 'चलचित्र देखाउने भवन', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'मीरा राजभण्डारी',
    authors: [{ id: 'aut-meera', slug: 'meera-rajbhandari', name: 'मीरा राजभण्डारी' }],
    publishedAt: '2026-06-18T07:00:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'तीन नेपाली चलचित्रले विदेशी चलचित्र महोत्सवको आधिकारिक चयनमा स्थान पाएका छन्। निर्देशकहरूले यसले नेपाली सिनेमाको दायरा फराकिलो बनाएको बताएका छन्।',
      },
      {
        type: 'paragraph',
        text: 'निर्देशक एकले भने, "स्थानीय कथा विश्वस्तरीय मञ्चमा पुग्नु हाम्रा कलाकारका लागि ठूलो उपलब्धि हो।"',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Three Nepali films were selected for official screenings at international festivals, widening the reach of Nepali cinema.',
      },
    ],
    seoDescriptionNe: 'नेपाली चलचित्रले अन्तर्राष्ट्रिय महोत्सवमा स्थान पाएका छन्।',
  },
  {
    id: 'art-014',
    slug: 'music-concert-summer',
    category: {
      id: 'cat-entertainment',
      slug: 'entertainment',
      nameNe: 'मनोरञ्जन',
      nameEn: 'Entertainment',
    },
    categoryLabel: 'मनोरञ्जन',
    titleNe: 'गर्मीमा सांगीतिक कार्यक्रमहरूको सुरुवात',
    heroImage: unsplash('1493225457124-a3eb161ffa5f', 'सांगीतिक मञ्च', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'मीरा राजभण्डारी',
    authors: [{ id: 'aut-meera', slug: 'meera-rajbhandari', name: 'मीरा राजभण्डारी' }],
    publishedAt: '2026-06-15T03:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'गर्मीको सुरुवातसँगै शहरभर सांगीतिक कार्यक्रमहरू सुरु भएका छन्। युवा कलाकारहरूले आफ्नो नयाँ सिर्जना सार्वजनिक गर्दै छन्।',
      },
    ],
    seoDescriptionNe: 'गर्मीमा सांगीतिक कार्यक्रमहरू सुरु भएका छन्।',
  },
  {
    id: 'art-015',
    slug: 'streaming-local-content',
    category: {
      id: 'cat-entertainment',
      slug: 'entertainment',
      nameNe: 'मनोरञ्जन',
      nameEn: 'Entertainment',
    },
    categoryLabel: 'मनोरञ्जन',
    titleNe: 'स्ट्रिमिङ प्लेटफर्ममा स्थानीय सामग्रीको उपस्थिति बढ्दो',
    heroImage: unsplash('1574267432553-4b4628081c31', 'स्ट्रिमिङ सेवा', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'मीरा राजभण्डारी',
    authors: [{ id: 'aut-meera', slug: 'meera-rajbhandari', name: 'मीरा राजभण्डारी' }],
    publishedAt: '2026-06-12T06:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'स्ट्रिमिङ प्लेटफर्महरूमा स्थानीय सामग्रीको माग बढ्दो छ। उद्योगका विश्लेषकहरूले यसले सिर्जनाको दायरा फराकिलो बनाएको बताउँछन्।',
      },
    ],
    seoDescriptionNe: 'स्ट्रिमिङ प्लेटफर्ममा स्थानीय सामग्रीको माग बढेको छ।',
  },

  // -- WORLD (wire / aggregated) — Iran-US conflict, Hormuz ------------------
  {
    id: 'art-016',
    slug: 'iran-us-hormuz-tension',
    category: { id: 'cat-world', slug: 'world', nameNe: 'विश्व', nameEn: 'World' },
    categoryLabel: 'विश्व',
    titleNe: 'इरान–अमेरिका तनाव: हर्मुज जलसन्धि अस्थिर, विश्वबजार तलमाथि',
    titleEn: 'Iran-US tension destabilises the Strait of Hormuz; markets reel',
    deckNe: 'सैन्य कार्य र हर्मुजमा अवरोधको आशंकाले तेल र शेयर बजार हल्लाइरहेको छ।',
    heroImage: unsplash('1451187580459-43490279c0fa', 'रातो आकाश, सैन्य विमान', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'एजेन्सी रिपोर्ट',
    authors: [{ id: 'aut-agency', slug: 'agency-report', name: 'एजेन्सी रिपोर्ट' }],
    publishedAt: '2026-06-21T12:00:00.000Z',
    hasEnglish: true,
    isBreaking: true,
    readingMinutes: 3,
    tags: [{ id: 'tag-geopolitics', slug: 'geopolitics', nameNe: 'भूराजनीति', nameEn: 'Geopolitics' }],
    source: {
      sourceType: 'wire',
      sourceName: 'Reuters',
      sourceUrl: 'https://www.reuters.com/',
      sourcePublishedAt: '2026-06-21T10:00:00.000Z',
    },
    bodyNe: [
      {
        type: 'paragraph',
        text: 'इरान र अमेरिकाबीचको तनाव बढेकाले हर्मुज जलसन्धि अस्थिर बनेको छ। विश्वको ठूलो हिस्सा तेल यही मार्गबाट ओसारिने भएकाले आपूर्तिमा अवरोधको आशंकाले विश्वबजार हल्लिएको छ।',
      },
      { type: 'heading2', text: 'बजारमा असर' },
      {
        type: 'paragraph',
        text: 'कच्चा तेलको मूल्य उच्च भएको छ भने शेयर बजार तलमाथि भइरहेका छन्। विश्लेषकहरूले तनाव कति दिन रहने हो त्यसैमा बजारको दिशा भर पर्ने बताएका छन्।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Rising tension between Iran and the United States has destabilised the Strait of Hormuz. With a large share of the world\'s oil flowing through it, fears of disruption have shaken global markets.',
      },
      {
        type: 'paragraph',
        text: 'Crude prices have climbed and equities have swung. Analysts say the market direction hinges on how long the stand-off lasts.',
      },
    ],
    seoDescriptionNe: 'इरान–अमेरिका तनावले हर्मुज जलसन्धि अस्थिर बनाएको छ।',
    seoDescriptionEn: 'Iran-US tension has destabilised the Strait of Hormuz.',
  },
  {
    id: 'art-017',
    slug: 'regional-trade-pact',
    category: { id: 'cat-world', slug: 'world', nameNe: 'विश्व', nameEn: 'World' },
    categoryLabel: 'विश्व',
    titleNe: 'क्षेत्रीय व्यापार सम्झौतामा प्रगति',
    heroImage: unsplash('1526304640581-d334cdbbf45e', 'व्यापार बन्दरगाह', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'एजेन्सी रिपोर्ट',
    authors: [{ id: 'aut-agency', slug: 'agency-report', name: 'एजेन्सी रिपोर्ट' }],
    publishedAt: '2026-06-16T11:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    source: {
      sourceType: 'aggregated',
      sourceName: 'Associated Press',
      sourceUrl: 'https://apnews.com/',
      sourcePublishedAt: '2026-06-16T09:00:00.000Z',
    },
    bodyNe: [
      {
        type: 'paragraph',
        text: 'क्षेत्रीय व्यापार सम्झौताको पछिल्लो चरणको छलफलमा भन्सार व्यवस्थामा सहमति जनाइएको छ।',
      },
    ],
    seoDescriptionNe: 'क्षेत्रीय व्यापार सम्झौतामा प्रगति भएको छ।',
  },
  {
    id: 'art-018',
    slug: 'global-health-vaccine-supply',
    category: { id: 'cat-world', slug: 'world', nameNe: 'विश्व', nameEn: 'World' },
    categoryLabel: 'विश्व',
    titleNe: 'विश्वव्यापी स्वास्थ्य निकायले खोप आपूर्तिको समीक्षा गर्‍यो',
    heroImage: unsplash('1576765608535-5f04d1e3f5af', 'औषधि उत्पादन', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'एजेन्सी रिपोर्ट',
    authors: [{ id: 'aut-agency', slug: 'agency-report', name: 'एजेन्सी रिपोर्ट' }],
    publishedAt: '2026-06-13T07:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    source: {
      sourceType: 'wire',
      sourceName: 'Agence France-Presse',
      sourceUrl: 'https://www.afp.com/',
      sourcePublishedAt: '2026-06-13T05:00:00.000Z',
    },
    bodyNe: [
      {
        type: 'paragraph',
        text: 'विश्वव्यापी स्वास्थ्य निकायले खोप आपूर्ति शृंखलाको समीक्षा गर्दै बराबर वितरणका लागि सिफारिस जारी गरेको छ।',
      },
    ],
    seoDescriptionNe: 'विश्वव्यापी स्वास्थ्य निकायले खोप आपूर्तिको समीक्षा गरेको छ।',
  },

  // -- OPINION ---------------------------------------------------------------
  {
    id: 'art-019',
    slug: 'column-democratic-institutions',
    category: { id: 'cat-opinion', slug: 'opinion', nameNe: 'विचार', nameEn: 'Opinion' },
    categoryLabel: 'विचार',
    titleNe: 'लोकतान्त्रिक संस्था मजबुत गर्ने जिम्मेवारी',
    titleEn: 'The responsibility of strengthening democratic institutions',
    deckNe: 'संस्थागत स्वायत्तता र जवाफदेहिता बिना सुधार अर्थहीन हुन्छ।',
    heroImage: unsplash('1486325212027-8081e485255e', 'सार्वजनिक भवन', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'प्रकाश भट्टराई',
    authors: [{ id: 'aut-prakash', slug: 'prakash-bhattarai', name: 'प्रकाश भट्टराई' }],
    publishedAt: '2026-06-18T05:30:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 5,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'लोकतन्त्रको बलियो संरचना भनेको संस्थाको स्वायत्तता र जवाफदेहितामा भर पर्छ। यी दुई आधार कमजोर हुँदा नीतिगत सुधारले अपेक्षित नतिजा दिँदैन।',
      },
      { type: 'heading2', text: 'स्वायत्तताको अर्थ' },
      {
        type: 'paragraph',
        text: 'संस्थालाई कार्यकारी दबाबबाट मुक्त राख्नु र तिनका निर्णयको पारदर्शी समीक्षा हुनु दुवै एकसाथ आवश्यक छ।',
      },
      {
        type: 'pullQuote',
        quoteNe: 'संस्था बिनाको सुधार घर बिनाको जग जस्तै हुन्छ।',
        attribution: 'लेखक',
      },
      {
        type: 'paragraph',
        text: 'अन्ततः लोकतन्त्रको मापदण्ड चुनावमा मात्र होइन, संस्थाले दैनिक रूपमा कसरी काम गर्छ भन्नामा झल्किन्छ।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'A healthy democracy rests on institutional autonomy paired with accountability; weaken either and reforms lose meaning.',
      },
    ],
    seoDescriptionNe: 'लोकतान्त्रिक संस्था मजबुत गर्ने जिम्मेवारीमा एक स्तम्भ।',
    seoDescriptionEn: 'A column on strengthening democratic institutions.',
  },
  {
    id: 'art-020',
    slug: 'column-foreign-policy-balance',
    category: { id: 'cat-opinion', slug: 'opinion', nameNe: 'विचार', nameEn: 'Opinion' },
    categoryLabel: 'विचार',
    titleNe: 'छिमेकीबीच कूटनीतिक सन्तुलनको आवश्यकता',
    heroImage: unsplash('1528969477-3295c2b6e6c4', 'झण्डाहरू', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'प्रकाश भट्टराई',
    authors: [{ id: 'aut-prakash', slug: 'prakash-bhattarai', name: 'प्रकाश भट्टराई' }],
    publishedAt: '2026-06-14T04:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 4,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'दुई ठूला छिमेकीबीच कूटनीतिक सन्तुलन कायम राख्नु बाह्य नीतिको केन्द्रबिन्दु हो। यो सन्तुलन व्यावहारिक र दीर्घकालीन दृष्टिकोणबाट मात्र सम्भव छ।',
      },
    ],
    seoDescriptionNe: 'छिमेकीबीच कूटनीतिक सन्तुलनको आवश्यकतामा एक स्तम्भ।',
  },
  {
    id: 'art-021',
    slug: 'column-urban-planning',
    category: { id: 'cat-opinion', slug: 'opinion', nameNe: 'विचार', nameEn: 'Opinion' },
    categoryLabel: 'विचार',
    titleNe: 'शहर विस्तार र दीर्घकालीन योजनाको अभाव',
    heroImage: unsplash('1480714378408-67cf0d13bc1b', 'शहरको दृश्य', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'प्रकाश भट्टराई',
    authors: [{ id: 'aut-prakash', slug: 'prakash-bhattarai', name: 'प्रकाश भट्टराई' }],
    publishedAt: '2026-06-11T03:30:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 4,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'छिटो शहर विस्तारको तुलनामा दीर्घकालीन योजना पछाडि छ। यातायात, खुला ठाउँ र आधारभूत सेवाको सन्तुलनमा ध्यान नदिँदा समस्या थपिँदै छन्।',
      },
    ],
    seoDescriptionNe: 'शहर विस्तार र दीर्घकालीन योजनाको अभावमा एक स्तम्भ।',
  },

  // -- DIASPORA --------------------------------------------------------------
  {
    id: 'art-022',
    slug: 'diaspora-labour-rights',
    category: { id: 'cat-diaspora', slug: 'diaspora', nameNe: 'प्रवास', nameEn: 'Diaspora' },
    categoryLabel: 'प्रवास',
    titleNe: 'खाडी मुलुकमा श्रमिक अधिकारको मुद्दा पुनः बहसमा',
    titleEn: 'Migrant labour rights in the Gulf back in focus',
    deckNe: 'नयाँ सम्झौताले श्रमिकको सुरक्षा र जानकारीमा सुधार ल्याउने दाबी गरेको छ।',
    heroImage: unsplash('1454165804606-c3d57bc86b42', 'विदेशी श्रमिक', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'हेमन्त रिजाल',
    authors: [{ id: 'aut-diaspora', slug: 'hemant-rijal', name: 'हेमन्त रिजाल' }],
    publishedAt: '2026-06-17T06:00:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 4,
    tags: [
      {
        id: 'tag-migration',
        slug: 'labour-migration',
        nameNe: 'श्रम प्रवास',
        nameEn: 'Labour migration',
      },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'नयाँ द्विपक्षीय सम्झौताले श्रमिकको सुरक्षा र कार्यसमयको जानकारी थप पारदर्शी बनाउने दाबी गरेको छ। प्रवासी नेपालीले भने कार्यान्वयनमा ध्यान दिनुपर्नेमा जोड दिएका छन्।',
      },
      {
        type: 'list',
        ordered: false,
        items: ['स्पष्ट कार्य सम्झौता', 'पहुँचयोग्य गुनासो संयन्त्र', 'नियमित स्वास्थ्य जाँच'],
      },
      {
        type: 'paragraph',
        text: 'कार्यान्वयनको अनुगमन बिना सम्झौताले भरपुर अर्थ राख्दैन भन्ने अनुभव विगतले देखाएको छ।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'A new bilateral agreement claims stronger safeguards and clearer information for migrant workers, who stress that implementation is what matters.',
      },
    ],
    seoDescriptionNe: 'खाडी मुलुकमा श्रमिक अधिकारको मुद्दा पुनः बहसमा छ।',
    seoDescriptionEn: 'Migrant labour rights in the Gulf are back in focus.',
  },
  {
    id: 'art-023',
    slug: 'diaspora-remittance-families',
    category: { id: 'cat-diaspora', slug: 'diaspora', nameNe: 'प्रवास', nameEn: 'Diaspora' },
    categoryLabel: 'प्रवास',
    titleNe: 'रेमिट्यान्सले पारिवारिक जीवनमा पारेको असर',
    heroImage: unsplash('1605164599901-ci44e1a0e3e3', 'परिवार', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'हेमन्त रिजाल',
    authors: [{ id: 'aut-diaspora', slug: 'hemant-rijal', name: 'हेमन्त रिजाल' }],
    publishedAt: '2026-06-13T08:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [
      {
        id: 'tag-migration',
        slug: 'labour-migration',
        nameNe: 'श्रम प्रवास',
        nameEn: 'Labour migration',
      },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'रेमिट्यान्सले आय बढाए पनि परिवार छुट्टिने र बालबालिकाको हेरचाहमा असर परेको अध्ययनहरूले देखाएका छन्।',
      },
    ],
    seoDescriptionNe: 'रेमिट्यान्सले पारिवारिक जीवनमा पारेको असरको विश्लेषण।',
  },
]
