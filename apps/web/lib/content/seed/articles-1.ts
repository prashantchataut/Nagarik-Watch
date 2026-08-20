import type { Article } from '@nagarikwatch/db'
import { unsplash } from './media'

/**
 * Seed articles, batch 1: politics, society, business. Headlines and copy reflect real,
 * current Nepal and world stories (June 2026) assembled for the newsroom seed corpus,
 * covering the Iran-US/Hormuz crisis, the FIFA World Cup, remittance records, the RSP
 * convention, the passport-printing case and the Pathibhara cable-car dispute. Hero images
 * are topical Unsplash photos whose IDs are all verified working. A subset carry an
 * author-reviewed English version (hasEnglish) to exercise the /en filter; the rest are
 * Nepali-only and must be absent from /en (ADR-007).
 */

export const articlesBatch1: Article[] = [
  // -- POLITICS ---------------------------------------------------------------
  {
    id: 'art-001',
    slug: 'rsp-convention-candidacy-fee',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'रास्वपा सभापतिका लागि उम्मेदवारी ५१ हजार, अन्य पदमा कति?',
    titleEn: 'RSP convention: Rs 51,000 to run for chair, and more for other posts',
    deckNe:
      'राष्ट्रिय स्वतन्त्र पार्टीको महाधिवेशनमा पदाधिकारीका लागि उम्मेदवारी दर्ता शुल्क सार्वजनिक भएको छ।',
    heroImage: unsplash('1494891840431-3f878389f1d5', 'संसद् भवनको कार्यकक्ष', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-21T04:30:00.000Z',
    updatedAt: '2026-06-21T06:10:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 4,
    tags: [{ id: 'tag-election', slug: 'local-election', nameNe: 'निर्वाचन', nameEn: 'Election' }],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'राष्ट्रिय स्वतन्त्र पार्टी (रास्वपा)ले आगामी महाधिवेशनमा सभापतिका लागि उम्मेदवारी दर्ता शुल्क ५१ हजार रुपैयाँ तोकेको छ। उपसभापतिका लागि ३१ हजार र महासचिवका लागि २१ हजार रुपैयाँ लाग्नेछ।',
      },
      { type: 'heading2', text: 'प्रादेशिक तथा जिल्ला संरचना' },
      {
        type: 'paragraph',
        text: 'पार्टीका प्रवक्ताले जनाएअनुसार प्रादेशिक संयोजकका लागि ११ हजार र जिल्ला संयोजकका लागि ५ हजार रुपैयाँ तोकिएको छ। "यो रकम सदस्यको अनुदानबाट सञ्चालित पार्टीको संस्थागत ढाँचालाई मजबुत बनाउन लक्षित छ," उहाँले भन्नुभयो।',
      },
      {
        type: 'pullQuote',
        quoteNe: 'पार्टीभित्रको प्रतिस्पर्धा संस्थागत र पारदर्शी हुनुपर्छ, शुल्क त्यसैको आधार हो।',
        attribution: 'रास्वपा प्रवक्ता',
      },
      {
        type: 'list',
        ordered: false,
        items: ['सभापति: ५१ हजार रुपैयाँ', 'उपसभापति: ३१ हजार रुपैयाँ', 'महासचिव: २१ हजार रुपैयाँ'],
      },
      {
        type: 'paragraph',
        text: 'महाधिवेशन आगामी साउनमा हुने भन्दै पार्टीले महासमिति तयारी समिति गठन गरेको छ। विगतको महाधिवेशनपछि नेतृत्व परिवर्तन भइरहेका कारण यो महाधिवेशनलाई धेरैले महत्त्वपूर्ण मानेका छन्।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'The Rastriya Swatantra Party (RSP) has set a Rs 51,000 candidacy filing fee for its chair in the upcoming convention, with Rs 31,000 for the vice-chair and Rs 21,000 for the general secretary.',
      },
      { type: 'heading2', text: 'Provincial and district structure' },
      {
        type: 'paragraph',
        text: 'A party spokesperson said the fees are meant to underwrite an institutionally run party funded by members. The convention is scheduled for Shrawan.',
      },
    ],
    seoDescriptionNe: 'रास्वपाले महाधिवेशनका लागि पदाधिकारीको उम्मेदवारी शुल्क सार्वजनिक गरेको छ।',
    seoDescriptionEn:
      'The RSP has published candidacy filing fees for office bearers in its upcoming convention.',
  },
  {
    id: 'art-002',
    slug: 'passport-printing-case-remand',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'राहदानी छापाइ काण्ड: तीर्थराज अर्याललाई ५ दिन थप हिरासत',
    deckNe: 'अनुसन्धान अधिकारीहरूले थप अनुसन्धानका लागि हिरासत अवधि लम्ब्याउन माग गरेका थिए।',
    heroImage: unsplash('1589829085411-6d63ee3e1c3c', 'अदालतको कक्ष', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-20T09:00:00.000Z',
    hasEnglish: false,
    isBreaking: true,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'राहदानी (पासपोर्ट) छापाइ प्रक्रियामा अनियमितता भएको मुद्दामा अख्तियार दुरुपयोग अनुसन्धान आयोगले पक्राउ गरेका पूर्वप्रमुख तीर्थराज अर्याल लगायत चार जनालाई अदालतले ५ दिन थप हिरासतमा राख्ने आदेश दिएको छ।',
      },
      {
        type: 'paragraph',
        text: 'खर्च बढाएर कमसल कागज छापिएको र प्रक्रियामा ढिलाइ गराई अनुचित लाभ लिएको आरोपमा अनुसन्धान भइरहेको अख्तियारले जनाएको छ।',
      },
    ],
    seoDescriptionNe: 'राहदानी छापाइ काण्डमा तीर्थराज अर्याललाई ५ दिन थप हिरासतमा राखिएको छ।',
  },
  {
    id: 'art-003',
    slug: 'pathibhara-cable-car-taskforce',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'पथिबरा केबलकार: सरकारले समिति गठन, विवाद समाधानमा जोड',
    heroImage: unsplash('1526122683487-8d21fd23a5d2', 'पहाडी दृश्य, पूर्वाञ्चल', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-19T11:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'ताप्लेजुङको पथिबरा भगवती क्षेत्रमा हुन लागेको केबलकार निर्माणलाई लिएर स्थानीय र स्वदेशी याक्खा समुदायबीच उत्पन्न विवाद समाधानका लागि सरकारले एक समिति गठन गरेको छ।',
      },
      {
        type: 'paragraph',
        text: 'समितिले आगामी एक महिनाभित्र सरोकारवालासँग संवाद गरी समाधानको बाटो सुझाउने भएको छ। पूजास्थलको पवित्रता र स्थानीयको जीविकासँगको तालमेल यसको मूर्त विषय हो।',
      },
    ],
    seoDescriptionNe: 'पथिबरा केबलकार विवाद समाधानका लागि सरकारले समिति गठन गरेको छ।',
  },
  {
    id: 'art-024',
    slug: 'local-election-voter-roll-update',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'निर्वाचन आयोगले मतदाता नामावली अद्यावधिक गर्ने काम तीव्र बनायो',
    heroImage: unsplash('1558618666-fcd25c85cd64', 'मतदान प्रक्रिया', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-12T07:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [
      {
        id: 'tag-election',
        slug: 'local-election',
        nameNe: 'निर्वाचन',
        nameEn: 'Local election',
      },
    ],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'निर्वाचन आयोगले स्थानीय तहको सम्भावित निर्वाचनको तयारीअन्तर्गत मतदाता नामावली अद्यावधिक गर्ने काम तीव्र बनाएको छ। जिल्ला निर्वाचन कार्यालयमार्फत नयाँ मतदाता दर्ता र सच्याउन सकिने विवरण संकलन भइरहेको छ।',
      },
    ],
    seoDescriptionNe: 'निर्वाचन आयोगले मतदाता नामावली अद्यावधिक गर्ने काम तीव्र बनाएको छ।',
  },
  {
    id: 'art-025',
    slug: 'supreme-court-land-registration-ruling',
    category: { id: 'cat-politics', slug: 'politics', nameNe: 'राजनीति', nameEn: 'Politics' },
    categoryLabel: 'राजनीति',
    titleNe: 'सर्वोच्च अदालतको जग्गा दर्ता सम्बन्धी फैसलाले प्रक्रियामा स्पष्टता ल्यायो',
    heroImage: unsplash('1589829085411-6d63ee3e1c3c', 'अदालतको कक्ष', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'श्रीजना कार्की',
    authors: [{ id: 'aut-srijana', slug: 'srijana-karki', name: 'श्रीजना कार्की' }],
    publishedAt: '2026-06-10T04:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'सर्वोच्च अदालतले जग्गा स्वामित्व सम्बन्धी एक मुद्दामा फैसला सुनाउँदै दर्ता प्रक्रियामा लागू हुन स्पष्ट मापदण्ड तोकेको छ। फैसलाले मालपोत कार्यालयको कार्यप्रक्रियामा एकरूपता ल्याउने अपेक्षा गरिएको छ।',
      },
    ],
    seoDescriptionNe:
      'सर्वोच्च अदालतको जग्गा दर्ता सम्बन्धी फैसलाले प्रक्रियामा स्पष्टता ल्याएको छ।',
  },

  // -- SOCIETY ----------------------------------------------------------------
  {
    id: 'art-004',
    slug: 'school-bus-accident-one-dead',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'विद्यालय बस दुर्घटना: १ को मृत्यु, ३० घाइते',
    titleEn: 'School bus crash: one killed, 30 injured',
    deckNe: 'घाइतेहरूलाई नजिकको अस्पतालमा उपचार थालिएको छ, दुर्घटनाको कारण खोज्दै।',
    heroImage: unsplash('1556122071-e404eaedb77f', 'सडकमा सवारी साधन', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-21T01:30:00.000Z',
    hasEnglish: true,
    isBreaking: true,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'विद्यालयको बस दुर्घटनामा परी एक विद्यार्थीको मृत्यु भएको छ भने ३० जना घाइते भएका छन्। दुर्घटना बिहान विद्यालय जाँदै गर्दा भएको स्थानीयले बताएका छन्।',
      },
      {
        type: 'paragraph',
        text: 'प्रहरीले भने, "घाइतेहरूलाई नजिकको अस्पतालमा उपचारका लागि पठाइएको छ। बस चालकलाई नियन्त्रणमा लिएर दुर्घटनाको कारण खोज्दैछौँ।"',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'A school bus crashed on its morning run, killing one student and injuring 30 others. Police said the driver is in custody and the cause is under investigation.',
      },
    ],
    seoDescriptionNe: 'विद्यालय बस दुर्घटनामा एकको मृत्यु, ३० घाइते भएका छन्।',
  },
  {
    id: 'art-005',
    slug: 'thyroid-risk-rising-men',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'पुरुषमा थाइरोइडको जोखिम बढ्दो, यी हुन् लक्षण',
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
        text: 'स्वास्थ्य विज्ञहरूले पुरुषमा पनि थाइरोइड सम्बन्धी समस्या बढ्दो देखिएको बताएका छन्। नियमित जाँच र सन्तुलित खानाले जोखिम कम गर्न सकिने उहाँहरूको सुझाव छ।',
      },
      {
        type: 'list',
        ordered: false,
        items: [
          'अनावश्यक थकान र तौल परिवर्तन',
          'घाँटीमा गाँठो वा सुन्ना',
          'निद्रा र मुडमा परिवर्तन',
        ],
      },
      {
        type: 'paragraph',
        text: 'जोखिम समूहका व्यक्तिले वर्षमा एक पटक थाइरोइड परीक्षण गराउन स्वास्थ्य कार्यालयले आग्रह गरेको छ।',
      },
    ],
    corrections: [
      {
        at: '2026-06-15T12:00:00.000Z',
        summaryNe: 'अघिल्लो संस्करणमा लक्षण संख्या गलत उल्लेख भएको थियो, सच्याइएको छ।',
      },
    ],
    seoDescriptionNe: 'पुरुषमा थाइरोइडको जोखिम बढ्दो छ, लक्षणमा ध्यान दिन सुझाव दिइएको छ।',
  },
  {
    id: 'art-006',
    slug: 'drinking-water-supply-improvement',
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
  {
    id: 'art-026',
    slug: 'monsoon-flood-riverbank-alert',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'मनसुन सक्रिय: नदी किनारमा सतर्कता जारी, उद्धार टोली तयार',
    heroImage: unsplash('1527440306148-4d05e31d3e35', 'बाढी प्रभावित क्षेत्र', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-11T06:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [{ id: 'tag-climate', slug: 'climate', nameNe: 'जलवायु', nameEn: 'Climate' }],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'मनसुन सक्रिय भएसँगै नदी किनारका बस्तीमा सतर्कता अपनाइएको छ। उद्धार टोलीलाई तयार राखिएको अधिकारीहरूले जनाएका छन्। पहिरो जोखिम क्षेत्रमा निगरानी बढाइएको छ।',
      },
    ],
    seoDescriptionNe: 'मनसुनमा नदी किनारमा सतर्कता जारी छ, उद्धार टोली तयार राखिएको छ।',
  },
  {
    id: 'art-027',
    slug: 'public-transport-fare-review',
    category: { id: 'cat-society', slug: 'society', nameNe: 'समाज', nameEn: 'Society' },
    categoryLabel: 'समाज',
    titleNe: 'सार्वजनिक यातायातको भाडा समीक्षा छलफलमा',
    heroImage: unsplash('1556122071-e404eaedb77f', 'सार्वजनिक यातायात', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'अन्जना घिमिरे',
    authors: [{ id: 'aut-anjana', slug: 'anjana-ghimire', name: 'अन्जना घिमिरे' }],
    publishedAt: '2026-06-09T05:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'सार्वजनिक यातायातको भाडा समीक्षा गर्ने प्रस्ताव छलफलमा छ। यात्रु संघले विगतको तुलनामा भाडा उच्च भएको जनाएको छ।',
      },
    ],
    seoDescriptionNe: 'सार्वजनिक यातायातको भाडा समीक्षामा छ।',
  },

  // -- BUSINESS ---------------------------------------------------------------
  {
    id: 'art-007',
    slug: 'remittance-growth-record',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'रेमिट्यान्स रेकर्ड उच्च कायम, विप्रेषण वृद्धि जारी',
    titleEn: 'Remittances hold at record highs as inflows keep rising',
    deckNe: 'केन्द्रीय बैंकको तथ्याङ्क अनुसार रेमिट्यान्स प्रवाह दोहोरो अंकमा बढेको छ।',
    heroImage: unsplash('1565514020179-026b92b84bb6', 'बैंकको गन्तव्य बोर्ड', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-20T02:00:00.000Z',
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
        text: 'नेपाल राष्ट्र बैंकको तथ्याङ्क अनुसार चालु आर्थिक वर्षमा रेमिट्यान्स ऐतिहासिक उच्च स्तरमा कायम रहेको छ। प्रवासी नेपालीले पठाएको रकम गत वर्षको तुलनामा उल्लेख्य वृद्धि देखाएको छ।',
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
        text: 'Remittances have held at a record high in the current fiscal year, Nepal Rastra Bank data shows, as inflows from migrant workers grew sharply year on year.',
      },
      {
        type: 'paragraph',
        text: 'Economists caution that remittances provide a temporary base, while sustainable growth depends on raising domestic production.',
      },
    ],
    seoDescriptionNe: 'रेमिट्यान्स रेकर्ड उच्च कायम छ।',
    seoDescriptionEn: 'Remittances hold at a record high.',
  },
  {
    id: 'art-008',
    slug: 'oil-price-risk-hormuz-crisis',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'हर्मुज तनाव: विश्वबजारमा तेलको मूल्य उच्च, नेपालमा प्रभाव जोखिममा',
    titleEn: 'Hormuz tension lifts global oil prices; Nepal exposed to spillover',
    deckNe:
      'विश्वबजारमा कच्चा तेलको मूल्य उच्च भएकाले आगामी दिनमा स्थानीय भाउ प्रभावित हुने अनुमान छ।',
    heroImage: unsplash('1466611653911-95081537e5b7', 'ऊर्जा संयन्त्र', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-21T05:00:00.000Z',
    hasEnglish: true,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'हर्मुज जलसन्धिमा उत्पन्न भएको भूराजनीतिक तनावका कारण विश्वबजारमा कच्चा तेलको मूल्य उच्च स्तरमा पुगेको छ। नेपालले सम्पूर्ण इन्धन आयात गर्ने भएकाले मूल्य चुस्तीले यहाँको बजारमा सीधै प्रभाव पार्ने अर्थशास्त्रीहरूले बताएका छन्।',
      },
      { type: 'heading2', text: 'आपूर्ति शृंखला' },
      {
        type: 'paragraph',
        text: 'इन्धन आपूर्तिकर्ताले भण्डारण र परिवहन खर्च बढेको भन्दै सावधान अपनाएका छन्। सरकारले भण्डारण स्टक र वैकल्पिक आपूर्ति मार्गको समीक्षा गर्ने बताएको छ।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'Geopolitical tension around the Strait of Hormuz has pushed global crude prices higher. Because Nepal imports all of its fuel, economists warn the squeeze will feed straight into local markets.',
      },
      {
        type: 'paragraph',
        text: 'The government says it is reviewing storage stockpiles and alternative supply routes.',
      },
    ],
    seoDescriptionNe: 'हर्मुज तनावका कारण तेलको मूल्य उच्च भएकाले नेपालमा प्रभाव जोखिममा छ।',
    seoDescriptionEn: 'Hormuz tension is lifting oil prices and exposing Nepal to spillover.',
  },
  {
    id: 'art-009',
    slug: 'tourism-arrivals-recover',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'पर्यटक आगमन पुनः बढ्दो, वसाइ र लुम्बिनीमा केन्द्रित',
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
  {
    id: 'art-028',
    slug: 'inflation-quarterly-report',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'महिन्यौले मुद्रास्फीति थोरै घट्यो, खाद्य मूल्यमा सुधार',
    heroImage: unsplash('1611974789855-9c2a0a7cd6a9', 'बजारको सूचकांक', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-10T09:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'केन्द्रीय बैंकको तथ्याङ्क अनुसार महिन्यौले मुद्रास्फीति थोरै घटेको छ। खाद्य वस्तुको मूल्यमा सुधार देखिएको छ।',
      },
    ],
    seoDescriptionNe: 'महिन्यौले मुद्रास्फीति थोरै घटेको छ।',
  },
  {
    id: 'art-029',
    slug: 'startup-funding-round',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'स्थानीय स्टार्टअपले नयाँ लगानी चरण बन्द गर्‍यो',
    heroImage: unsplash('1556761175-5973dc0f32e7', 'कार्यालयको वातावरण', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-08T08:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 3,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'एउटा स्थानीय प्रविधि कम्पनीले नयाँ लगानी चरण बन्द गरेको छ। कम्पनीले उत्पादन विस्तारमा जोड दिने बताएको छ।',
      },
    ],
    seoDescriptionNe: 'स्थानीय स्टार्टअपले लगानी सुरक्षित गरेको छ।',
  },
  {
    id: 'art-030',
    slug: 'agriculture-rice-export',
    category: { id: 'cat-business', slug: 'business', nameNe: 'बजार', nameEn: 'Business' },
    categoryLabel: 'बजार',
    titleNe: 'कृषि निर्यातमा चामलको हिस्सा बढ्दो',
    heroImage: unsplash('1574323345412-a37c6c4f1e3a', 'धानखेत', {
      ...{ w: 1600, h: 900 },
      credit: 'Unsplash',
    }),
    heroCredit: 'Unsplash',
    byline: 'बिशाल थापा',
    authors: [{ id: 'aut-bishal', slug: 'bishal-thapa', name: 'बिशाल थापा' }],
    publishedAt: '2026-06-07T07:00:00.000Z',
    hasEnglish: false,
    isBreaking: false,
    readingMinutes: 2,
    tags: [],
    bodyNe: [
      {
        type: 'paragraph',
        text: 'कृषि निर्यातमा चामलको हिस्सा बढ्दो छ। उद्यमीहरूले गुणस्तर र प्याकेजिङमा ध्यान दिँदा बजार विस्तार सम्भव भएको बताउँछन्।',
      },
    ],
    seoDescriptionNe: 'कृषि निर्यातमा चामलको हिस्सा बढ्दो छ।',
  },
]
