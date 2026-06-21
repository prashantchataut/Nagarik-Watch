import type { Locale } from '@nagarikwatch/db'

/**
 * Reader-facing string dictionary (SPEC.md i18n rule: never hardcode English in JSX).
 * Both locales are first-class; Nepali is the source of truth, English mirrors it. Keys are
 * stable identifiers so components reference `t('shareLabel')` rather than a literal.
 */
export const dictionary = {
  ne: {
    siteName: 'नागरिक वाच',
    siteNameEn: 'Nagarik Watch',
    tagline: 'नागरिकको दृष्टिमा समाचार',
    skipToContent: 'मूल सामग्रीमा जानुहोस्',
    primaryNav: 'मुख्य नेभिगेसन',
    closeMenu: 'मेनु बन्द गर्नुहोस्',
    openMenu: 'मेनु खोल्नुहोस्',
    search: 'खोज्नुहोस्',
    searchAria: 'खोज प्रविष्ट गर्नुहोस्',
    searchPlaceholder: 'शीर्षक, विषय वा लेखक खोज्नुहोस्…',
    searchHeading: 'खोज',
    searchEmptyQuery: 'खोज्न क्वेरी लेख्नुहोस्',
    searchEmptyHint: 'शीर्षक, लेखक, विषय वा विभाग खोज्नुहोस्। देवनागरी वा अंग्रेजी दुवै चल्छ।',
    searchNoResults: 'कुनै परिणाम भेटिएन।',
    searchNoResultsHint: 'अर्को शब्द वा लेखकको नाम प्रयास गर्नुहोस्।',
    searchClear: 'खोज मेटाउनुहोस्',
    searchRecent: 'हालैका खोज',
    searchResults: (n: number) => `${n} वटा परिणाम`,
    home: 'गृहपृष्ठ',
    more: 'थप',
    seeAll: 'सबै हेर्नुहोस्',
    readMore: 'पूरा पढ्नुहोस्',
    localeToggleTo: 'English',
    localeToggleAria: 'अंग्रेजीमा पढ्नुहोस्',
    themeToggleToLight: 'लाइट मोड',
    themeToggleToDark: 'डार्क मोड',
    themeToggleLabel: 'थिम बदल्नुहोस्',
    breakingLabel: 'ब्रेकिङ',
    updatedAt: 'यो लेख अपडेट भएको छ',
    correctedAt: 'सच्याइएको',
    correctionsHeading: 'सच्याइ',
    sourcePrefix: 'स्रोत',
    aggregatedFrom: 'बाट संकलित',
    agencyReport: 'एजेन्सी रिपोर्ट',
    readingTime: (n: number) => `${n} मिनेट पढाइ`,
    storyCount: (n: number) => `${n} वटा लेख`,
    authorCategories: 'यी विभागमा लेखन',
    topicBackToCategory: 'विभागमा फर्कनुहोस्',
    storyCountTopic: (n: number) => `${n} वटा समाचार`,
    shareLabel: 'साझेदारी',
    shareCopied: 'समिक्षित',
    shareCopyLink: 'लिङ्क प्रतिलिपि',
    shareFacebook: 'फेसबुकमा साझेदारी',
    shareTwitter: 'एक्समा साझेदारी',
    relatedStories: 'सम्बन्धित समाचार',
    authorStories: 'यी लेखकका समाचार',
    topicStories: 'यो विषयका समाचार',
    articleBy: 'लेखक',
    publishedOn: 'प्रकाशित',
    adLabel: 'विज्ञापन',
    page: 'पृष्ठ',
    of: 'को',
    nextPage: 'अर्को पृष्ठ',
    prevPage: 'अघिल्लो पृष्ठ',
    notFoundHeading: 'पृष्ठ फेला परेन',
    notFoundBody: 'तपाईंले खोज्नुभएको पृष्ठ अहिले उपलब्ध छैन।',
    notFoundHome: 'गृहपृष्ठमा फर्कनुहोस्',
    errorHeading: 'केही गडबड भयो',
    errorBody: 'पृष्ठ लोड गर्दा समस्या आयो। कृपया पुनः प्रयास गर्नुहोस्।',
    errorRetry: 'पुनः प्रयास गर्नुहोस्',
    emptyEnglish: 'हाल यो समाचार अंग्रेजीमा उपलब्ध छैन।',
    footerAbout: 'हाम्रो बारेमा',
    footerEthics: 'सम्पादकीय नीति',
    footerPrivacy: 'गोपनीयता',
    footerContact: 'सम्पर्क',
    footerSections: 'सामग्री',
    aboutKicker: 'हाम्रो बारेमा',
    aboutLead:
      'नागरिक वाच नेपाली पाठकका लागि नागरिककेन्द्रित, स्वतन्त्र र विश्वसनीय समाचार पोर्टल हो। हामी देवनागरीलाई प्राथमिकता दिन्छौं र प्रत्येक कथालाई सत्य, सन्तुलन र सन्दर्भसहित प्रस्तुत गर्छौं।',
    aboutMissionHeading: 'हाम्रो उद्देश्य',
    aboutMission:
      'नेपाली नागरिकलाई निर्णय लिन आवश्यक जानकारी दिनु, शक्तिशालीलाई जवाफदेही बनाउनु र सीमान्तकृत स्वरलाई मूलधारमा ल्याउनु हाम्रो काम हो। स्वतन्त्र सम्पादकीय निर्णय हाम्रो मेरुदण्ड हो।',
    aboutFundingHeading: 'स्वामित्व र स्रोत',
    aboutFunding:
      'नागरिक वाच विज्ञापन र सीमित प्रायोजित सामग्रीबाट आर्थिक रूपमा टिकिरहेको छ। सबै प्रायोजित सामग्री स्पष्ट रूपमा छुट्याइन्छ र सम्पादकीय निर्णयमा हस्तक्षेप गर्दैन।',
    ethicsKicker: 'सम्पादकीय नीति',
    ethicsLead:
      'यो नीतिले हामी कसरी समाचार संकलन, सम्पादन र प्रकाशन गर्छौं, भन्ने नियमहरू परिभाषित गर्छ। पाठकको विश्वास हाम्रो सबैभन्दा मूल्यवान सम्पत्ति हो।',
    ethicsAccuracyHeading: 'सट्टीकता र सच्याइ',
    ethicsAccuracy:
      'तथ्यात्मक त्रुटि फेला परेमा हामी तुरुन्त सच्याउँछौं र लेखमा स्पष्ट सच्याइ सूचना राख्छौं। प्रत्येक कथा प्रकाशन अगाडि कम्तीमा एक सम्पादकद्वारा जाँचिन्छ।',
    ethicsSourcesHeading: 'स्रोत र आरोपण',
    ethicsSources:
      'हामी प्रत्येक दाबिको स्रोत उल्लेख गर्छौं। संकलित वा तार समाचारमा मूल प्रकाशकको नाम र लिङ्क सहित आरोपण राखिन्छ। नाम नखुलाउने स्रोतको जानकारी सम्पादकीय निर्णयमा मात्र उपयोग गरिन्छ।',
    ethicsIndependenceHeading: 'स्वतन्त्रता',
    ethicsIndependence:
      'विज्ञापनदाता वा प्रायोजकले सम्पादकीय सामग्रीमा प्रभाव पार्दैनन्। स्वार्थको द्वन्द्व भएका अधिकारी वा संस्थाको कभरेज स्पष्ट रूपमा खुलाइन्छ।',
    privacyKicker: 'गोपनीयता',
    privacyLead:
      'यो नीतिले हामी तपाईंको कस्तो जानकारी संकलन गर्छौं र कसरी प्रयोग गर्छौं भन्ने वर्णन गर्छ।',
    privacyAnalyticsHeading: 'एनालिटिक्स',
    privacyAnalytics:
      'हामी कुकीरहित, गोपनीयता-मैत्री Plausible एनालिटिक्स प्रयोग गर्छौं जसले व्यक्तिगत पहिचान नगरी कुल भिजिट गणना मात्र गर्छ। तपाईंलाई फिङ्गरप्रिन्ट गरिँदैन।',
    privacyContactHeading: 'सम्पर्क फारम',
    privacyContact:
      'यदि तपाईंले सम्पर्क फारम भर्नुभयो भने तपाईंको नाम र इमेल तपाईंको अनुरोधको प्रतिक्रियाका लागि मात्र प्रयोग हुन्छ र तेस्रो पक्षसँग साझेदारी गरिँदैन।',
    privacyRightsHeading: 'तपाईंका अधिकार',
    privacyRights:
      'तपाईं कुनै पनि बेला आफ्नो जानकारी मेटाउन वा सच्याउन अनुरोध गर्न सक्नुहुन्छ। सम्पर्क पृष्ठबाट हामीलाई इमेल गर्नुहोस्।',
    contactKicker: 'सम्पर्क',
    contactLead: 'सुझाव, सुधार वा समाचार टिप भए हामीलाई खबर गर्नुहोस्।',
    contactTipHeading: 'समाचार टिप',
    contactTip:
      'कुनै घटना वा कथा छ भने contact@nagarikwatch.com मा इमेल गर्नुहोस्। संवेदनशील टिपका लागि हामी सुरक्षित च्यानल उपलब्ध गराउँछौं।',
    contactCorrectionHeading: 'सच्याइ अनुरोध',
    contactCorrection:
      'प्रकाशित कथामा त्रुटि देख्नुभयो भने कृपया इमेल गर्नुहोस्। हामी तुरुन्त समीक्षा गर्छौं।',
    contactEmailLabel: 'इमेल',
    contactEmail: 'contact@nagarikwatch.com',
    contactPageHeading: 'अन्य सम्पर्क',
    footerDisclaimer:
      'यस साइटमा प्रकाशित सामग्री नागरिक वाचको सम्पादकीय निर्णयमा तयार पारिएको हो। समाचार सत्यता र सन्तुलनमा आधारित छ, तर प्रयोगकर्ताले आफ्नो विवेक प्रयोग गर्नुहोस्।',
    footerRegistration: 'प्रकाशन दर्ता',
    footerRegistrationPending: 'pending',
    footerCopyright: (year: number) => `© ${year} नागरिक वाच। सर्वाधिकार सुरक्षित।`,
    metaDescription:
      'नागरिक वाच (Nagarik Watch) — नेपालको नागरिककेन्द्रित, स्वतन्त्र र विश्वसनीय समाचार पोर्टल।',
    mastheadDate: (date: string) => date,
  },
  en: {
    siteName: 'Nagarik Watch',
    siteNameEn: 'Nagarik Watch',
    tagline: 'News through the eyes of the citizen',
    skipToContent: 'Skip to main content',
    primaryNav: 'Primary navigation',
    closeMenu: 'Close menu',
    openMenu: 'Open menu',
    search: 'Search',
    searchAria: 'Enter search',
    searchPlaceholder: 'Search titles, topics or authors…',
    searchHeading: 'Search',
    searchEmptyQuery: 'Type a query to search',
    searchEmptyHint: 'Search by title, author, topic or section. Devanagari or English both work.',
    searchNoResults: 'No results found.',
    searchNoResultsHint: 'Try another word or an author name.',
    searchClear: 'Clear search',
    searchRecent: 'Recent searches',
    searchResults: (n: number) => `${n} results`,
    home: 'Home',
    more: 'More',
    seeAll: 'See all',
    readMore: 'Read full story',
    localeToggleTo: 'नेपाली',
    localeToggleAria: 'नेपालीमा पढ्नुहोस्',
    themeToggleToLight: 'Light mode',
    themeToggleToDark: 'Dark mode',
    themeToggleLabel: 'Toggle theme',
    breakingLabel: 'Breaking',
    updatedAt: 'This article was updated',
    correctedAt: 'Corrected',
    correctionsHeading: 'Corrections',
    sourcePrefix: 'Source',
    aggregatedFrom: ', aggregated from',
    agencyReport: 'Agency report',
    readingTime: (n: number) => `${n} min read`,
    storyCount: (n: number) => `${n} article${n === 1 ? '' : 's'}`,
    authorCategories: 'Writes in',
    topicBackToCategory: 'Back to category',
    storyCountTopic: (n: number) => `${n} stor${n === 1 ? 'y' : 'ies'}`,
    shareLabel: 'Share',
    shareCopied: 'Copied',
    shareCopyLink: 'Copy link',
    shareFacebook: 'Share on Facebook',
    shareTwitter: 'Share on X',
    relatedStories: 'Related stories',
    authorStories: 'Stories by this author',
    topicStories: 'Stories on this topic',
    articleBy: 'By',
    publishedOn: 'Published',
    adLabel: 'Advertisement',
    page: 'Page',
    of: 'of',
    nextPage: 'Next page',
    prevPage: 'Previous page',
    notFoundHeading: 'Page not found',
    notFoundBody: 'The page you were looking for is not available right now.',
    notFoundHome: 'Back to home',
    errorHeading: 'Something went wrong',
    errorBody: 'There was a problem loading this page. Please try again.',
    errorRetry: 'Try again',
    emptyEnglish: 'This story is not available in English yet.',
    footerAbout: 'About us',
    footerEthics: 'Editorial policy',
    footerPrivacy: 'Privacy',
    footerContact: 'Contact',
    footerSections: 'Sections',
    aboutKicker: 'About us',
    aboutLead:
      'Nagarik Watch is a citizen-focused, independent and trustworthy news portal for Nepali readers. We put Devanagari first and ground every story in accuracy, balance and context.',
    aboutMissionHeading: 'Our mission',
    aboutMission:
      'Our job is to give Nepali citizens the information they need to make decisions, hold the powerful to account, and bring marginalised voices into the mainstream. Independent editorial judgement is our backbone.',
    aboutFundingHeading: 'Ownership and funding',
    aboutFunding:
      'Nagarik Watch is sustained by advertising and limited sponsored content. All sponsored content is clearly labelled and does not influence editorial decisions.',
    ethicsKicker: 'Editorial policy',
    ethicsLead:
      'This policy defines the rules for how we gather, edit and publish news. Reader trust is our most valuable asset.',
    ethicsAccuracyHeading: 'Accuracy and corrections',
    ethicsAccuracy:
      'When a factual error is found we correct it immediately and place a clear correction notice on the article. Every story is reviewed by at least one editor before publication.',
    ethicsSourcesHeading: 'Sources and attribution',
    ethicsSources:
      'We attribute the source of every claim. Aggregated or wire stories carry the original publisher name and link. Off-the-record information is used only for editorial judgement.',
    ethicsIndependenceHeading: 'Independence',
    ethicsIndependence:
      'Advertisers or sponsors do not influence editorial content. Coverage of officials or institutions with a conflict of interest is clearly disclosed.',
    privacyKicker: 'Privacy',
    privacyLead: 'This policy describes what information we collect about you and how we use it.',
    privacyAnalyticsHeading: 'Analytics',
    privacyAnalytics:
      'We use cookieless, privacy-friendly Plausible analytics which counts total visits without personally identifying anyone. You are not fingerprinted.',
    privacyContactHeading: 'Contact form',
    privacyContact:
      'If you fill in the contact form, your name and email are used only to respond to your request and are never shared with third parties.',
    privacyRightsHeading: 'Your rights',
    privacyRights:
      'You may request deletion or correction of your information at any time. Email us via the contact page.',
    contactKicker: 'Contact',
    contactLead: 'Tell us about suggestions, corrections or a news tip.',
    contactTipHeading: 'News tip',
    contactTip:
      'Have an event or story? Email contact@nagarikwatch.com. For sensitive tips we can provide a secure channel.',
    contactCorrectionHeading: 'Correction request',
    contactCorrection:
      'Spotted an error in a published story? Please email us. We review immediately.',
    contactEmailLabel: 'Email',
    contactEmail: 'contact@nagarikwatch.com',
    contactPageHeading: 'Other contact',
    footerDisclaimer:
      'Content published on this site is produced under the editorial discretion of Nagarik Watch. Reporting is grounded in accuracy and balance, but readers should exercise their own judgement.',
    footerRegistration: 'Publication registration',
    footerRegistrationPending: 'pending',
    footerCopyright: (year: number) => `© ${year} Nagarik Watch. All rights reserved.`,
    metaDescription:
      'Nagarik Watch — a citizen-focused, independent and trustworthy news portal from Nepal.',
    mastheadDate: (date: string) => date,
  },
} as const

export type DictionaryKey = keyof (typeof dictionary)['ne']
export type Dictionary = (typeof dictionary)[Locale]

/**
 * Resolve a key for a locale. Throws on unknown key (compile-time safety via DictionaryKey);
 * the generic keeps string-returning and function keys usable without casting at call sites.
 */
export function getDictionary<L extends Locale>(locale: L): (typeof dictionary)[L] {
  return dictionary[locale]
}
