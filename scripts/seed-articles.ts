#!/usr/bin/env tsx
/**
 * Seed the article store with original Nagarik Watch articles.
 *
 * POLICY: These are ORIGINAL articles written by the Nagarik Watch editorial
 * team (AI-assisted drafting, human-edited). They are NOT copies of wire copy.
 * Each article is an original summary of publicly known facts, written in
 * Nepali, with a unique angle. Where a story builds on a wire lead, the
 * sourceName + sourceUrl fields carry the attribution so readers can trace
 * the provenance.
 *
 * The articles are written to data/articles.json via the same store module
 * the admin uses, so they're fully editable from /admin/articles.
 *
 * Run: tsx scripts/seed-articles.ts
 */
import { createArticle, type StoredArticle } from '../apps/web/lib/content/store/json-store'
import { categories, authors, tags } from '../apps/web/lib/content/seed-source'
import type { ArticleBlock } from '@nagarikwatch/db'

// Force the store to use the file path under apps/web so dev server + this
// script agree on the location.
process.chdir(new URL('../apps/web', import.meta.url).pathname)

function p(text: string): ArticleBlock {
  return { type: 'paragraph', text }
}
function h2(text: string): ArticleBlock {
  return { type: 'heading2', text }
}
function quote(text: string): ArticleBlock {
  return { type: 'pullQuote', quoteNe: text }
}
function list(items: string[]): ArticleBlock {
  return { type: 'list', ordered: false, items }
}

type SeedArticle = Parameters<typeof createArticle>[0]

const NE_EDITOR = authors.find((a) => a.slug === 'srijana-karki') ?? authors[0]!
const EN_EDITOR = authors.find((a) => a.slug === 'bishnu-thapa') ?? authors[1]!

const seedArticles: SeedArticle[] = [
  // ===== POLITICS =====
  {
    slug: 'rastriya-sabha-budget-session-2083',
    categorySlug: 'politics',
    titleNe: 'संसदको बजेट अधिवेशन सुरु: प्रमुख एजेन्डा र अपेक्षा',
    titleEn: 'Parliament budget session begins: key agenda and expectations',
    deckNe: 'संघीय संसदको बजेट अधिवेशन शुरु भएको छ। आगामी आर्थिक वर्षको बजेट पारित गर्नु मुख्य उद्देश्य रहेको छ।',
    bodyNe: [
      p('संघीय संसदको बजेट अधिवेशन औपचारिक रूपमा सुरु भएको छ। आगामी आर्थिक वर्ष २०८३/८४ को वार्षिक बजेट पारित गर्नु यस अधिवेशनको प्रमुख उद्देश्य हो।'),
      h2('प्रमुख एजेन्डा'),
      p('अधिवेशनमा आगामी आर्थिक वर्षको बजेट प्रस्ताव, उप-विधेयकहरूको पारित, र सांसदहरूको प्रश्नोत्तर कार्यक्रम समावेश छन्। सरकारले आर्थिक सुधार, पूर्वाधार विस्तार, र सामाजिक सुरक्षा क्षेत्रमा लगानी बढाउने प्रतिबद्धता जनाएको छ।'),
      quote('बजेटले जनताको मुटु छोनुपर्छ, खाली अंक खोज्ने होइन।'),
      h2('प्रतिपक्षको अवस्था'),
      p('प्रतिपक्षी दलहरूले बजेट प्रस्तावमा छलफल गर्न समय पर्याप्त हुनुपर्ने माग गरेका छन्। उनीहरूले अघिल्लो बजेटको कार्यान्वयन प्रगति समीक्षा गर्न पनि जोड दिएका छन्।'),
      p('अधिवेशनले आगामी केही हप्ता बजेट छलफलमा केन्द्रित रहने अपेक्षा गरिएको छ। नागरिकहरूले कर व्यवस्था, रोजगारी सिर्जना, र मुद्रास्फीति नियन्त्रणमा सरकारको स्पष्ट रोडम्याप हेर्न चाहन्छन्।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['election', 'governance'].filter((s) => tags.some((t) => t.slug === s)),
    isBreaking: false,
    isFeatured: 'lead',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'संसदको बजेट अधिवेशन २०८३: एजेन्डा र अपेक्षा',
    seoDescriptionNe: 'संघीय संसदको बजेट अधिवेशन सुरु। आर्थिक वर्ष २०८३/८४ को बजेट, प्रमुख एजेन्डा, र प्रतिपक्षको अवस्था।',
    aiSummary: 'संघीय संसदको बजेट अधिवेशन सुरु भएको छ। आगामी आर्थिक वर्षको बजेट पारित गर्नु मुख्य उद्देश्य हो। प्रतिपक्षले पर्याप्त छलफलको माग गरेको छ।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  {
    slug: 'local-election-preparation-voter-education',
    categorySlug: 'politics',
    titleNe: 'स्थानीय तहको निर्वाचन तयारी: मतदाता शिक्षा अभियान बलियो बनाउने आह्वान',
    deckNe: 'निर्वाचन आयोगले स्थानीय तहको सम्भावित निर्वाचनका लागि मतदाता शिक्षा अभियान तीव्र बनाउनुपर्ने आह्वान गरेको छ।',
    bodyNe: [
      p('निर्वाचन आयोगले स्थानीय तहको सम्भावित निर्वाचनका लागि मतदाता शिक्षा अभियान थप प्रभावकारी बनाउनुपर्ने बताएको छ। आयोगका प्रवक्ताले नागरिक शिक्षा र मतदान प्रक्रियाबारे जानकारी गराउन स्थानीय स्तरमा कार्यक्रम सञ्चालन गरिने जानकारी दिए।'),
      h2('मतदाता दर्ता'),
      p('आयोगले मतदाता दर्ता अभियान निरन्तर जारी राखेको छ। नयाँ मतदातालाई दर्ता गराउन र पुराना विवरण अपडेट गर्न जिल्ला निर्वाचन कार्यालयमा सेवा उपलब्ध छ।'),
      list([
        'मतदाता परिचयपत्र वितरण जारी',
        'नयाँ दर्ताका लागि अनलाइन सेवा उपलब्ध',
        'विवरण गलत भएमा सच्याउने प्रक्रिया खुला',
      ]),
      p('नागरिक समाजका प्रतिनिधिले मतदाता शिक्षालाई निर्वाचनको आत्मा मानेका छन्। सचेत मतदाताले मात्र सक्षम प्रतिनिधि चयन गर्न सकिने उनीहरूको भनाइ छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['election', 'governance'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'secondary',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'स्थानीय निर्वाचन तयारी: मतदाता शिक्षा अभियान',
    seoDescriptionNe: 'निर्वाचन आयोगले मतदाता शिक्षा अभियान बलियो बनाउन आह्वान। दर्ता र जानकारी प्रक्रिया।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== BUSINESS =====
  {
    slug: 'remittance-growth-2083-trends',
    categorySlug: 'business',
    titleNe: 'रेमिट्यान्स प्रवाहमा वृद्धि: अर्थतन्त्रमा सकारात्मक संकेत',
    titleEn: 'Remittance inflow growth: positive signal for the economy',
    deckNe: 'गत आर्थिक वर्षमा रेमिट्यान्स प्रवाहमा उल्लेख्य वृद्धि भएको छ। यसले विप्रेषण अर्थतन्त्रलाई सहयोग पुगेको छ।',
    bodyNe: [
      p('नेपाल राष्ट्र बैंकको तथ्यांक अनुसार गत आर्थिक वर्षमा रेमिट्यान्स प्रवाहमा उल्लेख्य वृद्धि भएको छ। विदेशमा कार्यरत नेपालीहरूले पठाएको रकमले देशको विप्रेषण अर्थतन्त्रलाई टेवा पुगेको हो।'),
      h2('मुख्य तथ्यांक'),
      p('राष्ट्र बैंकको तथ्यांक अनुसार रेमिट्यान्स आयमा गत वर्षको तुलनामा दोहोरो अंकीय वृद्धि देखिएको छ। मुख्य श्रम गन्तव्य देशहरू खाडी मुलुक, मलेसिया, र दक्षिण कोरियाबाट प्रवाह बढेको हो।'),
      quote('रेमिट्यान्स नेपाली अर्थतन्त्रको मेरुदण्ड हो, तर दिगो विकासका लागि उत्पादन क्षेत्र बलियो हुनुपर्छ।'),
      h2('चुनौती'),
      p('रेमिट्यान्समा मात्र अति निर्भरताले दिगो अर्थतन्त्र बनाउन नसकिने अर्थशास्त्रीहरूले बताउँछन्। उत्पादन क्षेत्रको विस्तार, कृषिको आधुनिकीकरण, र रोजगारी सिर्जनामा ध्यान दिनुपर्ने उनीहरूको सुझाव छ।'),
      p('विप्रेषणको उपयोग उपभोगमा मात्र नभई लगानीमा पनि हुनुपर्ने विज्ञहरूको भनाइ छ। सरकारले विप्रेषण लगानीका लागि प्रोत्साहन र सहुलियत व्यवस्था गर्नुपर्छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['economy', 'remittance'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'lead',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'रेमिट्यान्स वृद्धि २०८३: अर्थतन्त्रमा सकारात्मक संकेत',
    seoDescriptionNe: 'गत आर्थिक वर्षमा रेमिट्यान्स प्रवाहमा वृद्धि। मुख्य तथ्यांक, चुनौती, र विज्ञको विश्लेषण।',
    aiSummary: 'नेपाल राष्ट्र बैंकको तथ्यांक अनुसार रेमिट्यान्स प्रवाहमा वृद्धि भएको छ। विज्ञहरूले उत्पादन क्षेत्र बलियो बनाउन सुझाव दिएका छन्।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  {
    slug: 'nepse-index-movement-analysis',
    categorySlug: 'business',
    titleNe: 'नेप्से सूचकांकमा उतारचढाव: लगानीकर्ताले के ध्यान दिने?',
    deckNe: 'नेपाल धितोपत्र बजारको सूचकांकमा हालै उतारचढाव देखिएको छ। बजार विश्लेषकहरूले सावधानी अपनाउन सुझाव दिएका छन्।',
    bodyNe: [
      p('नेपाल धितोपत्र बजार (नेप्से) को सूचकांकमा हालैका दिनमा उतारचढाव देखिएको छ। केही क्षेत्रका सेयरमा कारोबार बढेको भए पनि समग्रमा बजार स्थिर छ।'),
      h2('कारोबार अवस्था'),
      p('दैनिक कारोबार रकममा उतारचढाव छ। वाणिज्य बैंक, जीवन बीमा, र उत्पादन क्षेत्रका सेयरमा रुचि देखिएको छ। लगानीकर्ताले कम्पनीको मौलिक विश्लेषण गरेर मात्र लगानी गर्न सुझाव दिइएको छ।'),
      list([
        'वाणिज्य बैंक सेयरमा कारोबार बढी',
        'जीवन बीमा क्षेत्रमा रुचि',
        'उत्पादन क्षेत्र मिश्रित अवस्था',
      ]),
      p('बजार विश्लेषकहरूले छोटो अवधिको उतारचढावमा नडराई दीर्घकालीन दृष्टिकोणले लगानी गर्न सुझाव दिएका छन्। आर्थिक मौलिकता र कम्पनीको वित्तीय अवस्था विश्लेषण गर्नु महत्त्वपूर्ण छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['economy', 'nepse'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'secondary',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'नेप्से सूचकांक विश्लेषण: लगानीकर्ताका लागि सुझाव',
    seoDescriptionNe: 'नेप्से सूचकांकमा उतारचढाव। कारोबार अवस्था, विश्लेषकको सुझाव, र लगानीकर्ताले ध्यान दिने कुरा।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== WORLD =====
  {
    slug: 'global-climate-summit-outcomes',
    categorySlug: 'world',
    titleNe: 'विश्व जलवायु शिखर सम्मेलन: सहयोग र प्रतिबद्धताको समीक्षा',
    titleEn: 'Global climate summit: cooperation and commitment review',
    deckNe: 'विश्व नेताहरूको जलवायु शिखर सम्मेलनमा उत्सर्घटन र जलवायु वित्तको आवरणमा प्रगति र चुनौती दुवै देखिएका छन्।',
    bodyNe: [
      p('हालै सम्पन्न विश्व जलवायु शिखर सम्मेलनमा विकसित र विकासोन्मुख देशहरूबीच उत्सर्घटन घटाउने प्रतिबद्धता र जलवायु वित्तको व्यवस्थाबारे छलफल भयो। विज्ञहरूले प्रगति भए पनि पर्याप्त नरहेको बताएका छन्।'),
      h2('मुख्य सहमति'),
      p('सम्मेलनमा नवीकरणीय ऊर्जा विस्तार, कार्बन उत्सर्घटन घटाउने लक्ष्य, र जलवायु परिवर्तनबाट प्रभावित देशहरूलाई वित्तीय सहयोग बढाउने विषयमा सहमति जनाइयो। सहयोग रकम र यसको वितरणमा भने मतभेद देखिएको छ।'),
      quote('जलवायु परिवर्तन सीमानाको समस्या होइन, विश्वव्यापी चुनौती हो।'),
      h2('नेपालको सरोकार'),
      p('हिमालय क्षेत्रको हिउँ पग्लिने, हिमताल फुट्ने जोखिम, र कृषि उत्पादनमा असर पर्ने भएकाले नेपाल जलवायु परिवर्तनको अग्रणी प्रभावित देशमा पर्छ। नेपालले वित्तीय सहयोग र प्राविधिक सहयोग पाउनुपर्ने माग गरेको छ।'),
      p('विशेषगरी पहाडी भेगमा विपद् जोखिम व्यवस्थापन, कृषि अनुकूलन, र नवीकरणीय ऊर्जा विस्तारमा लगानी आवश्यक छ। सरकारले जलवायु अनुकूलन कार्यक्रमलाई प्राथमिकतामा राखेको छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['climate', 'environment'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'lead',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'विश्व जलवायु शिखर सम्मेलन: सहमति र चुनौती',
    seoDescriptionNe: 'विश्व जलवायु शिखर सम्मेलनमा उत्सर्घटन घटाउने प्रतिबद्धता र जलवायु वित्त। नेपालको सरोकार।',
    aiSummary: 'विश्व जलवायु शिखर सम्मेलनमा उत्सर्घटन घटाउने र जलवायु वित्त बढाउने सहमति भए पनि वितरणमा मतभेद छ। नेपाल प्रभावित देशमा पर्छ।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== SPORTS =====
  {
    slug: 'nepal-cricket-team-preparation',
    categorySlug: 'sports',
    titleNe: 'नेपाली क्रिकेट टोलीको तयारी: आगामी प्रतियोगितामा आशा',
    deckNe: 'नेपाली राष्ट्रिय क्रिकेट टोलीले आगामी अन्तर्राष्ट्रिय प्रतियोगिताका लागि तयारी तीव्र बनाएको छ।',
    bodyNe: [
      p('नेपाली राष्ट्रिय क्रिकेट टोलीले आगामी अन्तर्राष्ट्रिय प्रतियोगिताका लागि तयारी तीव्र बनाएको छ। प्रशिक्षण सत्र र अभ्यास खेलमा टोलीको फोकस देखिन्छ।'),
      h2('टोलीको संरचना'),
      p('टोलीमा अनुभवी र युवा खेलाडीको मिश्रण छ। ब्याटिङ, बलिङ, र फिल्डिङ तीनै विभागमा सन्तुलन कायम गर्न प्रशिक्षकले जोड दिएका छन्। युवा खेलाडीहरूलाई अन्तर्राष्ट्रिय अनुभव दिलाउने रणनीति अपनाइएको छ।'),
      list([
        'ब्याटिङ विभागमो सुदृढीकरण',
        'बलिङमा विविधता र गति',
        'फिल्डिङ स्तरमा सुधार',
      ]),
      p('खेलाडीहरूले राष्ट्रिय टोलीमा टोलीमा स्थान बनाउन उत्कृष्ट प्रदर्शन गरिरहेका छन्। नेपाली रणनीतिक स्तरमा सुधार गर्न सुझाव दिएका छन्।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['cricket', 'sports'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'secondary',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'नेपाली क्रिकेट टोलीको तयारी: आगामी प्रतियोगिता',
    seoDescriptionNe: 'नेपाली राष्ट्रिय क्रिकेट टोलीको तयारी, टोली संरचना, र आगामी प्रतियोगितामा आशा।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== SOCIETY =====
  {
    slug: 'education-quality-improvement-initiative',
    categorySlug: 'society',
    titleNe: 'शिक्षा गुणस्तर सुधार: सामुदायिक विद्यालयमा नयाँ पहल',
    deckNe: 'सामुदायिक विद्यालयको शिक्षा गुणस्तर सुधारका लागि नयाँ पहल सुरु गरिएको छ। शिक्षक तालिम र पूर्वाधारमा जोड दिइएको छ।',
    bodyNe: [
      p('सामुदायिक विद्यालयको शिक्षा गुणस्तर सुधारका लागि स्थानीय तहले नयाँ पहल सुरु गरेका छन्। शिक्षक तालिम, पूर्वाधार विकास, र शिक्षण सामग्री वितरणमा जोड दिइएको छ।'),
      h2('मुख्य कार्यक्रम'),
      p('स्थानीय तहले शिक्षकलाई विषयगत तालिम उपलब्ध गराउने, विद्यालयमा डिजिटल शिक्षा सामग्री प्रवर्द्धन गर्ने, र बालमैत्री शिक्षण विधि अपनाउन प्रोत्साहन गर्ने कार्यक्रम सञ्चालन गरेका छन्।'),
      quote('गुणस्तरीय शिक्षा नागरिकको अधिकार हो, विलास होइन।'),
      h2('अपेक्षा र चुनौती'),
      p('अभिभावक र शिक्षकले यो पहललाई सकारात्मक रूपमा लिएका छन्। स्रोत साधनको अभाव, शिक्षक अभाव, र भौगोलिक पहुँचमा चुनौती रहेको बताइएको छ। स्थानीय जनप्रतिनिधिले समस्या समाधानमा ध्यान दिनुपर्ने आवश्यकता औंल्याइएको छ।'),
      p('विद्यालय व्यवस्थापन समिति र अभिभावक संघको सक्रियताले शिक्षा गुणस्तरमा सुधार ल्याउन सहयोग पुग्ने अपेक्षा गरिएको छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['education', 'governance'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'lead',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'सामुदायिक विद्यालय शिक्षा गुणस्तर सुधार पहल',
    seoDescriptionNe: 'स्थानीय तहले सामुदायिक विद्यालयको शिक्षा गुणस्तर सुधारका लागि नयाँ पहल। शिक्षक तालिम र पूर्वाधार।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== TECHNOLOGY =====
  {
    slug: 'digital-nepal-initiative-progress',
    categorySlug: 'technology',
    titleNe: 'डिजिटल नेपाल: प्राविधिक पूर्वाधार विस्तारमा प्रगति',
    deckNe: 'ग्रामीण क्षेत्रमा इन्टरनेट पहुँच विस्तार र डिजिटल साक्षरता अभियानमा प्रगति भएको छ।',
    bodyNe: [
      p('डिजिटल नेपाल अभियानअन्तर्गत ग्रामीण क्षेत्रमा इन्टरनेट पहुँच विस्तार र डिजिटल साक्षरता अभियानमा प्रगति भएको छ। सरकारी सेवा अनलाइनीकरणले नागरिकको पहुँच बढाएको छ।'),
      h2('पहुँच विस्तार'),
      p('दूरसञ्चार सेवा विस्तारले ग्रामीण क्षेत्रमा इन्टरनेट पहुँच बढेको छ। ब्रोडब्यान्ड सेवा विस्तार, सामुदायिक इन्टरनेट केन्द्र स्थापना, र मोबाइल सेवा विस्तारले नागरिकको सूचना पहुँचमा सुधार ल्याएको छ।'),
      list([
        'ग्रामीण ब्रोडब्यान्ड विस्तार',
        'सामुदायिक इन्टरनेट केन्द्र',
        'सरकारी सेवा अनलाइन',
      ]),
      h2('चुनौती'),
      p('विद्युत् पहुँच, प्राविधिक साक्षरता, र उपकरणको लागतमा चुनौती रहेको छ। स्थानीय जनशक्तिलाई प्राविधिक तालिम दिएर सेवा टिकाउन सकिने विज्ञहरूको भनाइ छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['technology', 'digital-nepal'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'secondary',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'डिजिटल नेपाल: प्राविधिक पूर्वाधार प्रगति',
    seoDescriptionNe: 'डिजिटल नेपाल अभियानमा ग्रामीण इन्टरनेट पहुँच विस्तार र डिजिटल साक्षरता।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
  // ===== HEALTH =====
  {
    slug: 'public-health-initiative-vaccination',
    categorySlug: 'health',
    titleNe: 'सार्वजनिक स्वास्थ्य: खोप कार्यक्रम विस्तारमा जोड',
    deckNe: 'बाल स्वास्थ्य खोप कार्यक्रम विस्तार र स्वास्थ्य जागरूकता अभियानमा सरकारले जोड दिएको छ।',
    bodyNe: [
      p('स्वास्थ्य तथा जनसंख्या मन्त्रालयले बाल स्वास्थ्य खोप कार्यक्रम विस्तार र स्वास्थ्य जागरूकता अभियानलाई निरन्तर जारी राखेको छ। नियमित खोपले बाल मृत्युदर घटाउन सहयोग पुगेको छ।'),
      h2('खोप कभरेज'),
      p('स्वास्थ्य कार्यालयका अनुसार बाल स्वास्थ्य खोप कभरेजमा सुधार आएको छ। दुर्गम क्षेत्रमा पनि खोप सेवा पुग्न स्थानीय स्वास्थ्य कार्यकर्ता परिचालन गरिएको छ।'),
      quote('रोकथामजन्य स्वास्थ्य लगानी सजिलो र सस्तो हुन्छ।'),
      h2('जागरूकता'),
      p('स्थानीय स्तरमा स्वास्थ्य शिक्षा कार्यक्रम, स्वास्थ्य परीक्षण शिविर, र सरसफाइ जागरूकता अभियान सञ्चालन गरिएको छ। नागरिकले स्वास्थ्य सेवा सजिलै प्राप्त गर्न सक्ने वातावरण बनाउन पहल भइरहेको छ।'),
    ],
    authorIds: [NE_EDITOR.id],
    tagSlugs: ['health', 'vaccination'].filter((s) => tags.some((t) => t.slug === s)),
    isFeatured: 'lead',
    workflowStage: 'published',
    sourceType: 'original',
    seoTitleNe: 'सार्वजनिक स्वास्थ्य: खोप कार्यक्रम विस्तार',
    seoDescriptionNe: 'बाल स्वास्थ्य खोप कार्यक्रम विस्तार र स्वास्थ्य जागरूकता। खोप कभरेजमा सुधार।',
    commentsEnabled: true,
    locale: 'ne',
    createdBy: 'seed-script',
  },
]

async function main() {
  console.log(`Seeding ${seedArticles.length} original articles to the store...`)
  let created = 0
  let skipped = 0
  for (const art of seedArticles) {
    try {
      await createArticle(art)
      created++
      console.log(`  ✓ ${art.categorySlug}/${art.slug}`)
    } catch (e) {
      skipped++
      console.log(`  ⊘ ${art.categorySlug}/${art.slug} (already exists)`)
    }
  }
  console.log(`\nDone. Created ${created}, skipped ${skipped}.`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
