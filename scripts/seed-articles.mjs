#!/usr/bin/env node
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const STORE_FILE = resolve(__dirname, '../apps/web/data/articles.json')
const PUBLISH = process.argv.includes('--publish')

const genId = () => `art-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
const baseTime = Date.now()
const p = (text) => ({ type: 'paragraph', text })
const h2 = (text) => ({ type: 'heading2', text })
const quote = (text) => ({ type: 'pullQuote', quoteNe: text })
const list = (items) => ({ type: 'list', ordered: false, items })

function estimate(blocks) {
  const w = blocks
    .map((b) =>
      b.type === 'paragraph' || b.type === 'heading2' || b.type === 'heading3'
        ? b.text
        : b.type === 'pullQuote'
          ? b.quoteNe
          : b.type === 'list'
            ? b.items.join(' ')
            : '',
    )
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(w / 200))
}

const EDITOR = 'aut-srijana'
const articles = [
  {
    id: genId(),
    slug: 'parliament-budget-session-2083',
    categorySlug: 'politics',
    titleNe: 'संसदको बजेट अधिवेशन सुरु: प्रमुख एजेन्डा र अपेक्षा',
    deckNe:
      'संघीय संसदको बजेट अधिवेशन शुरु भएको छ। आगामी आर्थिक वर्षको बजेट पारित गर्नु मुख्य उद्देश्य रहेको छ।',
    bodyNe: [
      p(
        'संघीय संसदको बजेट अधिवेशन औपचारिक रूपमा सुरु भएको छ। आगामी आर्थिक वर्ष २०८३/८४ को वार्षिक बजेट पारित गर्नु यस अधिवेशनको प्रमुख उद्देश्य हो।',
      ),
      h2('प्रमुख एजेन्डा'),
      p(
        'अधिवेशनमा बजेट प्रस्ताव, उप-विधेयकहरूको पारित, र सांसदहरूको प्रश्नोत्तर कार्यक्रम समावेश छन्। सरकारले आर्थिक सुधार, पूर्वाधार विस्तार, र सामाजिक सुरक्षामा लगानी बढाउने प्रतिबद्धता जनाएको छ।',
      ),
      quote('बजेटले जनताको मुटु छोनुपर्छ, खाली अंक खोज्ने होइन।'),
      h2('प्रतिपक्षको अवस्था'),
      p(
        'प्रतिपक्षी दलहरूले बजेट प्रस्तावमा छलफल गर्न समय पर्याप्त हुनुपर्ने माग गरेका छन्। अघिल्लो बजेटको कार्यान्वयन प्रगति समीक्षा गर्न पनि जोड दिएका छन्।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['local-election'],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 3600000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'local-election-voter-education',
    categorySlug: 'politics',
    titleNe: 'स्थानीय निर्वाचन तयारी: मतदाता शिक्षा अभियान बलियो बनाउने आह्वान',
    deckNe: 'निर्वाचन आयोगले मतदाता शिक्षा अभियान तीव्र बनाउनुपर्ने आह्वान गरेको छ।',
    bodyNe: [
      p(
        'निर्वाचन आयोगले स्थानीय तहको सम्भावित निर्वाचनका लागि मतदाता शिक्षा अभियान थप प्रभावकारी बनाउनुपर्ने बताएको छ।',
      ),
      h2('मतदाता दर्ता'),
      p(
        'आयोगले मतदाता दर्ता अभियान निरन्तर जारी राखेको छ। नयाँ मतदातालाई दर्ता गराउन र विवरण अपडेट गर्न जिल्ला निर्वाचन कार्यालयमा सेवा उपलब्ध छ।',
      ),
      list([
        'मतदाता परिचयपत्र वितरण जारी',
        'नयाँ दर्ताका लागि अनलाइन सेवा',
        'विवरण गलत भएमा सच्याउने प्रक्रिया खुला',
      ]),
      p('नागरिक समाजका प्रतिनिधिले मतदाता शिक्षालाई निर्वाचनको आत्मा मानेका छन्।'),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['local-election'],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 7200000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'remittance-growth-2083',
    categorySlug: 'business',
    titleNe: 'रेमिट्यान्स प्रवाहमा वृद्धि: अर्थतन्त्रमा सकारात्मक संकेत',
    deckNe: 'गत आर्थिक वर्षमा रेमिट्यान्स प्रवाहमा उल्लेख्य वृद्धि भएको छ।',
    bodyNe: [
      p(
        'नेपाल राष्ट्र बैंकको तथ्यांक अनुसार गत आर्थिक वर्षमा रेमिट्यान्स प्रवाहमा उल्लेख्य वृद्धि भएको छ। विदेशमा कार्यरत नेपालीहरूले पठाएको रकमले विप्रेषण अर्थतन्त्रलाई टेवा पुगेको हो।',
      ),
      h2('मुख्य तथ्यांक'),
      p(
        'राष्ट्र बैंकको तथ्यांक अनुसार रेमिट्यान्स आयमा गत वर्षको तुलनामा दोहोरो अंकीय वृद्धि देखिएको छ। मुख्य श्रम गन्तव्य देशहरू खाडी मुलुक, मलेसिया, र दक्षिण कोरियाबाट प्रवाह बढेको हो।',
      ),
      quote(
        'रेमिट्यान्स नेपाली अर्थतन्त्रको मेरुदण्ड हो, तर दिगो विकासका लागि उत्पादन क्षेत्र बलियो हुनुपर्छ।',
      ),
      h2('चुनौती'),
      p(
        'रेमिट्यान्समा मात्र अति निर्भरताले दिगो अर्थतन्त्र बनाउन नसकिने अर्थशास्त्रीहरूले बताउँछन्। उत्पादन क्षेत्रको विस्तार, कृषिको आधुनिकीकरण, र रोजगारी सिर्जनामा ध्यान दिनुपर्ने उनीहरूको सुझाव छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['budget-2083'],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 10800000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'nepse-market-analysis',
    categorySlug: 'business',
    titleNe: 'नेप्से सूचकांकमा उतारचढाव: लगानीकर्ताले के ध्यान दिने?',
    deckNe: 'नेपाल धितोपत्र बजारको सूचकांकमा हालै उतारचढाव देखिएको छ।',
    bodyNe: [
      p(
        'नेपाल धितोपत्र बजार (नेप्से) को सूचकांकमा हालैका दिनमा उतारचढाव देखिएको छ। केही क्षेत्रका सेयरमा कारोबार बढेको भए पनि समग्रमा बजार स्थिर छ।',
      ),
      h2('कारोबार अवस्था'),
      p(
        'दैनिक कारोबार रकममा उतारचढाव छ। वाणिज्य बैंक, जीवन बीमा, र उत्पादन क्षेत्रका सेयरमा रुचि देखिएको छ।',
      ),
      list([
        'वाणिज्य बैंक सेयरमा कारोबार बढी',
        'जीवन बीमा क्षेत्रमा रुचि',
        'उत्पादन क्षेत्र मिश्रित अवस्था',
      ]),
      p(
        'बजार विश्लेषकहरूले छोटो अवधिको उतारचढावमा नडराई दीर्घकालीन दृष्टिकोणले लगानी गर्न सुझाव दिएका छन्।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['budget-2083'],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 14400000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'global-climate-summit',
    categorySlug: 'world',
    titleNe: 'विश्व जलवायु शिखर सम्मेलन: सहयोग र प्रतिबद्धताको समीक्षा',
    deckNe:
      'विश्व नेताहरूको जलवायु शिखर सम्मेलनमा उत्सर्घटन र जलवायु वित्तको आवरणमा प्रगति र चुनौती दुवै देखिएका छन्।',
    bodyNe: [
      p(
        'हालै सम्पन्न विश्व जलवायु शिखर सम्मेलनमा विकसित र विकासोन्मुख देशहरूबीच उत्सर्घटन घटाउने प्रतिबद्धता र जलवायु वित्तको व्यवस्थाबारे छलफल भयो।',
      ),
      h2('मुख्य सहमति'),
      p(
        'सम्मेलनमा नवीकरणीय ऊर्जा विस्तार, कार्बन उत्सर्घटन घटाउने लक्ष्य, र जलवायु परिवर्तनबाट प्रभावित देशहरूलाई वित्तीय सहयोग बढाउने विषयमा सहमति जनाइयो।',
      ),
      quote('जलवायु परिवर्तन सीमानाको समस्या होइन, विश्वव्यापी चुनौती हो।'),
      h2('नेपालको सरोकार'),
      p(
        'हिमालय क्षेत्रको हिउँ पग्लिने, हिमताल फुट्ने जोखिम, र कृषि उत्पादनमा असर पर्ने भएकाले नेपाल जलवायु परिवर्तनको अग्रणी प्रभावित देशमा पर्छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['climate'],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 18000000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'nepal-cricket-team-preparation',
    categorySlug: 'sports',
    titleNe: 'नेपाली क्रिकेट टोलीको तयारी: आगामी प्रतियोगितामा आशा',
    deckNe:
      'नेपाली राष्ट्रिय क्रिकेट टोलीले आगामी अन्तर्राष्ट्रिय प्रतियोगिताका लागि तयारी तीव्र बनाएको छ।',
    bodyNe: [
      p(
        'नेपाली राष्ट्रिय क्रिकेट टोलीले आगामी अन्तर्राष्ट्रिय प्रतियोगिताका लागि तयारी तीव्र बनाएको छ। प्रशिक्षण सत्र र अभ्यास खेलमा टोलीको फोकस देखिन्छ।',
      ),
      h2('टोलीको संरचना'),
      p(
        'टोलीमा अनुभवी र युवा खेलाडीको मिश्रण छ। ब्याटिङ, बलिङ, र फिल्डिङ तीनै विभागमा सन्तुलन कायम गर्न प्रशिक्षकले जोड दिएका छन्।',
      ),
      list(['ब्याटिङ विभागको सुदृढीकरण', 'बलिङमा विविधता र गति', 'फिल्डिङ स्तरमा सुधार']),
      p('खेलाडीहरूले राष्ट्रिय टोलीमा स्थान बनाउन उत्कृष्ट प्रदर्शन गरिरहेका छन्।'),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['nepal-cricket'],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 21600000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'education-quality-improvement',
    categorySlug: 'society',
    titleNe: 'शिक्षा गुणस्तर सुधार: सामुदायिक विद्यालयमा नयाँ पहल',
    deckNe: 'सामुदायिक विद्यालयको शिक्षा गुणस्तर सुधारका लागि नयाँ पहल सुरु गरिएको छ।',
    bodyNe: [
      p(
        'सामुदायिक विद्यालयको शिक्षा गुणस्तर सुधारका लागि स्थानीय तहले नयाँ पहल सुरु गरेका छन्। शिक्षक तालिम, पूर्वाधार विकास, र शिक्षण सामग्री वितरणमा जोड दिइएको छ।',
      ),
      h2('मुख्य कार्यक्रम'),
      p(
        'स्थानीय तहले शिक्षकलाई विषयगत तालिम उपलब्ध गराउने, विद्यालयमा डिजिटल शिक्षा सामग्री प्रवर्द्धन गर्ने, र बालमैत्री शिक्षण विधि अपनाउन प्रोत्साहन गर्ने कार्यक्रम सञ्चालन गरेका छन्।',
      ),
      quote('गुणस्तरीय शिक्षा नागरिकको अधिकार हो, विलास होइन।'),
      h2('अपेक्षा र चुनौती'),
      p(
        'अभिभावक र शिक्षकले यो पहललाई सकारात्मक रूपमा लिएका छन्। स्रोत साधनको अभाव, शिक्षक अभाव, र भौगोलिक पहुँचमा चुनौती रहेको बताइएको छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['climate'],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 25200000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'digital-nepal-progress',
    categorySlug: 'technology',
    titleNe: 'डिजिटल नेपाल: प्राविधिक पूर्वाधार विस्तारमा प्रगति',
    deckNe: 'ग्रामीण क्षेत्रमा इन्टरनेट पहुँच विस्तार र डिजिटल साक्षरता अभियानमा प्रगति भएको छ।',
    bodyNe: [
      p(
        'डिजिटल नेपाल अभियानअन्तर्गत ग्रामीण क्षेत्रमा इन्टरनेट पहुँच विस्तार र डिजिटल साक्षरता अभियानमा प्रगति भएको छ। सरकारी सेवा अनलाइनीकरणले नागरिकको पहुँच बढाएको छ।',
      ),
      h2('पहुँच विस्तार'),
      p(
        'दूरसञ्चार सेवा विस्तारले ग्रामीण क्षेत्रमा इन्टरनेट पहुँच बढेको छ। ब्रोडब्यान्ड सेवा विस्तार, सामुदायिक इन्टरनेट केन्द्र स्थापना, र मोबाइल सेवा विस्तारले नागरिकको सूचना पहुँचमा सुधार ल्याएको छ।',
      ),
      list(['ग्रामीण ब्रोडब्यान्ड विस्तार', 'सामुदायिक इन्टरनेट केन्द्र', 'सरकारी सेवा अनलाइन']),
      h2('चुनौती'),
      p('विद्युत् पहुँच, प्राविधिक साक्षरता, र उपकरणको लागतमा चुनौती रहेको छ।'),
    ],
    authorIds: [EDITOR],
    tagSlugs: [],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 28800000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'public-health-vaccination',
    categorySlug: 'health',
    titleNe: 'सार्वजनिक स्वास्थ्य: खोप कार्यक्रम विस्तारमा जोड',
    deckNe:
      'बाल स्वास्थ्य खोप कार्यक्रम विस्तार र स्वास्थ्य जागरूकता अभियानमा सरकारले जोड दिएको छ।',
    bodyNe: [
      p(
        'स्वास्थ्य तथा जनसंख्या मन्त्रालयले बाल स्वास्थ्य खोप कार्यक्रम विस्तार र स्वास्थ्य जागरूकता अभियानलाई निरन्तर जारी राखेको छ। नियमित खोपले बाल मृत्युदर घटाउन सहयोग पुगेको छ।',
      ),
      h2('खोप कभरेज'),
      p(
        'स्वास्थ्य कार्यालयका अनुसार बाल स्वास्थ्य खोप कभरेजमा सुधार आएको छ। दुर्गम क्षेत्रमा पनि खोप सेवा पुग्न स्थानीय स्वास्थ्य कार्यकर्ता परिचालन गरिएको छ।',
      ),
      quote('रोकथामजन्य स्वास्थ्य लगानी सजिलो र सस्तो हुन्छ।'),
      h2('जागरूकता'),
      p(
        'स्थानीय स्तरमा स्वास्थ्य शिक्षा कार्यक्रम, स्वास्थ्य परीक्षण शिविर, र सरसफाइ जागरूकता अभियान सञ्चालन गरिएको छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: [],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 32400000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'monsoon-agriculture-impact',
    categorySlug: 'society',
    titleNe: 'मनसुन र कृषि: खाद्य सुरक्षामा प्रभाव',
    deckNe: 'मनसुनको समय र वितरणले कृषि उत्पादन र खाद्य सुरक्षामा सिधा प्रभाव पार्छ।',
    bodyNe: [
      p(
        'मनसुनको समय र वितरणले नेपालको कृषि उत्पादन र खाद्य सुरक्षामा सिधा प्रभाव पार्छ। कृषि विज्ञहरूले मनसुन वितरणमा अनियमितता देखिएको बताएका छन्।',
      ),
      h2('मनसुन अवस्था'),
      p(
        'मौसम विज्ञान महाशाखाका अनुसार यस वर्ष मनसुन सामान्यभन्दा केही ढिलो सुरु भएको छ। पहाडी क्षेत्रमा पर्याप्त पानी नपर्दा धान रोपाइंमा असर परेको छ।',
      ),
      quote('मनसुन नै नेपाली कृषिको भाग्य निर्धारक हो।'),
      h2('अनुकूलन रणनीति'),
      p(
        'सिँचाइ सुविधा विस्तार, लघु बाँध निर्माण, र सुख्खा-प्रतिरोधी बाली विकासमा जोड दिनुपर्ने विज्ञहरूको सुझाव छ। स्थानीय तहले कृषि बीमा कार्यक्रम प्रभावकारी बनाउनुपर्छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['climate'],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 36000000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'tourism-recovery-2026',
    categorySlug: 'business',
    titleNe: 'पर्यटन पुनरुत्थान: आगमन बढ्दो, चुनौती टिकाउ',
    deckNe: 'विदेशी पर्यटक आगमनमा वृद्धि भएको छ। दिगो पर्यटन व्यवस्थापन चुनौती बनेको छ।',
    bodyNe: [
      p(
        'पर्यटन विभागको तथ्यांक अनुसार विदेशी पर्यटक आगमनमा उल्लेख्य वृद्धि भएको छ। मुख्य स्रोत बजार भारत, चीन, अमेरिका, र युरोपेली देशबाट आगमन बढेको हो।',
      ),
      h2('मुख्य गन्तव्य'),
      p(
        'काठमाडौँ उपत्यका, पोखरा, लुम्बिनी, र चितवन प्रमुख पर्यटकीय गन्तव्य रहेका छन्। साहसिक पर्यटन, धार्मिक पर्यटन, र पदयात्रामा रुचि बढेको छ।',
      ),
      quote('पर्यटन नेपाली अर्थतन्त्रको मेरुदण्ड हो, तर वातावरण संरक्षण सँगसँगै हुनुपर्छ।'),
      h2('चुनौती'),
      p(
        'पूर्वाधार विस्तार, स्वच्छ वातावरण, र गुणस्तरीय सेवा सुनिश्चित गर्नु चुनौती बनेको छ। विमानस्थल क्षमता, सडक सञ्जाल, र आतिथ्य तालिममा लगानी आवश्यक छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: [],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 39600000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'youth-migration-trends',
    categorySlug: 'society',
    titleNe: 'युवा पलायन: कारण र समाधानको खोजी',
    deckNe: 'विदेश जाने युवाको संख्या बढ्दो छ। मुख्य कारण रोजगारी अभाव र शिक्षा अवसर रहेको छ।',
    bodyNe: [
      p(
        'युवा पलायन नेपालको गम्भीर सामाजिक समस्या बनेको छ। रोजगारी अभाव, शिक्षा अवसर, र जीवनस्तर सुधारको आशमा हजारौं युवा विदेश जाँदै छन्।',
      ),
      h2('मुख्य कारण'),
      p(
        'अर्थशास्त्रीहरूले रोजगारी अभाव, कम आय, र राजनीतिक अस्थिरतालाई पलायनका मुख्य कारण मानेका छन्। विदेशमा उच्च आयको आकर्षण पनि महत्त्वपूर्ण कारक हो।',
      ),
      list([
        'रोजगारी अभाव',
        'शिक्षा र स्वास्थ्यमा पहुँच',
        'राजनीतिक अस्थिरता',
        'विदेशमा उच्च आयको आकर्षण',
      ]),
      h2('समाधानको खोजी'),
      p(
        'उत्पादन क्षेत्र विस्तार, कृषिको आधुनिकीकरण, र उद्यमशीलता प्रवर्द्धनमा जोड दिनुपर्ने विज्ञहरूको सुझाव छ। युवालाई देशभित्रै रोजगारी सिर्जना गर्नु दिगो समाधान हो।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['labour-migration'],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 43200000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'federalism-implementation-review',
    categorySlug: 'politics',
    titleNe: 'संघीयता कार्यान्वयन: प्रगति र चुनौतीको समीक्षा',
    deckNe: 'संघीयता कार्यान्वयन एक दशक भयो। प्रगति भए पनि चुनौती टिकिरहेको छ।',
    bodyNe: [
      p(
        'संघीय लोकतान्त्रिक गणतन्त्र व्यवस्था कार्यान्वयन भएको एक दशक भयो। संघ, प्रदेश, र स्थानीय तह गरी तीन तहको संरचना स्थापित भए पनि चुनौती टिकिरहेको छ।',
      ),
      h2('प्रगति'),
      p(
        'स्थानीय तहले नागरिकको ढोकामा सेवा पुर्याएको छ। प्रदेश सरकारले विधेयक पारित र बजेट ल्याउन थालेका छन्। संघीय संसदले कानुन निर्माण प्रक्रिया अगाडि बढाएको छ।',
      ),
      quote('संघीयता संस्थागत बन्न समय लाग्छ, तर जनताले फाइदा देख्नुपर्छ।'),
      h2('चुनौती'),
      p(
        'अधिकार विभाजन, स्रोत बाँडफाँड, र कर्मचारी समायोजनमा अस्पष्टता छ। प्रदेश सरकार सशक्तीकरण र स्थानीय तहको क्षमता विस्तारमा ध्यान दिनुपर्छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: ['local-election'],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 46800000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'energy-sector-hydropower',
    categorySlug: 'business',
    titleNe: 'ऊर्जा क्षेत्र: जलविद्युत विकास र निर्यातको सम्भावना',
    deckNe: 'जलविद्युत उत्पादन बढ्दो छ। भारत र बंगलादेशमा निर्यातको सम्भावना खुलेको छ।',
    bodyNe: [
      p(
        'नेपालको जलविद्युत विकासमा उल्लेख्य प्रगति भएको छ। निर्माणाधीन आयोजना सम्पन्न भएपछि उत्पादन बढ्ने अपेक्षा गरिएको छ। भारत र बंगलादेशमा बिजुली निर्यातको सम्भावना खुलेको छ।',
      ),
      h2('उत्पादन अवस्था'),
      p(
        'विद्युत् प्राधिकरणका अनुसार हाल उत्पादन भइरहेको बिजुलीले आन्तरिक माग धानेको छ। नयाँ आयोजना सञ्चालनमा आएपछि अतिरिक्त बिजुली निर्यात हुनेछ।',
      ),
      quote('जलविद्युत नेपालको सेतो सुन हो, दिगो विकासको आधार।'),
      h2('चुनौती'),
      p(
        'प्रसारण लाइन विस्तार, वातावरण प्रभाव मूल्यांकन, र स्थानीय समुदायको सहमतिमा चुनौती छ। निर्माण कार्यमा ढिलाइले लागत बढेको छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: [],
    isFeatured: 'secondary',
    isBreaking: false,
    publishedAt: new Date(baseTime - 50400000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
  {
    id: genId(),
    slug: 'cultural-heritage-preservation',
    categorySlug: 'society',
    titleNe: 'सांस्कृतिक सम्पदा संरक्षण: विरासत र आधुनिकताको सन्तुलन',
    deckNe: 'काठमाडौँ उपत्यकाको सांस्कृतिक सम्पदा संरक्षणमा नयाँ पहल थालिएको छ।',
    bodyNe: [
      p(
        'काठमाडौँ उपत्यकाको सांस्कृतिक सम्पदा विश्व सम्पदा सूचीमा सूचीकृत छ। स्मारक संरक्षण, परम्परागत वास्तुकला जगेर्ना, र सांस्कृतिक पर्यटन प्रवर्द्धनमा नयाँ पहल थालिएको छ।',
      ),
      h2('मुख्य कार्यक्रम'),
      p(
        'पुरातत्व विभागले स्मारक संरक्षण कार्य अगाडि बढाएको छ। स्थानीय समुदायलाई संरक्षणमा सहभागी गराउन जनचेतना अभियान सञ्चालन भइरहेको छ।',
      ),
      quote('सम्पदा हाम्रो पहिचान हो, भविष्य पुस्ताको अधिकार हो।'),
      h2('चुनौती'),
      p(
        'शहरीकरण दबाब, प्राकृतिक विपद्, र स्रोत अभावमा चुनौती छ। स्थानीय जनशक्ति र परम्परागत सीप संरक्षणमा जोड दिनुपर्छ।',
      ),
    ],
    authorIds: [EDITOR],
    tagSlugs: [],
    isFeatured: 'lead',
    isBreaking: false,
    publishedAt: new Date(baseTime - 54000000).toISOString(),
    hasEnglish: false,
    readingMinutes: 0,
  },
]

for (const a of articles) {
  a.readingMinutes = estimate(a.bodyNe)
  a.updatedAt = a.publishedAt
  a.createdBy = 'seed-script'
  a.updatedBy = 'seed-script'
  a.workflowStage = PUBLISH ? 'published' : 'draft'
  a.sourceType = 'original'
  a.locale = 'ne'
  a.premium = false
  a.noIndex = !PUBLISH
  a.includeInNewsSitemap = PUBLISH
  a.commentsEnabled = true
  a.titleEn = undefined
  a.bodyEn = undefined
}

let store
try {
  store = JSON.parse(readFileSync(STORE_FILE, 'utf-8'))
} catch {
  store = { articles: [], version: 1 }
}
const existing = new Set(store.articles.map((a) => `${a.categorySlug}/${a.slug}`))
let created = 0,
  skipped = 0
for (const a of articles) {
  const key = `${a.categorySlug}/${a.slug}`
  if (existing.has(key)) {
    skipped++
    console.log(`  ⊘ ${key}`)
  } else {
    store.articles.push(a)
    created++
    console.log(`  ✓ ${key}`)
  }
}
mkdirSync(dirname(STORE_FILE), { recursive: true })
writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8')
console.log(
  `\nDone. Created ${created}, skipped ${skipped}. Store: ${store.articles.length} articles.`,
)
console.log(
  PUBLISH
    ? 'Seed articles were published.'
    : 'Seed articles were added as drafts. Use --publish only for an approved staging demo, never for live newsroom content.',
)
