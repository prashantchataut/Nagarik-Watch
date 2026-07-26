/**
 * Writes seed-edition/*.ts for all categories except politics (already hand-written).
 * Run from repo root: node scripts/generate-seed-edition-modules.mjs
 */
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve('apps/web/lib/content/store/seed-edition')

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

function articleTpl(cat, n, it) {
  const days = it.days ?? n - 1
  const hour = it.hour ?? 6 + (n % 5)
  const featuredLine = it.featured ? `\n      isFeatured: '${it.featured}',` : ''
  const tags = JSON.stringify(it.tags ?? [])
  const paras = (it.paras ?? []).map((t) => `        p('${esc(t)}'),`).join('\n')
  const bullets = (it.bullets ?? []).map((b) => `          '${esc(b)}',`).join('\n')
  const pull = it.pull ? `\n        quote('${esc(it.pull)}'),` : ''
  return `    base({
      id: 'art-ed-${cat}-${n}',
      slug: '${it.slug}',
      categorySlug: '${cat}',
      titleNe: '${esc(it.titleNe)}',
      titleEn: '${esc(it.titleEn)}',
      deckNe: '${esc(it.deckNe)}',
      deckEn: '${esc(it.deckEn)}',
      publishedAt: isoDaysAgo(${days}, ${hour}),
      updatedAt: isoDaysAgo(${days}, ${hour}),${featuredLine}
      tagSlugs: ${tags},
      reportingLocation: '${esc(it.loc)}',
      bodyNe: [
${paras}
        h2('${esc(it.h2)}'),
        list([
${bullets}
        ]),${pull}
        p('नागरिक वाच डेस्कले यस विषयलाई निरन्तर अनुगमन गरी पाठकमैत्री सार अद्यावधिक गर्नेछ।'),
      ],
      bodyEn: [
        p('${esc(it.deckEn)}'),
      ],
    })`
}

function fileFor(cat, fn, items) {
  const arts = items.map((it, i) => articleTpl(cat, i + 1, it)).join(',\n')
  return `import type { StoredArticle } from '../json-store'
import { base, p, h2, list, quote, isoDaysAgo } from './_helpers'

export function ${fn}(): StoredArticle[] {
  return [
${arts}
  ]
}
`
}

function mk(slug, titleNe, titleEn, deckNe, deckEn, tags, loc, featured, h2, bullets, paras) {
  return {
    slug,
    titleNe,
    titleEn,
    deckNe,
    deckEn,
    tags,
    loc,
    featured: featured || undefined,
    h2,
    bullets,
    paras,
  }
}

/** @type {Record<string, { fn: string, items: object[] }>} */
const all = {
  society: {
    fn: 'editionSociety',
    items: [
      {
        slug: 'monsoon-highway-community-impact',
        titleNe: 'मनसुनमा सडक अवरोध: समुदायको दैनिक जीवन कसरी प्रभावित',
        titleEn: 'Monsoon roadblocks: how daily life is disrupted',
        deckNe: 'पहिरो र बाढीले राजमार्ग अवरुद्ध हुँदा यातायात, बजार आपूर्ति र स्वास्थ्य सेवामा चाप बढेको छ।',
        deckEn: 'Landslides and floods blocking highways raise pressure on transport, markets and health access.',
        tags: ['climate'],
        loc: 'सिन्धुपाल्चोक',
        featured: 'lead',
        h2: 'समुदायले भोगेका समस्या',
        bullets: ['वैकल्पिक बाटोको जानकारी समयमै नआउनु', 'अत्यावश्यक औषधि ढुवानी ढिला हुनु', 'बजार मूल्यमा अचानक चाप'],
        pull: 'सडक खुलाउने कामसँगै स्थानीय सूचना प्रवाह पनि उत्तिकै जरुरी छ।',
        paras: [
          'मनसुन सक्रिय रहँदा पहाडी सडकखण्डमा पहिरो र नदी कटान दोहोरिएका छन्। नागरिक वाच डेस्कले यात्रु, चालक र स्थानीय व्यापारीसँगको संवादमा आपूर्ति श्रृंखला प्रभावित भएको पाएको छ।',
          'रातको यातायात प्रतिबन्ध र आकस्मिक बन्दले विद्यार्थी र बिरामी परिवारलाई बढी मर्का परेको छ। वैकल्पिक मार्गबारे स्पष्ट सूचना नहुँदा अन्योल बढ्छ।',
          'स्थानीय प्रशासन र सडक विभागले सफाइ अभियान तीव्र पारेको दाबी गरे पनि पाठकलाई चाहिने कुरा हो: कहिले खुल्छ, कुन बाटो सुरक्षित छ।',
          'विपद् जोखिमयुक्त बस्तीमा पूर्वसूचना र अस्थायी बसोबास योजना पनि सडक सफाइसँगै जानुपर्छ।',
        ],
      },
      {
        slug: 'urban-waste-management-pressure',
        titleNe: 'शहरी फोहोर व्यवस्थापन: मनसुनले बढाएको चाप',
        titleEn: 'Urban waste under monsoon pressure',
        deckNe: 'वर्षाले नाली अवरुद्ध र फोहोर थुप्रिँदा स्वास्थ्य जोखिम बढ्छ। नगर सेवा र नागरिक सहकार्य दुवै चाहिन्छ।',
        deckEn: 'Rain-clogged drains and piled waste raise health risks; city services and civic habits both matter.',
        tags: ['climate'],
        loc: 'काठमाडौं',
        h2: 'के सुधार्न सकिन्छ',
        bullets: ['वडास्तरको संकलन समयतालिका सार्वजनिक गर्नु', 'निकास सफाइ प्राथमिकता तोक्नु', 'घरधुरी स्रोतमै छुट्याउने अभ्यास बढाउनु'],
        paras: [
          'मनसुनमा शहरी फोहोर व्यवस्थापन थप चुनौतीपूर्ण हुन्छ। नागरिक वाच डेस्कले महानगरका केही वडामा संकलन ढिलाइ र नाली थुप्रिएको अवस्था रेकर्ड गरेको छ।',
          'फोहोर खुला ठाउँमा जम्मा हुँदा पानीजन्य रोगको जोखिम बढ्छ। यो सार्वजनिक स्वास्थ्यको विषय हो।',
          'स्रोतमै जैविक र अजैविक छुट्याउने अभ्यासले संकलन सहज बनाउँछ।',
          'पारदर्शी ठेक्का र सेवा मापनले जवाफदेहिता बढाउँछ।',
        ],
      },
      {
        slug: 'women-public-safety-transit',
        titleNe: 'सार्वजनिक यातायातमा महिला सुरक्षा: व्यवहारिक कदम',
        titleEn: 'Women safety on public transit: practical steps',
        deckNe: 'उजुरी संयन्त्र, प्रकाश व्यवस्था र चालक तालिम एकैपटक अघि बढ्नुपर्छ।',
        deckEn: 'Complaint channels, lighting and crew training must move together.',
        tags: ['editor-pick'],
        loc: 'ललितपुर',
        h2: 'तत्काल गर्न सकिने काम',
        bullets: ['हटलाइन र उजुरीको स्पष्ट प्रक्रिया', 'बसपार्क र स्टपमा पर्याप्त प्रकाश', 'तालिम र अनुगमनको सार्वजनिक सार'],
        paras: [
          'सार्वजनिक यातायातमा महिला सुरक्षा दीर्घकालीन बहस हो। नागरिक वाच डेस्कले यात्रु अनुभवलाई नीति सुधारसँग जोडेर हेर्छ।',
          'उजुरीपछिको प्रक्रिया अस्पष्ट हुँदा धेरै मौन बस्छन्।',
          'रातको रुटमा प्रकाश र भीड व्यवस्थापनले जोखिम घटाउन सक्छ।',
          'व्यवसायी र स्थानीय तहको सहकार्यबिना दिगो परिवर्तन गाह्रो हुन्छ।',
        ],
      },
      {
        slug: 'rural-health-post-staffing',
        titleNe: 'ग्रामीण स्वास्थ्य चौकी: जनशक्ति अभाव र सेवा निरन्तरता',
        titleEn: 'Rural health posts: staffing gaps and continuity',
        deckNe: 'स्वास्थ्यकर्मी अभावले मातृशिशु सेवामा असर पर्छ। सरुवा, तालिम र औषधि आपूर्ति सँगै हेर्नुपर्छ।',
        deckEn: 'Staffing gaps hit maternal care; transfers, training and medicine supply must align.',
        tags: ['labour-migration'],
        loc: 'रुकुम',
        h2: 'सेवा निरन्तरताका सर्त',
        bullets: ['रिक्त दरबन्दीको सार्वजनिक सूची', 'आकस्मिक औषधि बफर स्टक', 'रेफरल यातायात तयारी'],
        paras: [
          'दुर्गम स्वास्थ्य चौकीमा जनशक्ति अभाव पुरानो समस्या हो। नागरिक वाच डेस्कले सेवाग्राही कथा रेकर्ड गरेको छ।',
          'एकल कर्मीमा निर्भर इकाईमा बिदाले सेवा रोकिन सक्छ।',
          'औषधि आपूर्ति ढिला हुँदा निजी खर्च बढ्छ।',
          'तीनै तहको समन्वयबिना सुधार अधुरो रहन्छ।',
        ],
      },
      {
        slug: 'community-disaster-preparedness-drills',
        titleNe: 'समुदायिक विपद् अभ्यास: पूर्वतयारी नै जीवनरक्षा',
        titleEn: 'Community disaster drills: preparedness saves lives',
        deckNe: 'जोखिमयुक्त बस्तीमा पूर्वअभ्यास, आपतकालीन झोला र सम्पर्क सूचीले क्षति घटाउन सक्छ।',
        deckEn: 'Drills, go-bags and contact lists can reduce harm in high-risk settlements.',
        tags: ['climate'],
        loc: 'कास्की',
        featured: 'secondary',
        h2: 'परिवार स्तरको तयारी',
        bullets: ['आपतकालीन झोला र कागजात कपी', 'छिमेकी सम्पर्क सूची', 'निकासी मार्गको पूर्वजानकारी'],
        paras: [
          'विपद्पछि मात्र प्रतिक्रिया जनाउने शैली महँगो हुन्छ। नागरिक वाच डेस्कले अभ्यासलाई जीवनरक्षा लगानी मान्छ।',
          'विद्यालय र वडा मिलेर अभ्यास गर्दा बालबालिका तयार हुन्छन्।',
          'पूर्वसूचना स्थानीय भाषामा बुझिने हुनुपर्छ।',
          'महिला, वृद्ध र अपाङ्गता भएका व्यक्तिको आवश्यकता योजनामा देखिनुपर्छ।',
        ],
      },
    ],
  },
  business: {
    fn: 'editionBusiness',
    items: [
      {
        slug: 'wholesale-inflation-fuel-cost-pressure',
        titleNe: 'थोक मुद्रास्फीति र इन्धन लागत: बजारमा चाप',
        titleEn: 'Wholesale inflation and fuel costs press the market',
        deckNe: 'इन्धन र ढुवानी खर्च बढ्दा उत्पादन लागत उकालो लाग्छ। दशैंअघि खुद्रा मूल्य सर्ने जोखिम छ।',
        deckEn: 'Higher fuel and freight costs may feed into retail prices before Dashain.',
        tags: ['budget-2083'],
        loc: 'काठमाडौं',
        featured: 'lead',
        h2: 'उपभोक्ताले बुझ्नुपर्ने कुरा',
        bullets: ['ढुवानी लागतको हिस्सा', 'बजार अनुगमनको नियमितता', 'ऊर्जा बचत उपाय'],
        pull: 'लागत बढ्दा पारदर्शी मूल्य छलफलले अफवाह रोक्छ।',
        paras: [
          'थोक मूल्यको चापले खुद्रा बजार प्रभावित हुन सक्छ। नागरिक वाच आर्थिक डेस्कले इन्धन र ढुवानी श्रृंखला हेरेको छ।',
          'आयात निर्भर अर्थतन्त्र बाह्य झट्कामा छिट्टै प्रभावित हुन्छ।',
          'अनुगमन कमजोर भए अनावश्यक मूल्यवृद्धि मौलाउँछ।',
          'दीर्घकालमा ऊर्जा दक्षता र सार्वजनिक यातायात लगानी चाहिन्छ।',
        ],
      },
      {
        slug: 'nepse-investor-caution-signals',
        titleNe: 'नेप्सेमा सावधानी: लगानीकर्ताले हेर्ने संकेत',
        titleEn: 'NEPSE caution: signals to watch',
        deckNe: 'उतारचढावमा हल्ला होइन तरलता, कारोबार मात्रा र आधारभूत सूचक हेर्नुपर्छ।',
        deckEn: 'Watch liquidity, turnover and fundamentals rather than rumours.',
        tags: ['data-story'],
        loc: 'काठमाडौं',
        h2: 'सावधान अभ्यास',
        bullets: ['जोखिम सीमा तोक्नु', 'ऋण लिएर कारोबार नगर्नु', 'वित्तीय विवरण पढ्नु'],
        paras: [
          'छोटो उछालले नयाँ लगानीकर्ता तान्छ। नागरिक वाच डेस्क दीर्घकालीन अनुशासनमा जोड दिन्छ।',
          'कारोबार मात्रा र संस्थागत सहभागिता बजार स्वास्थ्य झल्काउँछ।',
          'वित्तीय साक्षरताबिनाको हतारले घाटा बढाउँछ।',
          'साप्ताहिक सारमा मुख्य सूचक सरल भाषामा आउनेछ।',
        ],
      },
      {
        slug: 'remittance-small-business-liquidity',
        titleNe: 'विप्रेषण र साना व्यवसाय: तरलताको सम्बन्ध',
        titleEn: 'Remittances and small business liquidity',
        deckNe: 'विप्रेषणले स्थानीय व्यापार चलायमान राख्छ। औपचारिक वित्तीय पहुँच बढ्दा उत्पादनशील प्रयोग बलियो हुन्छ।',
        deckEn: 'Remittances keep local trade moving; formal finance can lift productive use.',
        tags: ['labour-migration'],
        loc: 'झापा',
        h2: 'उत्पादनशील प्रयोग',
        bullets: ['सहकारी पारदर्शिता', 'साना कर्जाको सरल प्रक्रिया', 'डिजिटल भुक्तानी'],
        paras: [
          'विप्रेषण अर्थतन्त्रको मेरुदण्ड हो। नागरिक वाच डेस्कले साना पसलमा तरलता प्रवाह अवलोकन गरेको छ।',
          'नगद निर्भरताले जोखिम बढाउँछ।',
          'महिला उद्यमी पुँजी पहुँचमा थप अवरोध भोग्छन्।',
          'विप्रेषणलाई सीप र उद्यममा जोड्ने बहस आवश्यक छ।',
        ],
      },
      {
        slug: 'tourism-monsoon-season-strategy',
        titleNe: 'मनसुन पर्यटन: जोखिम व्यवस्थापनसहित सम्भावना',
        titleEn: 'Monsoon tourism with risk management',
        deckNe: 'घरेलु पर्यटन र छोटो गन्तव्यले व्यवसाय धान्न सक्छ। सुरक्षा सूचना स्पष्ट हुनुपर्छ।',
        deckEn: 'Domestic short trips can sustain hotels if safety information stays clear.',
        tags: ['climate'],
        loc: 'पोखरा',
        featured: 'secondary',
        h2: 'व्यवसायिक सावधानी',
        bullets: ['मौसम अद्यावधिक दिनु', 'रद्द नीति स्पष्ट राख्नु', 'गाइड तालिम'],
        paras: [
          'मनसुनलाई शून्य याम मात्र ठान्ने सोच पुरानो भयो। नागरिक वाच डेस्कले घरेलु माग हेरेको छ।',
          'जोखिम खुला बताए विश्वास बढ्छ।',
          'होमस्टेले आय विविधीकरण गर्छ।',
          'स्थानीय तहसँग संयुक्त सूचना उपयोगी हुन्छ।',
        ],
      },
      {
        slug: 'sme-credit-access-hurdles',
        titleNe: 'साना उद्योग: कर्जा पहुँचका अवरोध',
        titleEn: 'SME credit access hurdles',
        deckNe: 'धितो र कागजातको झन्झटले साना उद्यमी बैंकबाट टाढा रहन्छन्।',
        deckEn: 'Collateral and paperwork keep many small firms from bank credit.',
        tags: ['budget-2083'],
        loc: 'विराटनगर',
        h2: 'सुधार प्राथमिकता',
        bullets: ['एकद्वार चेकलिस्ट', 'महिला लक्षित उत्पादन', 'पुनर्भुक्तानी लचिलोपन'],
        paras: [
          'साना उद्योग रोजगारीको ठूलो स्रोत हुन्। नागरिक वाच डेस्कले कर्जा ढिलाइ रेकर्ड गरेको छ।',
          'अनौपचारिक ऋण महँगो तर छिटो देखिन्छ।',
          'तालिमसँगै कर्जा जोड्नुपर्छ।',
          'शाखा स्तरको अनुभव मापन गर्नैपर्छ।',
        ],
      },
    ],
  },
  sports: {
    fn: 'editionSports',
    items: [
      {
        slug: 'national-cricket-training-camp-focus',
        titleNe: 'राष्ट्रिय क्रिकेट शिविर: फिटनेस र खेल्ने मौकाको सन्तुलन',
        titleEn: 'National cricket camp: balancing fitness and game time',
        deckNe: 'शिविरले खेलाडी चयन मात्र होइन, चोट व्यवस्थापन र युवा मार्ग पनि देखाउनुपर्छ।',
        deckEn: 'Camps should show selection pathways, injury management and youth routes.',
        tags: ['nepal-cricket'],
        loc: 'कीर्तिपुर',
        featured: 'lead',
        h2: 'शिविरका प्राथमिकता',
        bullets: ['फिटनेस मापदण्ड सार्वजनिक गर्नु', 'उमेर समूह मार्गचित्र', 'घरेलु लिगसँग तालमेल'],
        paras: [
          'राष्ट्रिय क्रिकेट शिविरले आशा जगाउँछ। नागरिक वाच खेलकुद डेस्कले पारदर्शिता र खेलाडी स्वास्थ्यलाई केन्द्रमा राखेको छ।',
          'चोट लुकाएर खेलाउने दबाब दीर्घकालीन हानिकारक हुन्छ।',
          'घरेलु प्रतियोगितासँग जोडिएन भने शिविर एक्लो कार्यक्रम बन्छ।',
          'महिला र पुरुष दुवै संरचनामा समान लगानी बहस जरुरी छ।',
        ],
      },
      {
        slug: 'womens-football-pathway-nepal',
        titleNe: 'महिला फुटबल: मार्गचित्र र लगानीको खाँचो',
        titleEn: 'Women football needs a clearer pathway and funding',
        deckNe: 'विद्यालयदेखि राष्ट्रिय टोलीसम्मको बाटो स्पष्ट भए मात्र नतिजा दिगो हुन्छ।',
        deckEn: 'Results stay fragile until the school-to-national pathway is clear.',
        tags: ['fifa-world-cup'],
        loc: 'ललितपुर',
        h2: 'के चाहिन्छ',
        bullets: ['नियमित घरेलु लिग', 'कोचिङ तालिम', 'सुरक्षित प्रशिक्षण स्थल'],
        paras: [
          'महिला फुटबलमा उत्साह बढे पनि संरचना कमजोर छ। नागरिक वाच डेस्कले खेलाडी र प्रशिक्षकको अनुभव संकलन गरेको छ।',
          'खेल मैदान र यातायात खर्च सानो देखिए पनि ठूलो अवरोध हो।',
          'मिडिया कभरेज समान नहुँदा प्रायोजक आकर्षण कम हुन्छ।',
          'युवा प्रतिभा छानबिनलाई जिल्ला तहसम्म पुर्‍याउनुपर्छ।',
        ],
      },
      {
        slug: 'kathmandu-road-race-community-sport',
        titleNe: 'काठमाडौं रोड रेस: समुदायिक खेलको ऊर्जा',
        titleEn: 'Kathmandu road race energy for community sport',
        deckNe: 'सहरका दौडले स्वास्थ्य र सामूहिकता बढाउँछ। ट्राफिक व्यवस्थापन र सुरक्षा योजना अनिवार्य छ।',
        deckEn: 'City races build health and community if traffic and safety plans are solid.',
        tags: ['editor-pick'],
        loc: 'काठमाडौं',
        h2: 'आयोजक चेकलिस्ट',
        bullets: ['मेडिकल स्टेसन', 'पानी र छाया व्यवस्था', 'ट्राफिक सूचना अग्रिम'],
        paras: [
          'रोड रेसले नयाँ धावक तान्छ। नागरिक वाच डेस्कले आयोजना गुणस्तरलाई पाठक सुरक्षाका आधारमा हेर्छ।',
          'मनसुन अघि/पछिको मौसम योजना छुट्टै चाहिन्छ।',
          'स्थानीय क्लब सहभागिताले दिगोपन बढाउँछ।',
          'फोहोर व्यवस्थापन पनि आयोजनाको हिस्सा हो।',
        ],
      },
      {
        slug: 'school-sports-funding-gap',
        titleNe: 'विद्यालय खेलकुद: बजेट अभावले साँघुरिएको मैदान',
        titleEn: 'School sports squeezed by funding gaps',
        deckNe: 'खेल शिक्षक र आधारभूत सामग्री अभावले बालबालिकाको शारीरिक शिक्षा कमजोर बन्छ।',
        deckEn: 'Missing teachers and basic gear weaken physical education.',
        tags: ['budget-2083'],
        loc: 'भक्तपुर',
        featured: 'secondary',
        h2: 'न्यूनतम मापदण्ड',
        bullets: ['सुरक्षित खेल मैदान', 'आधारभूत किट', 'वार्षिक प्रतियोगिता क्यालेन्डर'],
        paras: [
          'विद्यालय खेलकुद भनेको प्रतियोगिता मात्र होइन। नागरिक वाच डेस्कले यसलाई स्वास्थ्य र अनुशासनसँग जोड्छ।',
          'बजेट रेखामा खेल सामग्री प्राथमिकता नपर्दा मैदान खाली रहन्छ।',
          'अभिभावक र स्थानीय तहको साझेदारीले सानो लगानी पनि प्रभावशाली बनाउँछ।',
          'बालिका सहभागिता बढाउने विशेष योजना चाहिन्छ।',
        ],
      },
      {
        slug: 'monsoon-sports-calendar-adjustments',
        titleNe: 'मनसुन खेल पात्रो: रद्द होइन, पुनःतालिका',
        titleEn: 'Monsoon sports calendar: reschedule, do not abandon',
        deckNe: 'वर्षायाममा खेल स्थगित हुनु सामान्य हो। स्पष्ट पुनःतालिका आए खेलाडी र दर्शक दुवै तयार हुन्छन्।',
        deckEn: 'Rain delays are normal; clear rescheduling keeps athletes and fans ready.',
        tags: ['nepal-cricket'],
        loc: 'काठमाडौं',
        h2: 'सञ्चार सुधार',
        bullets: ['रद्द सूचना छिटो', 'टिकट फिर्ता नीति', 'इनडोर विकल्प'],
        paras: [
          'मनसुनले मैदानी खेल प्रभावित पार्छ। नागरिक वाच डेस्कले पारदर्शी पात्रो अद्यावधिक माग्छ।',
          'अन्तिम समय रद्दले यात्रा खर्च बढाउँछ।',
          'इनडोर प्रशिक्षण निरन्तरताका लागि उपयोगी हुन्छ।',
          'प्रदेश स्तरीय प्रतियोगितामा मौसम बफर दिन राख्नुपर्छ।',
        ],
      },
    ],
  },
  entertainment: {
    fn: 'editionEntertainment',
    items: [
      {
        slug: 'nepali-film-festival-prep',
        titleNe: 'नेपाली चलचित्र महोत्सव तयारी: दर्शक र सिर्जनाकारको पुल',
        titleEn: 'Nepali film festival prep bridges audiences and makers',
        deckNe: 'महोत्सवले नयाँ फिल्म देखाउने मात्र होइन, छलफल र सहकार्यको मञ्च पनि खुलाउनुपर्छ।',
        deckEn: 'Festivals should open discussion and collaboration, not only screenings.',
        tags: ['editor-pick'],
        loc: 'काठमाडौं',
        featured: 'lead',
        h2: 'महोत्सवका मापदण्ड',
        bullets: ['सुलभ टिकट', 'नयाँ निर्देशक खण्ड', 'उपशीर्षक पहुँच'],
        paras: [
          'चलचित्र महोत्सव सांस्कृतिक क्यालेन्डरको महत्त्वपूर्ण हिस्सा हो। नागरिक वाच डेस्कले पहुँच र विविधतालाई मापदण्ड मान्छ।',
          'केवल प्रचार होइन, सिर्जनाकार संवाद चाहिन्छ।',
          'भाषा उपशीर्षकले फरक दर्शक जोड्छ।',
          'स्थानीय हल सहकार्यले लागत घटाउन सक्छ।',
        ],
      },
      {
        slug: 'folk-music-revival-stages',
        titleNe: 'लोक संगीत पुनरुत्थान: मञ्च र पुस्ता हस्तान्तरण',
        titleEn: 'Folk music revival needs stages and generational handoff',
        deckNe: 'लोक धुन जोगाउन रेकर्डिङसँगै जीवित प्रदर्शन र शिक्षण चाहिन्छ।',
        deckEn: 'Keeping folk music alive needs live stages and teaching, not only recordings.',
        tags: [],
        loc: 'पोखरा',
        h2: 'जोगाउने उपाय',
        bullets: ['विद्यालय कार्यक्रम', 'सामुदायिक रेडियो प्रसारण', 'युवा कलाकार मेन्टरसिप'],
        paras: [
          'लोक संगीत पहिचानको अंश हो। नागरिक वाच डेस्कले पुस्ता हस्तान्तरण कमजोर हुँदा चिन्ता व्यक्त गर्छ।',
          'पर्यटन प्रदर्शन मात्र पर्याप्त होइन।',
          'महिला लोक गायिकाको मञ्च पहुँच बढाउनुपर्छ।',
          'डिजिटल अभिलेखले संरक्षण सहयोग गर्छ।',
        ],
      },
      {
        slug: 'kathmandu-theatre-season',
        titleNe: 'काठमाडौं रङ्गमञ्च याम: सानो हल, ठूलो संवाद',
        titleEn: 'Kathmandu theatre season: small halls, big conversation',
        deckNe: 'रङ्गमञ्चले सामाजिक विषय उठाउँछ। टिकट मूल्य र हल उपलब्धताले पहुँच निर्धारण गर्छ।',
        deckEn: 'Theatre raises social themes; ticket price and hall access decide who can attend.',
        tags: ['editor-pick'],
        loc: 'काठमाडौं',
        h2: 'दर्शक विस्तार',
        bullets: ['विद्यार्थी छुट', 'भ्रमण प्रदर्शनी', 'स्थानीय भाषा नाटक'],
        paras: [
          'रङ्गमञ्च समुदाय संवादको शक्तिशाली माध्यम हो। नागरिक वाच डेस्कले साना उत्पादनलाई स्थान दिन आग्रह गर्छ।',
          'हल भाडा मुख्य खर्च हो।',
          'समीक्षा संस्कृतिले गुणस्तर बहस खुलाउँछ।',
          'प्रदेश सहरमा भ्रमणले दर्शक आधार फराकिलो बनाउँछ।',
        ],
      },
      {
        slug: 'streaming-vs-cinema-debate',
        titleNe: 'स्ट्रिमिङ र सिनेमा हल: सहअस्तित्वको बाटो',
        titleEn: 'Streaming and cinema halls can coexist',
        deckNe: 'दर्शक आदत फेरिएको छ। हल अनुभव र घरेलु हेराइ दुवैका लागि स्पष्ट रणनीति चाहिन्छ।',
        deckEn: 'Audience habits changed; halls and home viewing both need clear strategies.',
        tags: [],
        loc: 'काठमाडौं',
        featured: 'secondary',
        h2: 'उद्योगका प्रश्न',
        bullets: ['रिलिज झ्याल पारदर्शिता', 'राजस्व बाँडफाँड', 'पाइरेसी निवारण'],
        paras: [
          'स्ट्रिमिङले पहुँच बढायो तर हल अर्थतन्त्रमा चाप पर्‍यो। नागरिक वाच डेस्क दुवै माध्यमको सहअस्तित्व खोज्छ।',
          'नेपाली सामग्रीको खोज योग्यता महत्त्वपूर्ण छ।',
          'सिनेमा हल सामाजिक अनुभव बेच्न सक्छ।',
          'नीतिले साना निर्मातालाई ठाउँ दिनुपर्छ।',
        ],
      },
      {
        slug: 'heritage-cultural-events-calendar',
        titleNe: 'साँस्कृतिक सम्पदा कार्यक्रम: पात्रो र सहभागिता',
        titleEn: 'Heritage cultural events need a clear calendar',
        deckNe: 'जात्रा र प्रदर्शनीको अग्रिम पात्रो आए परिवार र पर्यटक दुवै योजना बनाउन सक्छन्।',
        deckEn: 'Advance calendars help families and visitors plan around festivals and exhibitions.',
        tags: ['climate'],
        loc: 'भक्तपुर',
        h2: 'आयोजना सुधार',
        bullets: ['अग्रिम सूचना', 'भीड व्यवस्थापन', 'स्थानीय कलाकार प्राथमिकता'],
        paras: [
          'साँस्कृतिक कार्यक्रम शहरको पहिचान हो। नागरिक वाच डेस्कले सुरक्षा र पहुँचलाई जोड दिन्छ।',
          'मनसुन याममा वैकल्पिक स्थल योजना चाहिन्छ।',
          'युवा स्वयंसेवक परिचालनले ऊर्जा थप्छ।',
          'अभिलेखीकरणले पछिल्ला पुस्तालाई सम्पदा बुझाउँछ।',
        ],
      },
    ],
  },
  world: {
    fn: 'editionWorld',
    items: [
      {
        slug: 'west-asia-energy-shock-nepal-lens',
        titleNe: 'पश्चिम एशिया ऊर्जा तनाव: नेपाली अर्थतन्त्रको लेन्स',
        titleEn: 'West Asia energy tension through a Nepal lens',
        deckNe: 'वैश्विक इन्धन मूल्य उकालो लाग्दा आयात बिल र यातायात खर्चमा चाप पर्छ। तयारी र पारदर्शिता चाहिन्छ।',
        deckEn: 'Global fuel spikes hit import bills and transport costs; preparation and transparency matter.',
        tags: ['geopolitics'],
        loc: 'काठमाडौं',
        featured: 'lead',
        h2: 'नेपालले हेर्नुपर्ने पक्ष',
        bullets: ['इन्धन मौज्दात स्थिति', 'सार्वजनिक यातायात विकल्प', 'मूल्य समायोजन प्रक्रिया'],
        paras: [
          'वैश्विक ऊर्जा तनाव टाढाको समाचार होइन। नागरिक वाच विश्व डेस्कले यसलाई घरेलु लागतसँग जोडेर हेर्छ।',
          'अफवाहले बजार बिगार्छ। आधिकारिक तथ्यांक नियमित आउनुपर्छ।',
          'ऊर्जा विविधीकरण दीर्घकालीन सुरक्षा हो।',
          'पाठकलाई सरल व्याख्या प्राथमिकता हुनेछ।',
        ],
      },
      {
        slug: 'south-asia-monsoon-regional-picture',
        titleNe: 'दक्षिण एसिया मनसुन: क्षेत्रीय तस्बिर र साझा जोखिम',
        titleEn: 'South Asia monsoon: shared regional risks',
        deckNe: 'वर्षा प्रणाली सिमाना पार गर्छ। बाढी पूर्वसूचना सहकार्यले क्षति घटाउन सक्छ।',
        deckEn: 'Rain systems cross borders; flood warning cooperation can cut losses.',
        tags: ['climate'],
        loc: 'काठमाडौं',
        h2: 'सहकार्यका क्षेत्र',
        bullets: ['नदी प्रवाह आदानप्रदान', 'पूर्वसूचना भाषा सरलता', 'सीमावर्ती राहत समन्वय'],
        paras: [
          'मनसुन क्षेत्रीय घटना हो। नागरिक वाच डेस्कले नदी र बाढी जोखिमलाई साझा चुनौती मान्छ।',
          'डाटा आदानप्रदान ढिला हुँदा तयारी कमजोर हुन्छ।',
          'कृषकलाई मौसम सार समयमै चाहिन्छ।',
          'जलवायु अनुकूलन बजेट प्राथमिकतामा पर्नुपर्छ।',
        ],
      },
      {
        slug: 'remittance-corridors-global-context',
        titleNe: 'विप्रेषण करिडोर: विश्व श्रम बजारको सन्दर्भ',
        titleEn: 'Remittance corridors in the global labour market',
        deckNe: 'गन्तव्य मुलुकको नीति फेरिँदा नेपाली परिवारको आय प्रभावित हुन्छ। सूचना पहुँच महत्त्वपूर्ण छ।',
        deckEn: 'Destination policy shifts affect Nepali household income; information access matters.',
        tags: ['labour-migration'],
        loc: 'काठमाडौं',
        h2: 'परिवारले जान्नुपर्ने',
        bullets: ['कानुनी कामदार मार्ग', 'शुल्क पारदर्शिता', 'गुनासो संयन्त्र'],
        paras: [
          'श्रम प्रवास विश्व श्रम बजारसँग जोडिएको छ। नागरिक वाच डेस्कले करिडोर जोखिम पाठकलाई बुझाउँछ।',
          'अनौपचारिक दलाली महँगो र जोखिमपूर्ण हुन्छ।',
          'सीप प्रमाणीकरणले रोजगारी सुरक्षा बढाउँछ।',
          'महिला कामदार सुरक्षा अलग प्राथमिकता हो।',
        ],
      },
      {
        slug: 'climate-summit-prep-reader-brief',
        titleNe: 'जलवायु सम्मेलन तयारी: पाठक ब्रिफ',
        titleEn: 'Climate summit prep: a reader brief',
        deckNe: 'सम्मेलनका वाचा घरेलु नीतिमा झर्दा मात्र अर्थ राख्छन्। अनुकूलन र वित्त दुवै हेर्नुपर्छ।',
        deckEn: 'Summit pledges matter when they land in domestic policy on adaptation and finance.',
        tags: ['climate'],
        loc: 'काठमाडौं',
        featured: 'secondary',
        h2: 'नेपालका प्राथमिकता',
        bullets: ['हिमाली जोखिम', 'कृषि बीमा', 'हरित वित्त पहुँच'],
        paras: [
          'जलवायु कूटनीति जटिल लाग्न सक्छ। नागरिक वाच डेस्कले यसलाई स्थानीय प्रभावमा अनुवाद गर्छ।',
          'अनुकूलन आयोजना ढिलाइले क्षति बढाउँछ।',
          'युवा आवाज नीति छलफलमा सुनिनुपर्छ।',
          'पारदर्शी प्रतिवेदनले विश्वास जन्माउँछ।',
        ],
      },
      {
        slug: 'human-rights-displacement-context',
        titleNe: 'विस्थापन र मानव अधिकार: विश्व सन्दर्भको पाठ',
        titleEn: 'Displacement and human rights: a global context lesson',
        deckNe: 'संघर्ष र विपद्ले मानिस विस्थापित हुँदा अन्तर्राष्ट्रिय मापदण्ड र स्थानीय तयारी दुवै जाँच्नुपर्छ।',
        deckEn: 'Conflict and disaster displacement test international standards and local readiness.',
        tags: ['geopolitics'],
        loc: 'काठमाडौं',
        h2: 'पाठकका लागि मुख्य बुँदा',
        bullets: ['सुरक्षित आश्रय', 'सूचना पहुँच', 'बालबालिका संरक्षण'],
        paras: [
          'विस्थापनको समाचार संख्यामा मात्र सीमित हुनुहुँदैन। नागरिक वाच डेस्क मानवीय मापदण्डमा जोड दिन्छ।',
          'महिला र बालबालिका जोखिममा बढी पर्छन्।',
          'मिडियाले गरिमा जोगाएर रिपोर्ट गर्नुपर्छ।',
          'नेपालको आफ्नै विपद् अनुभवले सहानुभूति मात्र होइन, तयारी पाठ दिन्छ।',
        ],
      },
    ],
  },
}

// Continue with remaining categories in same object
Object.assign(all, {
  opinion: {
    fn: 'editionOpinion',
    items: [
      mk('federalism-accountability-column', 'संघीयतामा जवाफदेहिता: सेवा नतिजाबाट मापन', 'Federalism accountability must be measured by service results', 'पद होइन, सेवा गति र गुणस्तरले संघीयता जाँच्नुपर्छ।', 'Judge federalism by service speed and quality, not posts.', ['editor-pick'], 'काठमाडौं', 'lead', 'तीन तहका प्रश्न', ['वडा सेवा समय', 'प्रदेश बजेट कार्यान्वयन', 'संघीय मापदण्ड'], ['संघीयताको सफलता नागरिकको दैनिक अनुभवमा देखिनुपर्छ। नागरिक वाच विचार डेस्कले सेवा नतिजालाई केन्द्रमा राख्छ।', 'दोहोरो जिम्मेवारीले नागरिक अन्योलमा पर्छन्।', 'खुला तथ्यांकले तुलना सजिलो बनाउँछ।', 'स्थानीय सुनुवाइ नियमित हुनुपर्छ।']),
      mk('monsoon-urban-planning-oped', 'मनसुन र सहरी योजना: नालीदेखि आवाससम्म', 'Monsoon and urban planning from drains to housing', 'वर्षा हरेक साल आउँछ। तयारी हरेक साल अधुरो किन?', 'Rain is annual; preparation should not stay incomplete.', ['climate'], 'काठमाडौं', null, 'योजनाका प्राथमिकता', ['निकास क्षमता', 'अवैध निर्माण नियन्त्रण', 'हरित क्षेत्र'], ['सहरी बाढी प्राकृतिक मात्र होइन। नागरिक वाच डेस्क योजना कमजोरीतिर औंल्याउँछ।', 'नक्सा र वास्तविक नाली फरक हुनुहुँदैन।', 'गरिब बस्ती जोखिममा बढी पर्छ।', 'दीर्घकालीन लगानी अल्पकालीन राहतभन्दा सस्तो हुन्छ।']),
      mk('press-freedom-ethics-note', 'प्रेस स्वतन्त्रता र नैतिकता: एकै सिक्काका दुई पाटा', 'Press freedom and ethics are two sides of one coin', 'स्वतन्त्रतालाई विश्वसनीयतासँग जोडेर मात्र सार्वजनिक हित जोगिन्छ।', 'Freedom only serves the public when paired with credibility.', ['exclusive-report'], 'काठमाडौं', 'secondary', 'सम्पादकीय मापदण्ड', ['स्रोत संरक्षण', 'सच्याइ नीति', 'घृणा भाषण बन्देज'], ['नागरिक वाच विचारमा प्रेस स्वतन्त्रता जिम्मेवारीसहित आउँछ।', 'हतारको हेडलाइनले क्षति पुर्‍याउन सक्छ।', 'पाठक गुनासो सुनुवाइ खुला हुनुपर्छ।', 'स्वतन्त्र पत्रकारिता लोकतन्त्रको अक्सिजन हो।']),
      mk('youth-employment-policy-view', 'युवा रोजगारी नीति: वाचा होइन बाटो चाहिन्छ', 'Youth employment policy needs pathways not pledges', 'सीप, इंटर्नसिप र उद्यम सहयोग एकै प्याकेजमा आउनुपर्छ।', 'Skills, internships and enterprise support must arrive as one package.', ['labour-migration'], 'काठमाडौं', null, 'नीति जाँच सूची', ['सीप माग मिलान', 'क्षेत्रीय अवसर', 'महिला सुरक्षा'], ['रोजगारी अभावले निराशा बढाउँछ। नागरिक वाच डेस्क बाटो मापनयोग्य होस् भन्छ।', 'वैदेशिक रोजगारी मात्र उत्तर होइन।', 'स्थानीय उद्योगसँग तालिम जोड्नुपर्छ।', 'युवा आवाज नीति बनाउँदा सुनिनुपर्छ।']),
      mk('public-transport-investment-case', 'सार्वजनिक यातायात लगानी: शहरको साझा हित', 'Public transport investment is a shared city interest', 'सस्तो, सुरक्षित र भरपर्दो यातायातले वायु र समय दुवै जोगाउँछ।', 'Affordable reliable transit saves air and time.', ['budget-2083'], 'काठमाडौं', null, 'लगानीका आधार', ['बस फ्रिक्वेन्सी', 'महिला सुरक्षा', 'एकीकृत टिकट'], ['निजी सवारी मात्रले शहर धान्दैन। नागरिक वाच डेस्क सार्वजनिक विकल्प बलियो बनाउन तर्क गर्छ।', 'अनुदान पारदर्शी हुनुपर्छ।', 'पैदल र साइकल पूर्वाधार छुटाउनु हुँदैन।', 'डेटामा आधारित रुट योजना चाहिन्छ।']),
    ],
  },
  literature: {
    fn: 'editionLiterature',
    items: [
      mk('new-nepali-poetry-collections', 'नयाँ नेपाली कविता संग्रह: स्वर र प्रयोग', 'New Nepali poetry collections: voice and experiment', 'युवा कविताले शहर, प्रवास र पहिचानका प्रश्न उठाएको छ।', 'Young poetry raises questions of city, migration and identity.', ['editor-pick'], 'काठमाडौं', 'lead', 'पढ्दा ध्यान दिनुहोस्', ['भाषा प्रयोग', 'सामाजिक सन्दर्भ', 'पाठ समूह छलफल'], ['नागरिक वाच साहित्य डेस्कले नयाँ संग्रहलाई पाठक Bridging का रूपमा हेर्छ।', 'कविता महोत्सवले संवाद बढाउँछ।', 'विद्यालय पुस्तकालयमा कविता खण्ड चाहिन्छ।', 'अनुवादले पहुँच फराकिलो बनाउँछ।']),
      mk('classic-prose-translation-wave', 'क्लासिक गद्य अनुवाद: नयाँ पुस्तासम्मको पुल', 'Classic prose translation as a bridge to new readers', 'पुराना कृति अनुवाद र सम्पादनले साहित्यिक सम्पदा जीवित राख्छ।', 'Edited translations keep literary heritage alive for new readers.', [], 'ललितपुर', null, 'संरक्षणका काम', ['सटीक टिप्पणी', 'सुलभ संस्करण', 'डिजिटल अभिलेख'], ['अनुवाद श्रमसँग जोडिएको काम हो। नागरिक वाच डेस्क गुणस्तरमा जोड दिन्छ।', 'पाठ्यक्रममा क्लासिक समावेश बहस खुला हुनुपर्छ।', 'महिला लेखक पुनःपठन आवश्यक छ।', 'सार्वजनिक पुस्तकालय साझेदार हुन सक्छन्।']),
      mk('literary-festivals-access', 'साहित्य महोत्सव: पहुँच र विविध स्वर', 'Literary festivals need access and diverse voices', 'महोत्सवले ठूला नाम मात्र होइन, नयाँ लेखक पनि स्थान दिनुपर्छ।', 'Festivals must platform new writers, not only big names.', ['editor-pick'], 'पोखरा', 'secondary', 'पहुँच सुधार', ['निःशुल्क सत्र', 'सांकेतिक भाषा/उपशीर्षक', 'प्रदेश भ्रमण'], ['साहित्य महोत्सव उत्सव मात्र होइन। नागरिक वाच डेस्क संवाद गुणस्तर हेर्छ।', 'टिकट महँगो हुँदा युवा टाढिन्छन्।', 'स्थानीय भाषा सत्रले विविधता देखाउँछ।', 'पुस्तक बिक्री र लेखक रोजीरोटी जोडिनुपर्छ।']),
      mk('school-reading-culture', 'विद्यालय पठन संस्कृति: परीक्षाभन्दा पर', 'School reading culture beyond exams', 'रुचिपूर्ण पठनले भाषा र सोच दुवै बलियो बनाउँछ।', 'Pleasure reading strengthens language and thought.', ['budget-2083'], 'कास्की', null, 'विद्यालय कदम', ['पुस्तक कुना', 'साप्ताहिक पठन समय', 'अभिभावक सहभागिता'], ['परीक्षा केन्द्रित पठनले रुचि मार्छ। नागरिक वाच डेस्क स्वतन्त्र पठन प्रोत्साहन गर्छ।', 'पुस्तकालय बजेट सानो तर प्रभावशाली हुन सक्छ।', 'बाल साहित्य विविधता चाहिन्छ।', 'शिक्षक तालिमले फरक पार्छ।']),
      mk('diaspora-writers-notebook', 'प्रवासी लेखक नोटबुक: दुई दुनियाबीचको कथा', 'Diaspora writers notebook: stories between two worlds', 'प्रवास अनुभवले नेपाली साहित्यमा नयाँ भूगोल थपेको छ।', 'Migration experience adds new geographies to Nepali literature.', ['labour-migration'], 'काठमाडौं', null, 'सम्पादकीय चासो', ['भाषा मिश्रण', 'घरको स्मृति', 'पहचान द्वन्द्व'], ['प्रवासी लेखन सेतु हो। नागरिक वाच साहित्य डेस्क यसलाई मूलधार बहसमा ल्याउँछ।', 'प्रकाशन पहुँच असमान छ।', 'अनलाइन पत्रिकाले ठाउँ दिएका छन्।', 'पाठक क्लबले संवाद जीवित राख्छ।']),
    ],
  },
})

Object.assign(all, {
  technology: {
    fn: 'editionTechnology',
    items: [
      mk('digital-id-public-services', 'डिजिटल परिचय र सार्वजनिक सेवा: सहजता र सुरक्षा', 'Digital ID and public services: ease with security', 'अनलाइन सेवाले समय बचत गर्छ। डाटा सुरक्षा र अफलाइन विकल्प भने अनिवार्य छ।', 'Online services save time; data security and offline options remain essential.', ['data-story'], 'काठमाडौं', 'lead', 'प्रयोगकर्ता अधिकार', ['सहमति स्पष्टता', 'उजुरी मार्ग', 'अफलाइन सेवा'], ['डिजिटल सेवा विस्तार सकारात्मक छ। नागरिक वाच प्रविधि डेस्कले पहुँच र गोपनीयता सँगै हेर्छ।', 'ग्रामीण इन्टरनेट अभावले असमानता बढाउँछ।', 'फिसिङ चेतना अभियान चाहिन्छ।', 'सरकारी एप अद्यावधिक र सरल हुनुपर्छ।']),
      mk('fintech-rural-access', 'फिनटेक ग्रामीण पहुँच: मोबाइल बैकिङको अर्को चरण', 'Fintech rural access: next step for mobile banking', 'भुक्तानी सजिलो बनाउँदा शुल्क पारदर्शिता र ग्राहक शिक्षा छुटाउनु हुँदैन।', 'Easier payments still need clear fees and customer education.', ['budget-2083'], 'धनकुटा', null, 'विश्वासका सर्त', ['शुल्क देखिने', 'लेनदेन रसीद', 'ग्राहक सहयोग'], ['डिजिटल भुक्तानीले बजार चलायमान बनाउँछ। नागरिक वाच डेस्क दुरुपयोग जोखिम पनि देखाउँछ।', 'महिला प्रयोगकर्ता तालिम प्रभावकारी हुन्छ।', 'एजेन्ट नेटवर्क गुणस्तर मापनयोग्य बनाउनुपर्छ।', 'नेटवर्क डाउन हुँदा वैकल्पिक प्रक्रिया चाहिन्छ।']),
      mk('cyber-hygiene-for-readers', 'साइबर स्वच्छता: पाठकका लागि व्यावहारिक गाइड', 'Cyber hygiene: a practical reader guide', 'पासवर्ड, फिसिङ लिंक र सार्वजनिक वाईफाई सावधानीले ठगी जोखिम घटाउँछ।', 'Password habits, phishing caution and public Wi-Fi care cut fraud risk.', ['exclusive-report'], 'काठमाडौं', 'secondary', 'आजै गर्न सकिने', ['दुई चरणीय प्रमाणीकरण', 'अपरिचित लिंक नखोल्ने', 'सफ्टवेयर अद्यावधिक'], ['साइबर ठगी बढ्दो चिन्ता हो। नागरिक वाच डेस्कले जटिल शब्द बिना गाइड दिन्छ।', 'परिवारका वृद्ध सदस्यलाई छुट्टै सघाउ चाहिन्छ।', 'बैंक/सेवा प्रदायक अलर्ट पढ्ने बानी बसाल्नुहोस्।', 'विद्यालयमा आधारभूत पाठ्यक्रम उपयोगी हुन्छ।']),
      mk('ai-newsroom-ethics', 'एआई र न्यूजरुम नैतिकता: मानव सम्पादन अपरिहार्य', 'AI and newsroom ethics: human editing stays essential', 'औजारले गति बढाउन सक्छ। सत्यता जाँच र जवाफदेहिता मानव जिम्मेवारी नै रहन्छ।', 'Tools can speed work; accuracy checks and accountability stay human.', ['editor-pick'], 'काठमाडौं', null, 'प्रयोग मापदण्ड', ['स्रोत प्रमाण', 'पारदर्शी खुलासा', 'सच्याइ प्रक्रिया'], ['एआई बहस न्यूजरुमभित्र पनि छ। नागरिक वाच डेस्क मानव सम्पादनलाई केन्द्र मान्छ।', 'अन्धो निर्भरताले त्रुटि फैलाउँछ।', 'पाठकलाई प्रक्रिया बुझाउनु विश्वास हो।', 'तालिम र नीति दुवै चाहिन्छ।']),
      mk('broadband-in-the-hills', 'पहाडी ब्रोडब्यान्ड: शिक्षा र स्वास्थ्यको पूर्वाधार', 'Hill broadband as education and health infrastructure', 'इन्टरनेट विलासिता होइन। दूरशिक्षा र टेलिमेडिसिनका लागि आधारभूत सेवा हो।', 'Internet is basic infrastructure for remote learning and telemedicine.', ['climate'], 'सोल्खुम्बु', null, 'लगानी प्राथमिकता', ['विद्यालय कनेक्टिभिटी', 'स्वास्थ्य चौकी लिंक', 'मर्मत सम्झौता'], ['पहाडी कनेक्टिभिटी असमान छ। नागरिक वाच डेस्कले यसलाई विकास सूचक मान्छ।', 'केबल र वायरलेस मिश्रित समाधान चाहिन्छ।', 'बिजुली आपूर्तिसँगै योजना बनाउनुपर्छ।', 'स्थानीय प्राविधिक तालिम दिगोपन हो।']),
    ],
  },
  health: {
    fn: 'editionHealth',
    items: [
      mk('monsoon-disease-alert-guide', 'मनसुन रोग सतर्कता: ज्वरो र पानीजन्य संक्रमण', 'Monsoon disease alert: fever and water-borne infection', 'सफा पानी, हात धुने बानी र छिटो जाँचले जटिलता घटाउँछ।', 'Clean water, handwashing and early checks reduce complications.', ['climate'], 'काठमाडौं', 'lead', 'घरमा अपनाउने सावधानी', ['उमालेको/शोधित पानी', 'झुलको प्रयोग', 'लक्षण देखिए जाँच'], ['मनसुनमा संक्रमण जोखिम बढ्छ। नागरिक वाच स्वास्थ्य डेस्कले डर होइन तयारीको सन्देश दिन्छ।', 'अस्पताल भीड व्यवस्थापन चाहिन्छ।', 'गर्भवती र बालबालिका प्राथमिक समूह हुन्।', 'अफवाह औषधि सेवन घातक हुन सक्छ।']),
      mk('rural-maternal-care-access', 'ग्रामीण मातृ देखभाल: पहुँच र सम्मान', 'Rural maternal care: access with dignity', 'प्रसूति सेवा नजिक र सम्मानजनक हुनुपर्छ। यातायात र २४ घण्टे जनशक्ति मुख्य चुनौती हुन्।', 'Maternity care must be near and respectful; transport and 24-hour staffing are key hurdles.', [], 'अछाम', null, 'सुधारका स्तम्भ', ['एम्बुलेन्स/कोष', 'प्रशिक्षित कर्मी', 'पोषण परामर्श'], ['मातृ मृत्यु घटाउने लक्ष्य सेवा गुणस्तरमा निर्भर छ। नागरिक वाच डेस्कले बाधा रेकर्ड गर्छ।', 'घर प्रसूति बाध्यता बन्नु हुँदैन।', 'परिवार निर्णय प्रक्रियामा महिला आवाज सुनिनुपर्छ।', 'रेफरल अस्पतालसँग समन्वय अनिवार्य छ।']),
      mk('mental-health-stigma-break', 'मानसिक स्वास्थ्य कलंक तोड्ने कुरा', 'Breaking mental health stigma', 'सहयोग माग्नु कमजोरी होइन। परामर्श पहुँच र गोपनीयता बढाउनुपर्छ।', 'Seeking help is not weakness; counselling access and privacy must expand.', ['editor-pick'], 'काठमाडौं', 'secondary', 'समुदाय भूमिका', ['विद्यालय परामर्श', 'कार्यस्थल नीति', 'मिडिया भाषा'], ['मानसिक स्वास्थ्य बहस बढे पनि कलंक बाँकी छ। नागरिक वाच डेस्क संवेदनशील भाषामा जोड दिन्छ।', 'आत्महत्या समाचारमा सावधानी अपरिहार्य छ।', 'सेवा शुल्क र दूरी अवरोध हुन्।', 'परिवार समर्थन निर्णायक हुन्छ।']),
      mk('hospital-waiting-time-transparency', 'अस्पताल प्रतीक्षा समय: पारदर्शिता किन चाहिन्छ', 'Hospital waiting times need transparency', 'कति कुर्नुपर्छ भन्ने जानकारी आए बिरामी योजना बनाउन सक्छन्।', 'Knowing expected waits helps patients plan.', ['data-story'], 'काठमाडौं', null, 'प्रशासन कदम', ['विभागगत औसत समय', 'टोकन प्रणाली', 'आपतकाल छुट्याउने'], ['लामो लहरले विश्वास घटाउँछ। नागरिक वाच डेस्क मापन र प्रकाशन माग्छ।', 'कर्मचारी अभाव लुकाएर समाधान हुँदैन।', 'डिजिटल अपोइन्टमेन्ट सहयोगी हुन सक्छ।', 'निजी र सरकारी दुवैमा मापदण्ड चाहिन्छ।']),
      mk('vaccine-awareness-community', 'खोप चेतना: समुदाय विश्वास पुनर्निर्माण', 'Vaccine awareness and rebuilding community trust', 'स्पष्ट जानकारी र स्वास्थ्यकर्मी संवादले द्विविधा घटाउँछ।', 'Clear information and health-worker dialogue reduce doubt.', [], 'महोत्तरी', null, 'सञ्चार सुझाव', ['स्थानीय भाषा', 'साइड इफेक्ट इमानदारी', 'प्रश्नोत्तर सत्र'], ['खोप कार्यक्रम जनस्वास्थ्यको आधार हो। नागरिक वाच डेस्क अफवाहको जवाफ तथ्यले दिन्छ।', 'विद्यालय अभियान प्रभावकारी हुन्छ।', 'गर्भवती परामर्श छुटाउनु हुँदैन।', 'शितल श्रृंखला विश्वसनीय बनाउनुपर्छ।']),
    ],
  },
  education: {
    fn: 'editionEducation',
    items: [
      mk('see-grade12-result-culture', 'परीक्षा नतिजा संस्कृति: अंकभन्दा सिकाइ', 'Exam result culture: learning beyond marks', 'नतिजा आएपछिको दबाब व्यवस्थापन र मार्गदर्शन उत्तिकै महत्त्वपूर्ण छ।', 'After results, pressure management and guidance matter as much as scores.', ['editor-pick'], 'काठमाडौं', 'lead', 'अभिभावक भूमिका', ['तुलना कम गर्ने', 'वैकल्पिक मार्ग खुला राख्ने', 'मानसिक सहयोग'], ['परीक्षा नतिजा संवेदनशील समय हो। नागरिक वाच शिक्षा डेस्कले बालबालिकाको गरिमा जोगाउन आग्रह गर्छ।', 'असफलता अन्त्य होइन।', 'क्यारियर परामर्श विद्यालयमै चाहिन्छ।', 'डिजिटल नतिजा पहुँच समान होस्।']),
      mk('teacher-shortage-hills', 'पहाडी शिक्षक अभाव: कक्षा कोठाको वास्तविकता', 'Teacher shortages in the hills', 'विषयगत शिक्षक नहुँदा सिकाइ अधुरो हुन्छ। प्रोत्साहन र आवास योजना चाहिन्छ।', 'Missing subject teachers leave learning incomplete; incentives and housing help.', ['labour-migration'], 'बागलुङ', null, 'नीति औजार', ['दुर्गम भत्ता', 'स्थानीय करार मापदण्ड', 'बहुविषय तालिम'], ['शिक्षक अभाव संख्या मात्र होइन गुणस्तर संकट हो। नागरिक वाच डेस्कले कक्षा अनुभव रेकर्ड गर्छ।', 'महिला शिक्षक सुरक्षा र आवास निर्णायक हुन्छ।', 'प्रविधिले सहयोग गर्न सक्छ तर प्रतिस्थापन होइन।', 'समुदाय अनुगमन रचनात्मक होस्।']),
      mk('digital-classrooms-equity', 'डिजिटल कक्षा: समानता बिना अधुरो', 'Digital classrooms incomplete without equity', 'ल्यापटप वितरण मात्र पर्याप्त होइन। कनेक्टिभिटी, तालिम र सामग्री चाहिन्छ।', 'Devices alone are not enough without connectivity, training and content.', ['data-story'], 'काठमाडौं', 'secondary', 'समानता जाँच', ['बिजुली', 'शिक्षक तालिम', 'अफलाइन सामग्री'], ['डिजिटल शिक्षा सम्भावनाशील छ। नागरिक वाच डेस्क असमान पहुँच चिन्ता गर्छ।', 'ग्रामीण विद्यालय छायामा पर्नु हुँदैन।', 'अभिभावक खर्च बढाउने मोडल दिगो होइन।', 'खुला शैक्षिक स्रोत उपयोगी छन्।']),
      mk('scholarship-access-clarity', 'छात्रवृत्ति पहुँच: जानकारी नै पहिलो सिँढी', 'Scholarship access starts with clear information', 'योग्य विद्यार्थीले अवसर नदेख्ने अवस्था अन्त्य गर्न एकद्वार सूचना चाहिन्छ।', 'A single information window stops eligible students missing opportunities.', ['budget-2083'], 'धनुषा', null, 'सुधार', ['सरल आवेदन', 'समयतालिका', 'सहयोग डेस्क'], ['छात्रवृत्ति समानताको औजार हो। नागरिक वाच डेस्क जटिल प्रक्रियाले बाहिर पार्ने जोखिम देखाउँछ।', 'दलित, महिला र अपाङ्गता कोटा कार्यान्वयन मापनयोग्य होस्।', 'स्कुल स्तरमा अभिमुखीकरण गर्नुपर्छ।', 'ठगी विज्ञापनबारे सतर्कता जरुरी छ।']),
      mk('monsoon-school-closures-plan', 'मनसुन विद्यालय बन्द: सिकाइ निरन्तरता योजना', 'Monsoon school closures need continuity plans', 'बन्द अपरिहार्य हुँदा गृहकार्य प्याक र वैकल्पिक स्थानले क्षति घटाउँछ।', 'When closures are needed, homework packs and alternate sites reduce loss.', ['climate'], 'सिन्धुली', null, 'तयारी सूची', ['सुरक्षा मापदण्ड', 'अभिभावक सूचना', 'पुनःपठन तालिका'], ['वर्षाले विद्यालय प्रभावित पार्छ। नागरिक वाच डेस्क सुरक्षा पहिला राख्छ।', 'हठात बन्द अफवाह रोक्न आधिकारिक सूचना चाहिन्छ।', 'परीक्षा पात्रो लचिलो बनाउनुपर्छ।', 'मध्याह्न भोजन व्यवस्था पनि योजनामा पर्नुपर्छ।']),
    ],
  },
  interview: {
    fn: 'editionInterview',
    items: [
      mk('interview-provincial-planner', 'अन्तर्वार्ता: प्रदेश योजना अधिकृतसँग सेवा प्राथमिकता', 'Interview: a provincial planner on service priorities', 'बजेट होइन, कार्यान्वयन अनुशासनले प्रदेश सफलता देखाउँछ भन्ने उनीहरूको तर्क।', 'They argue implementation discipline, not budgets alone, shows provincial success.', ['exclusive-report'], 'हेटौंडा', 'lead', 'मुख्य अंश', ['प्राथमिकता छनोट', 'नागरिक सुनुवाइ', 'सूचक सार्वजनिक'], ['नागरिक वाच डेस्कले प्रदेश योजना अधिकृतसँग सेवा प्राथमिकताबारे कुराकानी गरेको छ। नाम र विवरण गोपनीयताका लागि सामान्यीकृत छ।', 'उनीहरूका अनुसार वडास्तर डाटा बिना योजना हावामा बन्छ।', 'महिला र युवा सहभागिता बैठकमा देखिनुपर्छ।', 'पारदर्शिताले राजनीतिक दबाब पनि व्यवस्थापन गर्छ।']),
      mk('interview-women-entrepreneur', 'अन्तर्वार्ता: महिला उद्यमीसँग पुँजी र बजार', 'Interview: a woman entrepreneur on capital and markets', 'कर्जा प्रक्रिया सरल भए धेरै महिला व्यवसाय विस्तार गर्न सक्छन्।', 'Simpler credit processes would let more women expand businesses.', ['labour-migration'], 'बुटवल', null, 'उनीहरूको जोड', ['धितो विकल्प', 'बजार लिंक', 'तालिम'], ['नागरिक वाचले साना खाद्य प्रशोधन उद्यम चलाउने महिलासँग अन्तर्वार्ता लिएको छ।', 'परिवार जिम्मेवारी र व्यवसाय समय व्यवस्थापन चुनौती हो।', 'डिजिटल भुक्तानीले ग्राहक आधार बढाएको अनुभव छ।', 'स्थानीय मेला नियमित हुनुपर्ने माग राखियो।']),
      mk('interview-cricket-coach', 'अन्तर्वार्ता: क्रिकेट प्रशिक्षकसँग युवा विकास', 'Interview: a cricket coach on youth development', 'प्रतिभा छनोटमा पारदर्शिता र दीर्घकालीन फिटनेस दुवै चाहिन्छ।', 'Talent selection needs transparency and long-term fitness focus.', ['nepal-cricket'], 'कीर्तिपुर', 'secondary', 'प्रशिक्षक दृष्टिकोण', ['आधारभूत सीप', 'अभिभावक अपेक्षा', 'चोट रोकथाम'], ['नागरिक वाच खेलकुद डेस्कले युवा प्रशिक्षकसँग संवाद गरेको छ।', 'धेरै अभिभावक नतिजा हतार गर्छन्।', 'विद्यालय क्रिकेटले आधार दिन्छ।', 'महिला क्रिकेटमा मैदान पहुँच सुधार्न आग्रह गरियो।']),
      mk('interview-climate-scientist', 'अन्तर्वार्ता: जलवायु वैज्ञानिकसँग हिमाली जोखिम', 'Interview: a climate scientist on Himalayan risk', 'डाटा खुला भए स्थानीय योजना सटीक हुन्छ भन्ने उनीहरूको जोड।', 'They stress open data makes local planning more precise.', ['climate'], 'काठमाडौं', null, 'वैज्ञानिक सन्देश', ['पूर्वसूचना', 'भू-उपयोग', 'समुदाय विज्ञान'], ['नागरिक वाचले जलवायु अनुसन्धानकर्मीसँग हिमाली जोखिमबारे कुराकानी गर्‍यो।', 'ग्लेसियर ताल निगरानी निरन्तर चाहिन्छ।', 'कृषक अनुभवलाई डाटासँग जोड्नुपर्छ।', 'नीति ढिलाइले अनुकूलन खर्च बढाउँछ।']),
      mk('interview-diaspora-organizer', 'अन्तर्वार्ता: प्रवासी संगठकसँग सामूहिक सहयोग', 'Interview: a diaspora organizer on mutual aid', 'संकटमा सूचना र कानुनी सल्लाह नेटवर्कले जीवन जोगाउँछ।', 'Crisis information and legal-advice networks can protect lives.', ['labour-migration'], 'काठमाडौं', null, 'संगठन अभ्यास', ['स्वयंसेवक तालिम', 'पारदर्शी कोष', 'दूतावास समन्वय'], ['नागरिक वाच प्रवास डेस्कले स्वयंसेवी संगठकसँग अन्तर्वार्ता गर्‍यो।', 'नयाँ आएका कामदार अभिमुखीकरण अभाव भोग्छन्।', 'महिला हेल्पडेस्क अलग आवश्यक छ।', 'नेपालमा परिवार परामर्श पनि जोड्नुपर्ने बताइयो।']),
    ],
  },
  'photo-story': {
    fn: 'editionPhotoStory',
    items: [
      mk('photo-monsoon-markets', 'फोटो कथा: मनसुन बजारका अनुहार', 'Photo story: faces of monsoon markets', 'पानीमा पनि खुला पसल। व्यापारी र ग्राहकको दैनिक संघर्ष दृश्यमा।', 'Shops stay open in the rain; traders and customers persist in the frame.', ['climate'], 'काठमाडौं', 'lead', 'दृश्य नोट', ['तारपोल र पानी', 'बिहानको आपूर्ति', 'महिला विक्रेता'], ['नागरिक वाच फोटो डेस्कले मनसुन बजारलाई दैनिक अर्थतन्त्रको चित्रका रूपमा देखायो।', 'छविहरूमा पानीको चमक र थकान दुवै छ।', 'पाठकलाई लाग्न सक्छ यो सामान्य दृश्य हो, तर यो शहरको जीवन रेखा हो।', 'क्याप्सनमा नाम र अनुमति सम्मान गरिएको छ।']),
      mk('photo-highway-repair-crews', 'फोटो कथा: राजमार्ग मर्मत टोली', 'Photo story: highway repair crews', 'पहिरो पछिको सफाइ गर्ने हातहरू। जोखिमबीचको सार्वजनिक सेवा।', 'Hands clearing landslide debris; public service inside risk.', ['climate'], 'धादिङ', null, 'श्रृंखला जोड', ['मेसिन र मजदुर', 'सुरक्षा गियर', 'रातको बत्ती'], ['नागरिक वाचले मर्मत टोलीसँग समय बितायो।', 'छविले पसिना र धुलो देखाउँछ।', 'समुदाय चिया र पानी लिएर आएको दृश्य पनि छ।', 'यो कथा श्रमिक सम्मानको हो।']),
      mk('photo-kathmandu-dawn', 'फोटो कथा: काठमाडौं बिहान', 'Photo story: Kathmandu at dawn', 'मन्दिरदेखि बसपार्कसम्म शहर बिउँझिने क्षण।', 'From temples to bus parks, the city waking.', [], 'काठमाडौं', 'secondary', 'समय रेखांकन', ['चिया पसल', 'अखबार पाठक', 'विद्यालय जाने बच्चा'], ['बिहानको प्रकाश शहरको अर्को अनुहार हो। नागरिक वाच फोटो कथा शान्त तर व्यस्त लय देखाउँछ।', 'प्रदूषण र सुन्दरता सँगै छन्।', 'पाठक आफ्नै सहर चिन्हन्।', 'कुनै नाटकीय अतिरञ्जना छैन।']),
      mk('photo-tea-garden-workers', 'फोटो कथा: चिया बगानका कामदार', 'Photo story: tea garden workers', 'पात टिप्ने हात र पहाडी मौसम। श्रमको दृश्य कथा।', 'Hands picking leaves in hill weather; a labour visual story.', ['labour-migration'], 'इलाम', null, 'दृश्य तत्व', ['टोकरी', 'हिम/कुहिरो', 'सामुदायिक बास'], ['नागरिक वाच डेस्कले बगान श्रमलाई नजिकबाट कैद गर्‍यो।', 'महिला कामदारको केन्द्रीयता देखिन्छ।', 'ज्याला र मौसम दुवै चुनौती हुन्।', 'कथा उपभोग मात्र होइन सम्मान माग्छ।']),
      mk('photo-river-erosion-communities', 'फोटो कथा: नदी कटानले छोएका बस्ती', 'Photo story: communities edged by river erosion', 'घरको आँगन साँघुरिँदै गएको दृश्य। विपद्अघिको चेतावनी।', 'Yards shrinking toward the river; a warning before disaster.', ['climate'], 'बारा', null, 'फ्रेममा जोखिम', ['बालुवा थुप्रो', 'स्थानान्तरण छलफल', 'बालबालिका खेल'], ['नदी कटान धीमा विपद् हो। नागरिक वाच फोटोले समयको असर देखाउँछ।', 'मानिस अझै आशा राखेर बसेका छन्।', 'नीति ढिलाइ दृश्यमै देखिन्छ।', 'यो कथा पूर्वतयारीको अपील हो।']),
    ],
  },
  video: {
    fn: 'editionVideo',
    items: [
      mk('video-desk-how-we-work', 'भिडियो डेस्क कसरी काम गर्छ: नागरिक वाच भित्र', 'How the Nagarik Watch video desk works', 'फिल्ड शटदेखि सम्पादनसम्मको प्रक्रिया। पारदर्शिता नै विश्वास।', 'From field shots to edit: transparency builds trust.', ['exclusive-report'], 'काठमाडौं', 'lead', 'प्रक्रिया चरण', ['पाइच', 'फिल्ड सुरक्षा', 'सम्पादन जाँच'], ['नागरिक वाच भिडियो डेस्कले आफ्नो कार्यशैली पाठकसामु खुलाएको छ।', 'हतारमा गलत दृश्य नआओस् भनेर दोहोरो जाँच हुन्छ।', 'सहमति बिना नजिकको अनुहार नदेखाउने नीति छ।', 'मोबाइल पनि क्यामेरा हो, जिम्मेवारी उस्तै हो।']),
      mk('live-blog-vs-video-explainers', 'लाइभ ब्लग र भिडियो व्याख्या: कहिले कुन?', 'Live blogs vs video explainers: when to use which', 'तत्काल अद्यावधिक ब्लगमा, बुझाइ भिडियोमा बलियो हुन्छ।', 'Use blogs for rapid updates and video for clearer explanation.', [], 'काठमाडौं', null, 'सम्पादकीय छनोट', ['इन्टरनेट लागत', 'दृश्य आवश्यकता', 'सच्याइ सजिलो'], ['नागरिक वाच डेस्क ढाँचा छनोटलाई पाठक हितमा जोड्छ।', 'मनसुन अलर्टमा छोटो भिडियो उपयोगी हुन्छ।', 'लाइभ ब्लगले समयरेखा दिन्छ।', 'दुवैमा स्रोत स्पष्टता अनिवार्य छ।']),
      mk('monsoon-alert-on-camera', 'क्यामेरामा मनसुन सतर्कता: देखिने चेतावनी', 'Monsoon alerts on camera: visible warnings', 'नक्सा र सरल भाषा भिडियोले जोखिम बुझाउन सघाउँछ।', 'Maps and plain language on video help people grasp risk.', ['climate'], 'काठमाडौं', 'secondary', 'उत्पादन सुझाव', ['ठूलो फन्ट', 'स्थानीय उदाहरण', 'कल टु एक्शन'], ['नागरिक वाचले मौसम सतर्कता भिडियोलाई सेवा मान्छ।', 'डर फैलाउने संगीत प्रयोग हुँदैन।', 'उपशीर्षक नेपालीमा हुन्छ।', 'पुनःप्रसारण समय तोकिएको हुन्छ।']),
      mk('short-form-news-ethics', 'छोटो भिडियो समाचार नैतिकता', 'Ethics for short-form news video', 'क्लिप भाइरल हुँदैमा सन्दर्भ काट्नु हुँदैन।', 'Virality does not justify cutting away context.', ['editor-pick'], 'काठमाडौं', null, 'लाल रेखा', ['हिंसा ग्लोरिफाइ नगर्ने', 'बालबालिका पहिचान'], ['छोटो ढाँचाले ध्यान तान्छ। नागरिक वाच डेस्क सन्दर्भ जोगाउने वचनबद्ध छ।', 'सच्याइ नोट पिन गरिन्छ।', 'थम्बनेल भ्रामक नहोस्।', 'टिम तालिम नियमित छ।']),
      mk('archive-digitization-video', 'भिडियो अभिलेख डिजिटाइजेसन: स्मृति जोगाउने काम', 'Digitizing the video archive to keep memory', 'पुराना टेप र फाइल व्यवस्थित भए इतिहास खोज्न सकिन्छ।', 'Ordered tapes and files make history searchable.', ['data-story'], 'काठमाडौं', null, 'अभिलेख प्राथमिकता', ['मेटाडेटा', 'ब्याकअप', 'सार्वजनिक पहुँच तह'], ['नागरिक वाचले आफ्नो भिडियो स्मृति व्यवस्थित गर्दैछ।', 'यसले तथ्य जाँचमा पनि सहयोग गर्छ।', 'कपीराइट र अनुमति ध्यानमा छ।', 'पाठक विशेष कथा श्रृंखला आउनेछ।']),
    ],
  },
  diaspora: {
    fn: 'editionDiaspora',
    items: [
      mk('gulf-labour-rights-briefing', 'खाडी श्रम अधिकार ब्रिफिङ: जान्नुपर्ने आधार', 'Gulf labour rights briefing: basics to know', 'करार, पासपोर्ट नियन्त्रण र उजुरी मार्गबारे स्पष्ट जानकारी जीवनरक्षा हो।', 'Clear knowledge of contracts, passport control and complaint routes is life protection.', ['labour-migration'], 'काठमाडौं', 'lead', 'जानकारी सूची', ['कानुनी करार', 'बीमा', 'हेल्पलाइन'], ['नागरिक वाच प्रवास डेस्कले कामदार परिवारका लागि आधारभूत अधिकार सार तयार पारेको छ।', 'दलाल प्रलोभनबाट बच्ने उपाय समेटिएको छ।', 'महिला कामदारका लागि थप सावधानी छन्।', 'नेपाल फर्किएपछि सीप उपयोग योजना पनि चाहिन्छ।']),
      mk('japan-trainee-workers-path', 'जापान तालिम कामदार मार्ग: अपेक्षा र वास्तविकता', 'Japan trainee worker path: expectations vs reality', 'भाषा र सीप तयारीबिना जाने बाटो जोखिमपूर्ण हुन्छ।', 'Leaving without language and skills prep is risky.', ['labour-migration'], 'काठमाडौं', null, 'तयारी कदम', ['भाषा कक्षा', 'करार बुझाइ', 'पारिवारिक योजना'], ['नागरिक वाच डेस्कले तालिम मार्गबारे भ्रम तोड्ने प्रयास गरेको छ।', 'शुल्क पारदर्शिता अनिवार्य छ।', 'कार्यस्थल दुर्घटना बीमा बुझ्नुपर्छ।', 'फिर्तापछि रोजगारी योजना सुरुमै बनाउनुहोस्।']),
      mk('remittance-family-budgets', 'विप्रेषण र पारिवारिक बजेट: दीगो व्यवस्था', 'Remittance and family budgets for sustainability', 'आम्दानी अनिश्चित हुँदा खर्च प्राथमिकता र बचत नियम चाहिन्छ।', 'When income is uncertain, spending priorities and saving rules matter.', ['data-story'], 'मोरङ', 'secondary', 'बजेट सुझाव', ['आकस्मिक कोष', 'ऋण सावधानी', 'शिक्षा लगानी'], ['विप्रेषणले घर चल्छ तर योजनाबिना सकिन्छ। नागरिक वाच डेस्क व्यवहारिक बजेट कुराकानी गर्छ।', 'देखाउने खर्चले दबाब बढाउँछ।', 'महिला निर्णायक भूमिकामा हुँदा बचत बलियो हुने उदाहरण छन्।', 'वित्तीय साक्षरता कक्षा गाउँमै पुर्‍याउनुपर्छ।']),
      mk('student-visa-preparation-checklist', 'विद्यार्थी भिसा तयारी चेकलिस्ट', 'Student visa preparation checklist', 'कागजात, खर्च योजना र मानसिक तयारी तीनै चाहिन्छ।', 'Documents, cost plans and mental preparation all matter.', ['labour-migration'], 'काठमाडौं', null, 'चेकलिस्ट', ['आधिकारिक स्रोत', 'छात्रवृत्ति खोज', 'ठगी कन्सल्टेन्सीबाट बच्ने'], ['विदेश अध्ययन सपना हो। नागरिक वाच डेस्क ठगी जोखिमबारे सतर्क गराउँछ।', 'भाषा तयारीले सफलता बढाउँछ।', 'पारिवारिक ऋणको दबाब खुला छलफल हुनुपर्छ।', 'फर्केर योगदान गर्ने योजना पनि सोचनीय छ।']),
      mk('cultural-associations-abroad', 'प्रवासी साँस्कृतिक संघ: पहिचान र सहयोग', 'Cultural associations abroad: identity and mutual aid', 'चाडपर्व मात्र होइन, संकट सहयोग र नयाँ आएका सदस्य अभिमुखीकरण पनि संघको काम हो।', 'Beyond festivals, associations orient newcomers and help in crises.', ['editor-pick'], 'काठमाडौं', null, 'राम्रो अभ्यास', ['पारदर्शी लेखा', 'युवा समावेश', 'महिला समिति'], ['साँस्कृतिक संघ प्रवासको घरजस्तो हुन्छ। नागरिक वाच डेस्कले सुशासन अभ्यास साझा गर्छ।', 'राजनीतिक विभाजनले सहयोग कमजोर पार्न सक्छ।', 'नेपाली भाषा कक्षा बालबालिकाका लागि उपयोगी छ।', 'नेपालसँग ज्ञान आदानप्रदान सम्भावना छ।']),
    ],
  },
})

let total = 0
for (const [cat, conf] of Object.entries(all)) {
  writeFileSync(path.join(root, `${cat}.ts`), fileFor(cat, conf.fn, conf.items), 'utf8')
  total += conf.items.length
  console.log('wrote', cat, conf.items.length)
}
console.log('total articles in generated files:', total)
