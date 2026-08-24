import type { StoredArticle } from '../json-store'
import { base, p, h2, list, isoDaysAgo } from './_helpers'

/**
 * Evergreen service/explainer journalism written from stable public facts.
 * No derived reporting, no invented figures, dates or quotes.
 */
export function editionService(): StoredArticle[] {
  return [
    base({
      id: 'art-svc-1',
      slug: 'svc-nepse-trading-hours-order-flow',
      categorySlug: 'business',
      titleNe: 'शेयर बजारको कारोबार समय र अर्डर मिल्ने प्रक्रिया',
      titleEn: 'How NEPSE trading hours and order flow work',
      deckNe: 'पूर्व खुला अवधि, अर्डरको प्राथमिकता र दुई कारोबार दिनको वसूली प्रक्रिया यहाँ सरल भाषामा छ।',
      deckEn: 'Pre-open pricing, order priority and two-day settlement explained for new investors.',
      publishedAt: isoDaysAgo(0, 9),
      updatedAt: isoDaysAgo(0, 9),
      isFeatured: 'none',
      tagSlugs: [],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'नेपाल स्टक एक्सचेन्जमा कारोबार आइतबारदेखि बिहीबारसम्म हुन्छ। बिहान ११ बजे खुल्छ र दिउँसो ३ बजे बन्द हुन्छ।',
        ),
        p(
          'बजार खुल्नुअघि पूर्व खुला अवधि हुन्छ। त्यहाँ जम्मा भएका किन्ने र बेच्ने अर्डरबाट दिनको सुरुवाती मूल्य निर्धारण हुन्छ।',
        ),
        p(
          'सामान्य कारोबारमा लगानीकर्ताले दलालमार्फत अर्डर पठाउँछन्। प्रणालीले किन्ने र बेच्ने अर्डर स्वतः मिलाउँछ।',
        ),
        h2('अर्डर मिल्ने क्रम'),
        list([
          'बढी मूल्य तिर्ने किन्ने अर्डर पहिले मिल्छ',
          'घटी मूल्यमा दिने बेच्ने अर्डर पहिले मिल्छ',
          'एउटै मूल्यमा पहिले पठाइएको अर्डर पहिले मिल्छ',
        ]),
        p(
          'कारोबार पक्का भएपछि भुक्तानी र शेयर हस्तान्तरण दुई कारोबार दिनभित्र पूरा हुन्छ। यही कारण सेल्स पछि रकम खातामा आउन समय लाग्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('NEPSE trades weekday mornings with a pre-open auction, automatic order matching and two-day settlement.')],
    }),
    base({
      id: 'art-svc-2',
      slug: 'svc-remittance-fees-formal-informal',
      categorySlug: 'business',
      titleNe: 'रेमिट्यान्स शुल्क: बैंक, ट्रान्सफर कम्पनी र अनौपचारिक माध्यमको फरक',
      titleEn: 'Remittance costs: banks, transfer companies and informal channels',
      deckNe: 'वैध माध्यममा कमिसन शून्य हुनु राष्ट्र बैंकको निर्देशन हो। तर विनिमय दरको फरकले थप खर्च बनाउन सक्छ।',
      deckEn: 'Zero commission applies on formal inflows; the exchange rate gap decides the real cost.',
      publishedAt: isoDaysAgo(0, 12),
      updatedAt: isoDaysAgo(0, 12),
      isFeatured: 'none',
      tagSlugs: ['labour-migration'],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'विदेशबाट पैसा ल्याउने मुख्य माध्यम तीन छन्। बैंक, अनुमतिप्राप्त रेमिट्यान्स कम्पनी र अनौपचारिक च्यानल।',
        ),
        p(
          'नेपाल राष्ट्र बैंकले बैंक तथा वित्तीय संस्थाले पठाइएको रकम शून्य कमिसनमा उपलब्ध गराउनुपर्छ भन्ने निर्देशन दिएको छ।',
        ),
        p(
          'तर प्रत्येक सेवा प्रदायकको विनिमय दर फरक हुन्छ। त्यही फरकले ग्राहकले वास्तवमा बेहोर्ने खर्च निर्धारण गर्छ।',
        ),
        h2('अनौपचारिक माध्यमको जोखिम'),
        list(['रसीद र अभिलेख नहुने', 'कानुनी जटिलता भोग्नुपर्ने', 'रकम हराउँदा दाबी गर्न नसकिने']),
        p(
          'सेवा लिनुअघि दर तुलना गर्ने, रसीद राख्ने र आफ्नै खातामा भुक्तानी लिने अभ्यास सुरक्षित मानिन्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Formal remittance arrives commission-free under the central bank directive, while the hidden cost sits in the exchange rate.')],
    }),
    base({
      id: 'art-svc-3',
      slug: 'svc-mobile-data-balance-check',
      categorySlug: 'technology',
      titleNe: 'मोबाइल डाटा ब्यालेन्स हेर्ने सजिलो तरिका',
      titleEn: 'How to check your mobile data balance',
      deckNe: 'डायल कोड, अपरेटर एप र सहयोगी नम्बरबाट मौज्दात थाहा पाउन सकिन्छ। कोड समयसँगै परिवर्तन हुन सक्छ।',
      deckEn: 'Dial codes, operator apps and helplines make balance checks quick.',
      publishedAt: isoDaysAgo(0, 15),
      updatedAt: isoDaysAgo(0, 15),
      isFeatured: 'none',
      tagSlugs: [],
      reportingLocation: 'विराटनगर',
      province: 'koshi',
      bodyNe: [
        p(
          'डाटा सकिएपछि अचानक इन्टरनेट काटिनु सामान्य समस्या हो। ब्यालेन्स नियमित हेर्दा यस्तो झन्झट घट्छ।',
        ),
        p('एनटीसी प्रिपेडमा *400# डायल गर्दा मुख्य मौज्दात देखिन्छ।'),
        p(
          'एनसेलमा *900# डायल गर्दा पनि मुख्य ब्यालेन्स देखिन्छ। दुवै अपरेटरको आफ्नै मोबाइल एपमा डाटा प्याकको बाँकी मात्रा विस्तृत देखिन्छ।',
        ),
        h2('थप उपाय'),
        list([
          'अपरेटरको आधिकारिक एप प्रयोग गर्ने',
          'सहयोगी नम्बरबाट सोध्ने',
          'प्याक सकिने मिति एपमा जाँच्ने',
        ]),
        p(
          'डायल कोड र सेवा शर्त समयसँगै अद्यावधिक हुन सक्छन्। अन्तिम जानकारी अपरेटरको आधिकारिक स्रोतबाट पुष्टि गर्नुहोस्।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Dial codes and operator apps remain the quickest way to track mobile data balance.')],
    }),
    base({
      id: 'art-svc-4',
      slug: 'svc-password-two-factor-guide',
      categorySlug: 'technology',
      titleNe: 'बलियो पासवर्ड र दुई चरणीय प्रमाणीकरणको सरल नियम',
      titleEn: 'Strong passwords and two-factor setup, made practical',
      deckNe: 'हरेक खातामा छुट्टै लामो पासवर्ड र सत्यापन चरण थप्दा खाता चोरीको जोखिम घट्छ।',
      deckEn: 'Long unique passphrases plus a second verification step cut takeover risk.',
      publishedAt: isoDaysAgo(0, 17),
      updatedAt: isoDaysAgo(0, 17),
      isFeatured: 'none',
      tagSlugs: [],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'एउटै पासवर्ड धेरै खातामा प्रयोग गर्दा एउटा साइटको चुहावटले सबै खाता जोखिममा पर्छ।',
        ),
        p(
          'बलियो पासवर्ड लामो र अनुमान गर्न कठिन हुन्छ। शब्दहरू जोडेर बनाइएको लामो वाक्यांश प्रभावकारी हुन्छ।',
        ),
        p('जन्ममिति, फोन नम्बर र सजिलो क्रम प्रयोग गर्नु हुँदैन।'),
        h2('दुई चरणीय प्रमाणीकरण'),
        list([
          'इमेल र बैंकिङ खातामा पहिले सक्रिय गर्ने',
          'प्रमाणीकरण एप वा एसएमएस कोड रोज्ने',
          'ब्याकअप कोड सुरक्षित राख्ने',
        ]),
        p(
          'अपरिचित लिंकबाट पासवर्ड सोध्ने पृष्ठ फिसिङ हुन सक्छ। संस्थाले पासवर्ड सोध्दैनन् भन्ने आधारभूत नियम हो।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Unique long passphrases and a second verification step protect email and banking accounts.')],
    }),
    base({
      id: 'art-svc-5',
      slug: 'svc-monsoon-waterborne-disease-prevention',
      categorySlug: 'health',
      titleNe: 'मनसुनमा पानीजन्य रोगबाट बच्ने आधारभूत उपाय',
      titleEn: 'Monsoon basics: keeping waterborne disease away',
      deckNe: 'पानी उमाल्ने, हात सफा गर्ने र झाडापखाला सुरु हुनासाथ ओआरएस दिने अभ्यासले गम्भीर अवस्था रोक्छ।',
      deckEn: 'Boiled water, handwashing and early ORS use prevent serious dehydration.',
      publishedAt: isoDaysAgo(1, 8),
      updatedAt: isoDaysAgo(1, 8),
      isFeatured: 'none',
      tagSlugs: ['climate'],
      reportingLocation: 'बिरगञ्ज',
      province: 'madhesh',
      bodyNe: [
        p(
          'मनसुनमा पानीका स्रोत दूषित हुन सजिलो हुन्छ। झाडापखाला र टाइफाइडजस्ता रोग यही सिजनमा प्रायः बढ्छन्।',
        ),
        p(
          'पिउने पानी राम्ररी उमालेर ढाकेर राख्नु भरपर्दो उपाय हो। उमालिएको पानी चिसो भएपछि सफा भाँडामा राख्नुपर्छ।',
        ),
        p(
          'भोजन बनाउनुअघि, खानुअघि र शौचपछि साबुनले हात धुने बानीले सङ्क्रमण फैलिन रोक लगाउँछ।',
        ),
        h2('ओआरएस कहिले र कसरी'),
        list([
          'पहिलो पटक पातलो दिसा लाग्नासाथ ओआरएस सुरु गर्ने',
          'सफा उमालेको पानीमा प्याकेट भरेअनुसार मिसाउने',
          'बिरामीलाई थोरै थोरै गरी निरन्तर दिने',
        ]),
        p(
          'दिसा रोकिन्न, दिसामा रगत देखिन्छ वा बिरामी निकै कमजोर देखिए नजिकको स्वास्थ्य संस्था जानुपर्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Boiling water, washing hands and giving ORS early prevent monsoon waterborne illness.')],
    }),
    base({
      id: 'art-svc-6',
      slug: 'svc-dengue-warning-signs-hospital',
      categorySlug: 'health',
      titleNe: 'डेंगुका लक्षण र अस्पताल जानुपर्ने संकेत',
      titleEn: 'Dengue symptoms and when hospital care is needed',
      deckNe: 'ज्वरो ओर्लेपछि पनि पेट दुख्ने, बान्ता हुने र पिसाब घट्ने लक्षण देखिए ढिलाइ नगर्नु जरुरी छ।',
      deckEn: 'Warning signs often appear as the fever settles; timely care prevents complications.',
      publishedAt: isoDaysAgo(1, 11),
      updatedAt: isoDaysAgo(1, 11),
      isFeatured: 'none',
      tagSlugs: ['climate'],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'डेंगु एडिज प्रजातिको लामखुट्टेको टोकाइबाट सर्छ। यो लामखुट्टे दिउँसो टोक्ने प्रवृत्ति राख्छ।',
        ),
        p(
          'सामान्यतया अचानक आउने उच्च ज्वरो, टाउको दुख्ने, शरीर र जोर्नी दुख्ने लक्षण देखिन्छन्। कतिपय बिरामीमा आँखाको पछाडि दुखाइ र छालामा रातो दाग पनि देखिन्छ।',
        ),
        h2('अस्पताल जानुपर्ने संकेत'),
        list([
          'ज्वरो घटेपछि पनि बढ्दो पेट दुखाइ',
          'बारम्बार बान्ता हुने',
          'गिजा वा नाकबाट रगत बग्ने',
          'पिसाब कम हुने र अत्यधिक कमजोरी',
        ]),
        p(
          'ज्वरोमा प्यारासिटामोल सुरक्षित मानिन्छ। रगत पातलो हुने जोखिम बढाउने औषधि आफैँ रोज्नु हुँदैन।',
        ),
        p(
          'घर आसपासका भाँडा, टायर र टंकीमा जम्मा भएको पानी नियमित खाली गर्दा लामखुट्टे फैलिन रोक लाग्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('High fever with body pain suggests dengue, and warning signs require immediate hospital care.')],
    }),
    base({
      id: 'art-svc-7',
      slug: 'svc-national-id-enrollment-renewal',
      categorySlug: 'society',
      titleNe: 'राष्ट्रिय परिचयपत्र बनाउने र नवीकरण गर्ने प्रक्रिया',
      titleEn: 'Getting and renewing the national ID card',
      deckNe: 'स्थानीय तहको कार्यालयमा बायोमेट्रिक विवरण दर्ता गराउनुपर्छ। विवरण सच्याउने र गुमेको कार्ड फिर्ताको प्रक्रिया छुट्टै हुन्छ।',
      deckEn: 'Biometric enrollment runs through local offices; corrections follow a separate process.',
      publishedAt: isoDaysAgo(2, 9),
      updatedAt: isoDaysAgo(2, 9),
      isFeatured: 'none',
      tagSlugs: [],
      reportingLocation: 'पोखरा',
      province: 'gandaki',
      bodyNe: [
        p(
          'राष्ट्रिय परिचयपत्र नेपाली नागरिकको पहिचान एकै नम्बरमा जोड्ने सरकारी कार्ड हो। यसमा फोटो, औठो छाप र आँखाको विवरण राखिन्छ।',
        ),
        p(
          'आवेदन प्रायः स्थानीय तहको कार्यालयबाट लिइन्छ। सुविधा उपलब्ध भए अनलाइन पूर्वदर्ता गरेर समय बचाउन सकिन्छ।',
        ),
        p(
          'नागरिकताको प्रमाणपत्र र तोकिएका कागजातसहित नजिकको दर्ता केन्द्र पुग्नुपर्छ। त्यहाँ फोटो खिचेर औठो छाप र आँखाको विवरण लिइन्छ।',
        ),
        h2('सामान्य प्रक्रिया'),
        list(['फारम वा अनलाइनबाट आवेदन', 'कागजात जाँच र बायोमेट्रिक दर्ता', 'रसिद अनुसार कार्ड संकलन']),
        p(
          'नाम वा ठेगाना सच्याउन र गुमेको कार्ड फिर्ताका लागि सोही कार्यालयमा निवेदन दिनुपर्छ। शुल्क र समय अवधि कार्यालयको सूचनाअनुसार फरक पर्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('National ID enrollment needs biometric registration at local offices, with separate steps for corrections.')],
    }),
    base({
      id: 'art-svc-8',
      slug: 'svc-monsoon-highway-safety-checklist',
      categorySlug: 'society',
      titleNe: 'मनसुनमा राजमार्ग यात्राको सुरक्षा जाँचसूची',
      titleEn: 'A monsoon safety checklist for highway travel',
      deckNe: 'यात्राअघि बाटोको अवस्था थाहा लिने, दिउँसो यात्रा गर्ने र गाडीको प्राविधिक जाँच गर्ने बानीले जोखिम घटाउँछ।',
      deckEn: 'Route checks, daylight schedules and vehicle inspection lower risk on wet roads.',
      publishedAt: isoDaysAgo(2, 14),
      updatedAt: isoDaysAgo(2, 14),
      isFeatured: 'none',
      tagSlugs: ['climate'],
      reportingLocation: 'चितवन',
      province: 'bagmati',
      bodyNe: [
        p(
          'मनसुनमा पहिरो, बाढी र भीरमा चिप्लिने खतरा बढ्छ। यात्रा योजना बनाउनुअघि बाटोको ताजा अवस्था थाहा लिनुपर्छ।',
        ),
        p(
          'प्रहरी र यातायात कार्यालयको सूचना, स्थानीय सञ्चारमाध्यम र सोही बाटो अघिल्लै गएका यात्रुको अनुभव भरपर्दा स्रोत हुन्।',
        ),
        h2('यात्रा अघि जाँच्ने'),
        list([
          'मौसम पूर्वानुमान र बाटो खुला छ कि छैन',
          'ब्रेक, टायर, लाइट र वाइपरको अवस्था',
          'दिउँसो यात्रा सकिने गरी समय तालिका',
        ]),
        p(
          'रातको यात्रा, पहिरो जोनमा रोकेर फोटो खिच्ने र बगैंचा वा नदी किनारमा बस्ने गतिविधि जोखिमपूर्ण हुन्छ।',
        ),
        p(
          'बसयात्रुले अति भीड गरिएको साधन रोज्नु हुँदैन। सिट बेल्ट बाँध्ने र चालकलाई सुरक्षाको सम्झाउने अभ्यास सबै यात्रुको भूमिका हो।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Check route status, inspect the vehicle and plan daylight travel before monsoon highway trips.')],
    }),
    base({
      id: 'art-svc-9',
      slug: 'svc-exchange-rates-remittance-receiving',
      categorySlug: 'world',
      titleNe: 'विनिमय दरले रेमिट्यान्स कसरी घटबढ गर्छ',
      titleEn: 'How exchange rates shape what families receive',
      deckNe: 'पठाइएको विदेशी मुद्रा नेपाली रुपैयाँमा सेवा प्रदायकको दरले सट्टा हुन्छ। त्यही दरले हातमा आउने रकम निर्धारण गर्छ।',
      deckEn: 'The conversion rate, not just the fee, decides the final rupee amount.',
      publishedAt: isoDaysAgo(3, 10),
      updatedAt: isoDaysAgo(3, 10),
      isFeatured: 'none',
      tagSlugs: ['labour-migration'],
      reportingLocation: 'बिरगञ्ज',
      province: 'madhesh',
      bodyNe: [
        p(
          'परिवारले डलर वा दिराममा पठाए पनि नेपालमा भुक्तानी रुपैयाँमै मिल्छ। दुवै मुद्रा जोड्ने दर नै निर्णायक हुन्छ।',
        ),
        p(
          'विनिमय दर बजारमा दैनिक घटबढ हुन्छ। राष्ट्र बैंकले सन्दर्भ दर सार्वजनिक गर्छ, सेवा प्रदायकले त्यसमा थोरै फरक राख्छ।',
        ),
        p(
          'कमिसन शून्य भए पनि दरको फरकले खर्च बनाउन सक्छ। त्यसैले एउटै दिनमा पनि प्रदायकबीच तुलना गर्नु उपयोगी हुन्छ।',
        ),
        h2('दर तुलना गर्दा हेर्ने'),
        list(['प्रदायकले दिने वास्तविक दर', 'भुक्तानी पुग्ने समय', 'रसीद र अभिलेखको व्यवस्था']),
        p(
          'दर बढ्दा परिवारले थोरै रकम थप पाउँछन्, घट्दा कम पाउँछन्। ठूलो रकम पठाउँदा दिनको दर हेरेर समय रोज्न सकिन्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Daily exchange rates decide how many rupees reach families, so comparing providers pays off.')],
    }),
    base({
      id: 'art-svc-10',
      slug: 'svc-saarc-visa-exemption-explainer',
      categorySlug: 'world',
      titleNe: 'सार्क भिसा छूट योजना: नेपाली यात्रुका लागि दायरा',
      titleEn: 'What the SAARC visa exemption covers for Nepali travellers',
      deckNe: 'तोकिएका पद र पेसाका व्यक्तिलाई मात्र छूट स्टिकर मिल्छ। सामान्य पर्यटकले नियमित भिसा नै लिनुपर्छ।',
      deckEn: 'Exemption stickers serve listed officials and professions, not general tourists.',
      publishedAt: isoDaysAgo(3, 12),
      updatedAt: isoDaysAgo(3, 12),
      isFeatured: 'none',
      tagSlugs: ['geopolitics'],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'सार्कका सदस्य मुलुकबीच भिसा छूट योजना सञ्चालनमा छ। यसअन्तर्गत तोकिएका वर्गलाई छूट स्टिकर दिइन्छ।',
        ),
        p(
          'प्रायः मन्त्री, सांसद, न्यायाधीश, सरकारी पदाधिकारी, प्राध्यापक, पत्रकार र खेलाडीजस्ता वर्ग यसको दायरामा पर्छन्। पात्र वर्ग र बसाइ अवधि देशगत समझदारीअनुसार फरक हुन्छ।',
        ),
        p(
          'छूट आफ्नै देशका लागि लागू हुँदैन। नेपाली नागरिकले यो सुविधा अन्य सार्क मुलुक जाँदा मात्र पाउँछन्।',
        ),
        h2('स्टिकर कसरी मिल्छ'),
        list([
          'सम्बन्धित मन्त्रालय वा निकायबाट सिफारिस',
          'तोकिएको ढाँचामा आवेदन',
          'निर्धारित प्रक्रियाबाट स्टिकर जारी',
        ]),
        p(
          'यो योजना पर्यटक भिसाको विकल्प होइन। आफन्त भ्रमण वा घुम्न जाने नागरिकले नियमित भिसा प्रक्रिया नै अपनाउनुपर्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('SAARC visa exemption stickers cover designated officials and professionals, not general tourists.')],
    }),
    base({
      id: 'art-svc-11',
      slug: 'svc-nepal-domestic-cricket-structure',
      categorySlug: 'sports',
      titleNe: 'नेपालको घरेलु क्रिकेट संरचना कस्तो छ',
      titleEn: 'How the domestic cricket pyramid works',
      deckNe: 'जिल्लादेखि प्रदेश हुँदै पीएम कप र फ्रेन्चाइज टी ट्वान्टीसम्म पुग्ने मार्ग राष्ट्रिय छनोटको आधार हो।',
      deckEn: 'District selection feeds provincial sides, the PM Cup and the franchise stage.',
      publishedAt: isoDaysAgo(3, 15),
      updatedAt: isoDaysAgo(3, 15),
      isFeatured: 'none',
      tagSlugs: ['nepal-cricket'],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'नेपालमा घरेलु क्रिकेट जिल्ला र प्रदेशस्तरबाट सुरु हुन्छ। चरणबद्ध छनोट हुँदै राष्ट्रिय टोलीको दलबन्दीसम्म पुगिन्छ।',
        ),
        p(
          'प्रधानमन्त्री वनडे कप देशको प्रमुख घरेलु एकदिवसीय प्रतियोगिता हो। प्रदेश र क्षेत्रीय टोलीबीच हुने यसै प्रतियोगिताको प्रदर्शनले राष्ट्रिय छनोटमा ठूलो भूमिका खेल्छ।',
        ),
        p(
          'फ्रेन्चाइज आधारको टी ट्वान्टी प्रिमियर लिगले युवा खेलाडीलाई ठूलो मञ्च र सम्झौताको अवसर दिन्छ। यसले घरेलु खेलाडीलाई अन्तर्राष्ट्रिय खेलाडीसँग खेल्ने मौका पनि दिन्छ।',
        ),
        h2('खेलाडीको मार्ग'),
        list([
          'जिल्ला तथा उमेर समूहको छनोट',
          'प्रदेश टोलीबाट घरेलु सिजन',
          'पीएम कप र लिग प्रदर्शनबाट राष्ट्रिय दलबन्दी',
        ]),
        p(
          'घरेलु प्रदर्शनको अभिलेख राख्ने र ऋतुभरि नियमित खेल्ने बानी छनोटको आधार बन्छ। संरचना र प्रतियोगिताको नाम समयसँगै परिवर्तन हुन सक्ने भएकाले क्रिकेट संघको आधिकारिक सूचना हेर्नु उपयोगी हुन्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Players rise from district and provincial teams through the PM Cup toward the national side.')],
    }),
    base({
      id: 'art-svc-12',
      slug: 'svc-football-transfer-windows-clubs',
      categorySlug: 'sports',
      titleNe: 'फुटबल ट्रान्सफर विन्डो र नेपाली क्लबको योजना',
      titleEn: 'Football transfer windows and what they mean for clubs',
      deckNe: 'खेलाडी दर्ता तोकिएको समयखण्डमा मात्र हुन्छ। त्यही अवधिले क्लबको गोठ, बजेट र पूर्वतयारी निर्धारण गर्छ।',
      deckEn: 'Registration periods decide squad building, budgets and pre-season planning.',
      publishedAt: isoDaysAgo(1, 16),
      updatedAt: isoDaysAgo(1, 16),
      isFeatured: 'none',
      tagSlugs: [],
      reportingLocation: 'काठमाडौं',
      province: 'bagmati',
      bodyNe: [
        p(
          'ट्रान्सफर विन्डो भनेको क्लबले नयाँ खेलाडी दर्ता गराउन पाउने तोकिएको अवधि हो। वर्षमा प्रायः दुई खण्ड हुन्छन्।',
        ),
        p(
          'नेपालमा राष्ट्रिय संघको निर्देशनअनुसार दर्ता अवधि तय हुन्छ। अवधि मिलाउँदा अन्तर्राष्ट्रिय क्यालेन्डरसँग मेल खाने गरिन्छ।',
        ),
        p(
          'विन्डो बन्द भएपछि क्लबले स्थायी हस्तान्तरण गर्न पाउँदैन। सम्झौता सकिएका खेलाडी भने तोकिएको प्रक्रियामा जुनसुकै बेला नयाँ क्लबसँग जोडिन सक्छन्।',
        ),
        h2('क्लबमा पर्ने असर'),
        list([
          'पूर्वतयारी नै गोठ निर्माणको मुख्य समय बन्छ',
          'ढिलो भित्रिएका खेलाडीको तालमेल कठिन हुन्छ',
          'बजेट विभाजन अवधि सुरु हुनुअघि सक्नुपर्छ',
        ]),
        p(
          'सामान्यतया नेपाली क्लबले घरेलु र विदेशी खेलाडी दुवै यही अवधिमा भित्र्याउँछन्। दर्ता प्रक्रिया समयमै पूरा नभए लिगमा खेल्ने योग्यता प्रश्नमा पर्न सक्छ।',
        ),
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [p('Transfer windows fix when clubs can register players, shaping squads and budgets alike.')],
    }),
  ]
}
