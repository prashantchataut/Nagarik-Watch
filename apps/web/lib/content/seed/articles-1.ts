import type { Article } from '@nagarikwatch/db'
import { unsplash } from './media'

/**
 * Seed articles, batch 1: politics, society, business. Realistic Nepali sample copy in the
 * PRODUCT.md voice (factual, specific, no clickbait). Hero images are topical Unsplash
 * photos. A subset carry an author-reviewed English version (hasEnglish) to exercise the
 * /en filter; the rest are Nepali-only and must be absent from /en (ADR-007).
 */

export const articlesBatch1: Article[] = [
  // -- POLITICS ---------------------------------------------------------------
  {
    id: 'art-001',
    slug: 'budget-priority-infrastructure',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'अर्थमन्त्रीले आगामी बजेटमा पूर्वाधारमा रकम बढाउने जनाए',
    titleEn: 'Finance minister signals higher infrastructure spending in coming budget',
    deckNe: 'आर्थिक वर्ष २०८३/८४ को बजेटमा सडक, सिँचाइ र ऊर्जालाई प्राथमिकता दिने तयारी।',
    deckEn: 'Roads, irrigation and energy are being lined up as priorities for fiscal year 2083/84.',
    heroImage: unsplash('1450101499163-c8848c66ca85', 'संसद् भवनको बाहिरी दृश्य, काठमाडौं', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-19T04:30:00.000Z',
    updatedAt: '2026-06-19T06:10:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 4,
    tags: [
      { id: 'tag-budget', slug: 'budget-2083', nameNe: 'बजेट २०८३', nameEn: 'Budget 2083' },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'अर्थमन्त्रीले बुधबार पत्रकार सम्मेलनमा आगामी आर्थिक वर्ष २०८३/८४ को संघीय बजेटमा पूर्वाधार निर्माणलाई प्राथमिकतामा राखिने जानकारी दिए। उनले सडक, सिँचाइ र ऊर्जा आयोजनाहरूका लागि विनियोजन बढाउने प्रतिबद्धता व्यक्त गरे।',
      },
      { type: 'heading2', text: 'पुँजीगत खर्चमा जोड' },
      {
        type: 'paragraph',
        text: 'गत आर्थिक वर्षमा पुँजीगत खर्च कमजोर भएको आलोचना भइरहँदा अर्थमन्त्रीले यो वर्ष खर्चको गति बढाउन विशेष व्यवस्था गरिने बताए। "सुरुको चार महिनाभित्र ठेक्का प्रक्रिया सक्कलीकरण गरिनेछ," उनले भने।',
      },
      {
        type: 'pullQuote',
        quoteNe: 'पूर्वाधारमा गरिने लगानीले रोजगारी सिर्जना मात्र होइन, उत्पादकत्व पनि बढाउँछ।',
        attribution: 'अर्थमन्त्री',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'सिँचाइ आयोजनाका लागि थप रकम',
          'प्रादेशिक सडक सुधार कार्यक्रम',
          'नवीकरणीय ऊर्जामा प्रोत्साहन',
        ],
      },
      {
        type: 'paragraph',
        text: 'प्रतिपक्षी दलका सांसदहरूले भने बजेट वितरणमा सन्तुलन कायम रहनुपर्ने र प्रादेशिक सरकारलाई पर्याप्त स्रोत पठाउनुपर्नेमा जोड दिएका छन्।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'The finance minister told a press conference on Wednesday that infrastructure will lead the federal budget for fiscal year 2083/84, with higher allocations for roads, irrigation and energy projects.',
      },
      { type: 'heading2', text: 'Focus on capital spending' },
      {
        type: 'paragraph',
        text: 'After weak capital spending last year, the minister pledged faster procurement. "Tender processes will be completed within the first four months," he said.',
      },
      {
        type: 'paragraph',
        text: 'Opposition lawmakers pressed for balanced distribution and adequate transfers to provincial governments.',
      },
    ],
    seoDescriptionNe: 'अर्थमन्त्रीले आगामी बजेटमा पूर्वाधारमा रकम बढाउने जनाएका छन्।',
    seoDescriptionEn: 'The finance minister has flagged higher infrastructure spending in the upcoming budget.',
  },
  {
    id: 'art-002',
    slug: 'parliament-session-agenda',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'संसद् अधिवेशन सुरु, सरकारले पेस गर्ने कानूनको सूची सार्वजनिक',
    deckNe: 'यस अधिवेशनमा विधेयकहरूको प्राथमिकता र छलफलको तालिका तय भएको छ।',
    heroImage: unsplash('1494891840431-3f878389f1d5', 'संसद् भवनको कार्यकक्ष', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-18T09:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'संघीय संसद् को बैठक सुरु भएको छ। सरकारले यस अधिवेशनमा पेस गर्ने कानूनको सूची सार्वजनिक गरेको छ, जसमा आर्थिक सुशासन र नागरिक सेवा सुधारसम्बन्धी विधेयक परेका छन्।',
      },
      {
        type: 'paragraph',
        text: 'सभामुखले समितिहरूमा छलफल गरेर निष्कर्ष ल्याउन आग्रह गर्दै विधेयक पारित हुने क्रम तीव्र बनाउने बताए।',
      },
    ],
    seoDescriptionNe: 'संसद् अधिवेशन सुरु भएको छ, सरकारले कानूनको सूची सार्वजनिक गरेको छ।',
  },
  {
    id: 'art-003',
    slug: 'opposition-demands-inquiry',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'प्रतिपक्षले संसदीय छानबिन समिति गठनको माग गर्‍यो',
    heroImage: unsplash('1529107386315-e1a2ed48a620', 'पत्रकार सम्मेलन', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-17T11:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'प्रतिपक्षी दलहरूले हालै सार्वजनिक भएको प्रतिवेदनका आधारमा संसदीय छानबिन समिति गठन गर्नुपर्ने माग राखेका छन्। उनीहरूले छानबिनबिना प्रतिवेदनलाई स्वीकार नगर्ने चेतावनी दिएका छन्।',
      },
    ],
    seoDescriptionNe: 'प्रतिपक्षले संसदीय छानबिन समिति गठनको माग गरेको छ।',
  },

  // -- SOCIETY ----------------------------------------------------------------
  {
    id: 'art-004',
    slug: 'schools-reopen-monsoon',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'मनसुनको सुरुवातसँगै विद्यालय खुले, सुरक्षित यात्राको जोड',
    titleEn: 'Schools reopen with the monsoon, focus on safe travel',
    deckNe: 'जिल्ला शिक्षा कार्यालयले बाटो खतरनाक भएका क्षेत्रमा विशेष सावधानी अपनाउन निर्देशन दिएको छ।',
    heroImage: unsplash('1503676260728-1c00da094a0b', 'विद्यालयका विद्यार्थी', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-16T01:30:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'असारको पहिलो साता विद्यालयहरू पुनः खुल्दै छन्। जिल्ला शिक्षा कार्यालयले बाटो खतरनाक भएका ग्रामीण क्षेत्रमा विद्यार्थीको सुरक्षित यात्रामा विशेष ध्यान दिन निर्देशन जारी गरेको छ।',
      },
      {
        type: 'paragraph',
        text: 'जिल्ला शिक्षा अधिकारीले भने, "पहिरो जोखिम भएका बाटोमा समन्वय समिति बनाएर निगरानी गरिनेछ।"',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Schools are reopening in the first week of Asar. District education offices have asked staff to monitor routes prone to landslides and coordinate safe travel for students.',
      },
    ],
    seoDescriptionNe: 'मनसुनसँगै विद्यालय खुल्दै, सुरक्षित यात्रामा जोड दिइएको छ।',
  },
  {
    id: 'art-005',
    slug: 'hospital-doctor-shortage',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'जिल्ला अस्पतालमा चिकित्सकको अभाव, बिरामी प्रभावित',
    heroImage: unsplash('1519494026892-80bbd2d6fd0d', 'अस्पतालको कक्ष', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-15T08:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'धेरै जिल्ला अस्पतालमा विशेषज्ञ चिकित्सकको अभाव देखिएको छ। बिरामीहरू सहर नजिकैको केन्द्रमा उपचार खोज्दै बाध्य भएका छन्।',
      },
      {
        type: 'paragraph',
        text: 'स्वास्थ्य कार्यालयले भर्ना र सेवा विस्तारमा जोड दिने बताएको छ।',
      },
    ],
    corrections: [
      {
        at: '2026-06-15T12:00:00.000Z',
        summaryNe: 'अघिल्लो संस्करणमा चिकित्सक संख्या गलत उल्लेख भएको थियो, सच्याइएको छ।',
      },
    ],
    seoDescriptionNe: 'जिल्ला अस्पतालमा चिकित्सक अभावले बिरामी प्रभावित छन्।',
  },
  {
    id: 'art-006',
    slug: 'clean-drinking-water-project',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'सहरमा खानेपानी आपूर्ति सुधार आयोजना अघि बढ्यो',
    heroImage: unsplash('1559825481-12a05cc00344', 'खानेपानीको धारा', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-14T07:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'खानेपानी आपूर्ति सुधार आयोजनाको पहिलो चरण सकिन लागेको छ। अधिकारीहरूले नयाँ भण्डारण ट्याङ्की र पाइप विस्तारले गर्मीमा पानीको अभाव कम हुने बताएका छन्।',
      },
    ],
    seoDescriptionNe: 'खानेपानी सुधार आयोजनाको पहिलो चरण सकिन लागेको छ।',
  },

  // -- BUSINESS ---------------------------------------------------------------
  {
    id: 'art-007',
    slug: 'remittance-growth-record',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'रेमिट्यान्स ११ महिनामा रेकर्ड उच्च, विप्रेषण वृद्धि जारी',
    titleEn: 'Remittances hit a record high over 11 months as inflows keep rising',
    deckNe: 'केन्द्रीय बैंकको तथ्याङ्क अनुसार रेमिट्यान्स प्रवाह दोहोरो अंकमा बढेको छ।',
    heroImage: unsplash('1565514020179-026b92b84bb6', 'बैंकको गन्तव्य बोर्ड', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-19T02:00:00.000Z',
    hasEnglish: true,
    isBreaking: true,
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
        text: 'नेपाल राष्ट्र बैंकको तथ्याङ्क अनुसार चालु आर्थिक वर्षको ११ महिनामा रेमिट्यान्स ऐतिहासिक उच्च स्तरमा पुगेको छ। प्रवासी नेपालीले पठाएको रकम गत वर्षको तुलनामा उल्लेख्य वृद्धि देखाएको छ।',
      },
      { type: 'heading2', text: 'विप्रेषण र व्यापार घाटा' },
      {
        type: 'paragraph',
        text: 'अर्थशास्त्रीहरूले रेमिट्यान्सको यो वृद्धिले व्यापार घाटा केही हदसम्म धान्न मद्दत गरेको तर दिगो उत्पादन बढाउन नसके आर्थिक संरचना कमजोर रहने बताउँछन्।',
      },
      {
        type: 'pullQuote',
        quoteNe: 'रेमिट्यान्सले अर्थतन्त्रलाई अस्थायी आधार दिन्छ, दिगो आधार उत्पादन हो।',
        attribution: 'अर्थशास्त्री',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Remittances reached a record high in the first 11 months of the fiscal year, Nepal Rastra Bank data shows, as inflows from migrant workers grew sharply year on year.',
      },
      {
        type: 'paragraph',
        text: 'Economists caution that remittances provide a temporary base, while sustainable growth depends on raising domestic production.',
      },
    ],
    seoDescriptionNe: 'रेमिट्यान्स ११ महिनामा रेकर्ड उच्च भएको छ।',
    seoDescriptionEn: 'Remittances hit a record high over 11 months.',
  },
  {
    id: 'art-008',
    slug: 'stock-market-weekly',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'पुँजी बजार साप्ताहिक: सूचकांक मामिला वृद्धि, कारोबार बढ्यो',
    heroImage: unsplash('1611974789855-9c2a0a7cd6a9', 'पुँजी बजारको ग्राफ', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-13T10:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'गत हप्ता पुँजी बजारको सूचकांक मामिला वृद्धि भएको थियो भने कारोबार रकम पनि बढेको देखियो। विश्लेषकहरूले बैंकिङ क्षेत्रका सेयरमा रुचि बढेको बताएका छन्।',
      },
    ],
    seoDescriptionNe: 'पुँजी बजारको सूचकांक मामिला वृद्धि भएको छ।',
  },
  {
    id: 'art-009',
    slug: 'tourism-arrivals-recover',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'पर्यटक आगमन पुनः बढ्दो, वसाइ रत्नपुरमा केन्द्रित',
    heroImage: unsplash('1526122683487-8d21fd23a5d2', 'पहाडी पदयात्रा', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-12T09:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'पर्यटन बोर्डका अनुसार पर्यटक आगमन पुनः बढ्दो क्रममा छ। वसाइ र त्यसपछि चितवन र लुम्बिनीमा आगमन बढेको देखिएको छ।',
      },
    ],
    seoDescriptionNe: 'पर्यटक आगमन पुनः बढ्दो क्रममा छ।',
  },
]
