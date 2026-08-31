/**
 * विपद् विशेष coverage — flood & calamity stories added ३१ अगस्ट २०२६.
 *
 * Based on the real 26 August 2026 Bhote Koshi glacial flash flood
 * (Rasuwa–Gyirong border) and the 2026 monsoon disaster season.
 * Two analytical pieces are marked premium=true to exercise the metered paywall.
 */
import type { Story } from './data'

export const floodStories: Story[] = [
  {
    slug: 'bhote-koshi-glacial-flood-death-toll-2083',
    desk: 'disaster',
    titleNe: 'भोटेकोशी बाढी: मृत्यु ४६९ पुग्यो, १५०० बेपत्ता',
    titleEn: 'Bhote Koshi flood: death toll climbs to 469, about 1,500 missing',
    deckNe:
      'हिमनदीबाट आएको भनिने बिहानको अचानक बाढीले रसुवागढी नाका र भोटेकोशी किनारका बस्ती सखाप पार्यो। उद्धार जारी छ, आँकडा परिवर्तनशील छ।',
    deckEn:
      'A glacial flash flood destroyed the Rasuwagadhi checkpoint and settlements along the Bhote Koshi. Rescue continues and figures are still changing.',
    bodyNe: [
      {
        k: 'p',
        text: 'रसुवा — अगस्ट २६ का बिहान भोटेकोशी नदीमा आएको अचानक ठूलो बाढीको विनाशकारी असर दिनानुदिन खुल्दै गएको छ। नेपाल प्रहरीको शुक्रबार बिहानको ताजा विवरणअनुसार यस घटनामा मृत्यु हुनेको सङ्ख्या ४६९ पुगेको छ भने करिब १,५०० जना अझै बेपत्ता छन्। छिमेकी तिब्बत क्षेत्रमा पनि ठूलो क्षति भएको छ।',
      },
      {
        k: 'p',
        text: 'बाढीको स्रोत जिलुङ क्षेत्रनजिकको हिमनदीसँग जोडिएको छ भन्ने प्रारम्भिक निष्कर्ष विज्ञहरूले टुङ्गाएका छन्। हिमपहिरो र पानीको सङ्कलनले नदीको बहाव अचानक बढ्दा तल्लो तर्फका बस्तीले पल भरमै समय पाएनन्। सीमानाको सीसीटीभी फुटेजमा मानिसहरू दौडेर उकालो तर्फ भागेका देखिन्छन् — त्यो दृश्यले घटनाको भयावहता झल्काउँछ।',
      },
      { k: 'h2', text: 'के नष्ट भयो' },
      {
        k: 'p',
        text: 'रसुवागढी सीमा नाका, कस्टम कार्यालय, भन्सार भवन र नाकासँग जोडिएका सयौं कन्टेनर र भवनहरू पानीले बगायो। भोटेकोशी किनारका स्याफ्रु, गोला र तत्कालै किनार पर्ने बस्तीका घर, पुल, बाटो र विद्युत् प्रसारण लाइन ठूलो क्षतिमा परे। सिमेन्ट र यातायात कम्पनीका कर्मचारी बस्ने शिविर पनि सखाप भएको छ।',
      },
      {
        k: 'p',
        text: 'रसुवागढी नाकामा कार्यरत १८ जना — जसमा तीन जना प्रहरी कर्मचारी र छ जना चिनियाँ नागरिक रहेका थिए — बेपत्ता छन्। नाका क्षेत्रबाट उद्धार भएकाहरूले भनेका छन्, पानी आउनुअघि केही मिनेट मात्र चेतावनीको समय थियो।',
      },
      { k: 'h2', text: 'उद्धारको अवस्था' },
      {
        k: 'p',
        text: 'नेपाली सेना र सशस्त्र प्रहरीका टोली हेलिकप्टर र जमिनमार्फत खोज गरिरहेका छन्। भन्सार प्रहरी, स्थानीय स्वयंसेवक र चिनियाँ पक्षका टोली पनि संयुक्त रूपमा कार्यरत छन्। नदीको बहाव घटेपछि तल्लो किनारमा खोज विस्तार गरिएको छ, तर बगेका भवन र मलमस्याँचोले खोज कार्य जटिल बनाएको छ।',
      },
      {
        k: 'p',
        text: 'घाइतेहरूलाई धुन्चे र त्रिशुली अस्पतालमा उपचार दिइँदै छ। गम्भीर घाइतेहरू काठमाडौं ल्याइएका छन्। विस्थापितहरू स्थानीय विद्यालय र सामुदायिक भवनमा आश्रय लिएर बसेका छन्।',
      },
      { k: 'h2', text: 'किन यो घटना फरक छ' },
      {
        k: 'p',
        text: 'मनसुनको सामान्य बाढी वर्षासँगै आउँछ र पूर्वाचेतनी समय दिन्छ। तर हिमनदीसँग जोडिएको बाढी अचानक आउँछ — दिनको उज्यालोमा, वर्षा नभएको समयमा पनि। जलवायु विज्ञहरू लामो समयदेखि यस्तो "आकस्मिक बाढी"को जोखिम नेपालका हिमाली नदी क्षेत्रमा बढ्दै गएको चेतावनी दिँदै आएका थिए।',
      },
      {
        k: 'quote',
        text: 'पानी आउनुअघि जति सोचेको थिएँ, त्योभन्दा दश गुणा छिटो र ठूलो थियो। — उद्धार भएका एक स्थानीय',
      },
      {
        k: 'p',
        text: 'नागरिक वाच विपद् डेस्कले यो घटनाको प्रत्येक विकास, आधिकारिक आँकडा र स्रोतसहित अद्यावधिक गर्नेछ। परिवारका सदस्य बेपत्ता भएकाहरूले नजिकको प्रहरी इकाइ वा हाम्रो सम्पादकीय टोलीसम्पर्क गर्न सक्नुहुन्छ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'The death toll from the flash flood that tore down the Bhote Koshi on the morning of 26 August has climbed to 469, Nepal Police said on Friday, with about 1,500 people still missing across Nepal and the neighbouring Tibet region.',
      },
      {
        k: 'p',
        text: 'Early assessments link the flood to a glacial collapse near Gyirong County. The surge gave downstream settlements almost no warning; CCTV footage from the border post shows people sprinting uphill seconds before the water arrived.',
      },
      {
        k: 'p',
        text: 'The Rasuwagadhi checkpoint, customs offices and hundreds of containers were swept away. Eighteen people including three police personnel and six Chinese nationals remain unaccounted for at the border point alone.',
      },
      {
        k: 'p',
        text: 'Nepal Army and Armed Police teams are searching by air and on foot. Injured survivors are being treated in Dhunche, Trishuli and Kathmandu hospitals; displaced families are sheltering in schools and community buildings.',
      },
      {
        k: 'p',
        text: 'Unlike monsoon floods, glacial outbursts strike suddenly — even on clear mornings with no rain in the catchment. Climatologists have long warned that this risk is rising across Nepal high Himalayan river basins.',
      },
    ],
    publishedAt: '2026-08-31T07:30:00.000Z',
    readingMinutes: 4,
    featured: 'lead',
    location: 'रसुवा',
    province: 'bagmati',
    hero: '/photos/disaster/flood-river-1.jpg',
    heroCaption: 'भोटेकोशी क्षेत्रमा बाढीले ल्याएको विनाश — नदी किनारका बस्ती र संरचना बगे।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['बाढी', 'भोटेकोशी', 'रसुवा', 'विपद्', 'उद्धार'],
    author: 'विपद् डेस्क',
    premium: true,
  },
  {
    slug: 'rasuwagadhi-checkpoint-destroyed-border-trade-2083',
    desk: 'disaster',
    titleNe: 'रसुवागढी नाका सखाप: सीमा व्यापार ठप्प, १८ जना बेपत्ता',
    titleEn: 'Rasuwagadhi checkpoint destroyed: border trade halted, 18 missing',
    deckNe:
      'चीनसँगको दोस्रो ठूलो व्यापार नाका पूर्ण रूपमा बन्द भएको छ। नाकामा कार्यरत १८ जना — तीन प्रहरी र छ चिनियाँ नागरिकसहित — बेपत्ता छन्।',
    deckEn:
      'The second-largest China trade route is fully closed; eighteen people including three police personnel and six Chinese nationals are missing at the post.',
    bodyNe: [
      {
        k: 'p',
        text: 'रसुवा — २६ अगस्टको बाढीले रसुवागढी सीमा नाका क्षेत्रलाई पूर्ण रूपमा सखाप पारेको छ। कस्टम कार्यालय, भन्सार प्रहरी चौकी, बैंक शाखा, गोदाम र सयौं कन्टेनर पानीमा बगेका छन्। नाका क्षेत्रमा कार्यरत १८ जना बेपत्ता छन्, जसमा तीन जना प्रहरी कर्मचारी र छ जना चिनियाँ नागरिक छन्।',
      },
      {
        k: 'p',
        text: 'यो नाका चीनसँगको व्यापारको तत्कालैको दोस्रो ठूलो मार्ग हो। काठमाडौं–केरुङ रेलमार्ग निर्माणसँगै यसको महत्त्व अझ बढेको थियो। दैनिक रूपमा सयौं ट्रक यहाँबाट ओहोरदोहोर गर्थे; अहिले मार्गै छिनिएको छ।',
      },
      { k: 'h2', text: 'व्यापारमा के असर' },
      {
        k: 'p',
        text: 'नाका बन्द भएपछि आयात–निर्यात दुवै ठप्प छ। किरातनका सामान, निर्माण सामग्री र फलफूलका ट्रकहरू बाटोमै अड्किएका छन्। व्यापारीहरूले ढिलाइ भए जस्तो खाल्डो फराकिलो हुने भने पनि, कन्टेनर र भवन बगेपछि पुनर्स्थापना महिनौं लिने अनुमान छ।',
      },
      {
        k: 'p',
        text: 'बिमा दावी, भन्सार दर्ता र कागजात गुमाएका व्यापारीहरूको समस्या छुट्टै छ। सरकारले नाका पुनर्स्थापनाका लागि छिमेकी पक्षसँग संयुक्त प्राविधिक टोली बनाउने प्रक्रिया सुरु गरेको छ।',
      },
      { k: 'h2', text: 'उद्धार र सावधानी' },
      {
        k: 'p',
        text: 'नाका क्षेत्रको जमिन कमजोर भएकाले थप पहिरोको जोखिम छ। सुरक्षा निकायले अनावश्यक आवागमन रोकेका छन् र बाँचेका संरचनाहरू खारेज गर्ने प्रक्रिया चलाएका छन्। दुई देशका टोलीहरू नदी दुवै किनारमा खोजमा जुटेका छन्।',
      },
      {
        k: 'p',
        text: 'नागरिक वाचले नाका पुनर्स्थापना, व्यापार पुनःसुरु र बेपत्ता खोजको अवस्था निरन्तर अनुगमन गर्नेछ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'The 26 August flood completely destroyed the Rasuwagadhi border checkpoint: customs offices, the armed police post, bank branches, warehouses and hundreds of containers were swept away. Eighteen people remain missing, including three police personnel and six Chinese nationals.',
      },
      {
        k: 'p',
        text: 'The post is the second most important overland trade route with China. With the road itself severed, hundreds of trucks are stranded, and traders expect restoration to take months.',
      },
      {
        k: 'p',
        text: 'Both countries have begun joint technical assessments. Authorities have closed the area to unnecessary movement because weakened slopes carry further landslide risk.',
      },
    ],
    publishedAt: '2026-08-30T06:20:00.000Z',
    readingMinutes: 3,
    featured: 'secondary',
    location: 'रसुवा',
    province: 'bagmati',
    hero: '/photos/disaster/flood-checkpoint-3.jpg',
    heroCaption: 'रसुवागढी नाका क्षेत्र — बाढीपछि कन्टेनर र संरचनाको अवस्था।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['रसुवागढी', 'सीमा व्यापार', 'बाढी', 'नाका'],
    author: 'अर्थ/विपद् डेस्क',
  },
  {
    slug: 'children-impacted-flood-rasuwa-nuwakot-dhading-2083',
    desk: 'disaster',
    titleNe: 'रसुवा, नुवाकोट, धादिङमा १७ हजार बालबालिका प्रभावित',
    titleEn: 'At least 17,000 children impacted in Rasuwa, Nuwakot and Dhading',
    deckNe:
      'युनिसेफको ताजा आँकडाअनुसार तीन जिल्लाका हजारौं बालबालिका घर, विद्यालय र आफन्तबाट विच्छेदमा परेका छन्।',
    deckEn:
      'UNICEF says thousands of children across three districts have lost homes, schools and caregivers in the flash floods.',
    bodyNe: [
      {
        k: 'p',
        text: 'काठमाडौं — २६ अगस्टको बाढी पीडित क्षेत्रमा कम्तीमा १७ हजार बालबालिका प्रत्यक्ष प्रभावित भएको युनिसेफले जनाएको छ। रसुवा, नुवाकोट र धादिङ जिल्लाका यी बालबालिका घर गुमाउनुका साथै विद्यालय बन्द, पोषणको अभाव र मानसिक आघातसँग जुधिरहेका छन्।',
      },
      {
        k: 'p',
        text: 'आश्रय शिविरहरूमा साना बालबालिकाका लागि सुरक्षित खेलकुद र सिकाइको ठाउँ छैन। आमाहरूले शिविरमा दूध र स्वस्थ खानेकुराको अभावको गुनासो गरेका छन्। भूकम्पपछिका अनुभवबाट विपद् बालबालिकामा पार्ने दीर्घकालीन मानसिक असर स्पष्ट छ — त्यसैले मनोसामाजिक परामर्श तुरुन्तै चाहिन्छ।',
      },
      { k: 'h2', text: 'विद्यालय र शिक्षा' },
      {
        k: 'p',
        text: 'प्रभावित जिल्लाका दर्जनौं विद्यालय भत्किए वा विस्थापितहरूको आश्रय बनेका छन्। भद्र वर्षाको मौसममा विद्यालय सञ्चालन गर्नु आफैं चुनौती हो; अब सामग्री र कक्षाकोठा दुवैको हाहाकार छ। शिक्षा अधिकारीहरूले अस्थायी सिकाइ केन्द्र र "विद्यालय सामग्री किट" वितरणको तयारी गरेका छन्।',
      },
      {
        k: 'p',
        text: 'युनिसेफ र स्थानीय सरकारले आश्रय शिविरमा बालमैत्री कुना, सफा पानी र पोषण पर्यवेक्षण सुरु गर्ने भनेका छन्। नागरिक वाचले शिविरका बालबालिकाको अवस्था स्थलगत रिपोर्टिङमार्फत निरन्तर उठाउनेछ।',
      },
      { k: 'quote', text: 'बालबालिका विपद् पछाडि पनि धेरै लामो समयसम्म प्रभावित रहन्छन् — घर जति नै बने पनि डर बसिरहन्छ।' },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'At least 17,000 children have been directly impacted by the flash floods in Rasuwa, Nuwakot and Dhading districts, UNICEF reports — losing homes, schools and, in some cases, caregivers.',
      },
      {
        k: 'p',
        text: 'Dozens of schools are damaged or serving as shelters. Aid agencies are setting up child-friendly spaces, clean water and nutrition monitoring in displacement camps, while education offices prepare temporary learning centres.',
      },
    ],
    publishedAt: '2026-08-29T05:40:00.000Z',
    readingMinutes: 3,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/shelter-children-2.jpg',
    heroCaption: 'विस्थापित परिवारको अस्थायी शिविर — बालबालिकाहरू आश्रयमा।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['बालबालिका', 'युनिसेफ', 'विस्थापित', 'बाढी'],
    author: 'विपद् डेस्क',
  },
  {
    slug: 'monsoon-disaster-season-7500-events-35-districts-2083',
    desk: 'disaster',
    titleNe: 'यस वर्षायाममा ७,५०० विपद् घटना: ३५ जिल्लाका ७५ हजार परिवार प्रभावित',
    titleEn: 'This monsoon: about 7,500 disaster incidents, 75,000 families hit across 35 districts',
    deckNe:
      'भोटेकोशी बाढी जोडिएको वर्षायाममा बाढी, पहिरो र डुबानले मुलुकभर ठूलो मानवीय तथा भौतिक क्षति गरेको छ — क्षति अनुमान १७ अर्बभन्दा माथि।',
    deckEn:
      'Beyond the Bhote Koshi flood, this monsoon season has brought about 7,500 disaster events; damage estimates exceed NPR 17 billion.',
    bodyNe: [
      {
        k: 'p',
        text: 'काठमाडौं — राष्ट्रिय विपद् व्यवस्थापन प्राधिकरण (निड्र्मा)का स्थिति प्रतिवेदनअनुसार यस वर्षायाममा मुलुकभर करिब ७,५०० विपद् घटना घटेका छन्। बाढी, पहिरो, डुबान र कापो ढल्काइका यी घटनाले ३५ जिल्लाका ७५ हजारभन्दा बढी परिवार प्रभावित बनाएका छन् र १८ हजारभन्दा बढी परिवार विस्थापित भएका छन्।',
      },
      {
        k: 'p',
        text: 'भौतिक क्षतिको अनुमान १७ अर्ब रुपैयाँभन्दा माथि पुगेको छ, जसमा खानेपानी संरचनामा करिब ३.५५ अर्ब र सडक पूर्वाधारमा २.५२ अर्ब रुपैयाँको क्षति पर्ने अनुमान छ। सिँचाइ, विद्युत् र स्थानीय पूर्वाधारमा समेत ठूलो नोक्सानी भएको छ।',
      },
      { k: 'h2', text: 'सबैभन्दा प्रभावित क्षेत्र' },
      {
        k: 'p',
        text: 'बागमती प्रदेशका विपद् संवेदनशील जिल्ला — रसुवा, नुवाकोट, धादिङ, सिन्धुपाल्चोक — लगातार वर्षौंदेखि विपद् चपेटामा पर्दै आएका छन्। यस सिजनमा एक सातामै १३० भन्दा बढी ठूला पहिरोका घटना भएको तथ्याङ्कले जोखिमको स्तर देखाउँछ। मुलुकका ३७१ सडक खण्डमध्ये बाढी–पहिरोका कारण ९ वटा अवरुद्ध हुँदा आपूर्ति व्यवस्था थप प्रभावित भयो।',
      },
      {
        k: 'p',
        text: 'राष्ट्रियसभामा दर्ता प्रस्तावअनुसार गत वर्षको असोजको बाढी–पहिरोको अनुभव सम्झँदै विपद् व्यवस्थापनमा संरचनागत सुधारको माग उठेको छ। संसदीय छलफलमा पूर्व चेतावनी प्रणाली, बस्ती स्थानान्तरण र बजेट प्राथमिकीकरणमा ढिलाइ नगर्न जोड दिइएको छ।',
      },
      { k: 'h2', text: 'अब के हेर्ने' },
      {
        k: 'p',
        text: 'मनसुन अझ केही साता रहने अनुमान छ; मौसम विज्ञान महाशाखाले थप वर्षाका बीचमा बाढी/पहिरोको जोखिम कायम रहने जनाएको छ। नागरिक वाच विपद् डेस्कले जिल्लास्तरीय तथ्याङ्क, राहत वितरण र पुनर्स्थापना प्रगतिको नियमित लेखा जाँच गर्नेछ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'National Disaster Risk Reduction and Management Authority situation reports count roughly 7,500 disaster incidents this monsoon — floods, landslides and inundation affecting more than 75,000 families across 35 districts, with over 18,000 families displaced.',
      },
      {
        k: 'p',
        text: 'Physical damage is estimated above NPR 17 billion, including about NPR 3.55 billion to drinking-water schemes and NPR 2.52 billion to roads. In one week alone, more than 130 major landslide events were recorded.',
      },
      {
        k: 'p',
        text: 'Parliamentary discussions are echoing last year experience with demands for structural reform: early warning systems, settlement relocation and prioritised reconstruction budgets.',
      },
    ],
    publishedAt: '2026-08-31T04:10:00.000Z',
    readingMinutes: 4,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/landslide-road-1.jpg',
    heroCaption: 'पहिरोले अवरुद्ध सडक — वर्षायाममा सयौं खण्ड बन्द हुने गरेका छन्।',
    heroCredit: 'साभार: रयुटर्स',
    tags: ['मनसुन', 'तथ्याङ्क', 'निड्र्मा', 'क्षति', 'पहिरो'],
    author: 'विपद् डेस्क',
  },
]

const floodStoriesPart2: Story[] = [
  {
    slug: 'flood-rescue-relief-operation-army-intl-2083',
    desk: 'disaster',
    titleNe: 'उद्धार र राहत: सेनाको खोज जारी, अन्तर्राष्ट्रिय संस्था शिविरमा',
    titleEn: 'Rescue and relief: army search continues as international agencies reach the camps',
    deckNe:
      'हेलिकप्टर उद्धार, चिकित्सा टोली र खानेपानी वितरण सुरु भएको छ। केयर, डाइरेक्ट रिलिफ र कन्भोई अफ होप क्षेत्रमा सक्रिय छन्।',
    deckEn:
      'Helicopter evacuations, medical teams and water distribution are underway; CARE, Direct Relief and Convoy of Hope are active on the ground.',
    bodyNe: [
      {
        k: 'p',
        text: 'रसुवा/काठमाडौं — भोटेकोशी बाढीका बेपत्ता खोज्ने कार्य तीव्र बनाइएको छ। नेपाली सेनाका हेलिकप्टरले अड्किएका र घाइते व्यक्तिहरू सुरक्षित स्थानमा सारिरहेका छन्। सशस्त्र प्रहरीका डुङ्गा र रस्सी टोलीले खोला किनारका भग्नावशेष खोतलिरहेका छन्।',
      },
      {
        k: 'p',
        text: 'अन्तर्राष्ट्रिय राहत संस्थाहरू विस्थापित शिविरमा पुगिसकेका छन्। केयर नेपालले आश्रय सामग्री र महिला-बालमैत्री सेवा; डाइरेक्ट रिलिफले चिकित्सा टोली र औषधि; कन्भोई अफ होपले खानेकुरा र शुद्ध पानी वितरण गर्दैछ। युनिसेफ बालबालिका संरक्षण र शिक्षा पक्षमा केन्द्रित छ।',
      },
      { k: 'h2', text: 'शिविरमा जरुरी आवश्यकता' },
      {
        k: 'p',
        text: 'स्थानीय सरकारका अनुसार हालका तत्कालीन आवश्यकतामा शुद्ध खानेपानी, गर्म खाना, सरसफाइका सामग्री, स्वास्थ्य परीक्षण र सिङ्गो परिवार नभएका बालबालिकाको अनुगमन पर्छन्। चिसो रातका कारण ओछ्यान र गरम लुगाको पनि खाँचो छ।',
      },
      {
        k: 'p',
        text: 'राहत वितरणमा पारदर्शिता कायम राख्न स्थानीय तहले वितरण विवरण सार्वजनिक गर्न थालेका छन्। नागरिक वाचले सामग्री कहाँ, कसलाई, कति पुग्यो भन्ने लेखा निरन्तर सार्वजनिक गर्नेछ — राहतमा लापरवाही भए त्यो पनि उठाउनेछ।',
      },
      {
        k: 'quote',
        text: 'खोज टोली नदी छाड्दैनन्, तपाईंहरूले पनि आशा नछाड्नुहोस्। — उद्धार टोलीका एक सदस्य',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Search operations have intensified: Nepal Army helicopters continue evacuations while Armed Police boat and rope teams comb the riverbanks. International relief agencies — CARE, Direct Relief, Convoy of Hope and UNICEF — are now active in displacement camps.',
      },
      {
        k: 'p',
        text: 'Immediate needs identified by local governments include clean water, hot meals, sanitation supplies, health screening and follow-up for unaccompanied children, plus bedding against cold nights.',
      },
    ],
    publishedAt: '2026-08-28T06:00:00.000Z',
    readingMinutes: 3,
    featured: 'none',
    location: 'रसुवा',
    province: 'bagmati',
    hero: '/photos/disaster/rescue-army-1.jpg',
    heroCaption: 'उद्धार कार्यमा खटिएका सुरक्षा बलका टोली।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['उद्धार', 'राहत', 'सेना', 'अन्तर्राष्ट्रिय सहयोग'],
    author: 'विपद् डेस्क',
  },
  {
    slug: 'glacial-lake-outburst-risk-climate-explainer-2083',
    desk: 'disaster',
    titleNe: 'हिमनदी जोखिम किन बढिरहेको छ: भोटेकोशी घटनाले उघारेका प्रश्न',
    titleEn: 'Why glacial risk keeps rising: the questions the Bhote Koshi event has opened',
    deckNe:
      'जलवायु परिवर्तनले हिमाली जलचक्र फेरिँदै गर्दा "आकस्मिक बाढी" सामान्य मनसुन बाढीभन्दा फरक खतरा बन्दै गएको छ। यो विश्लेषणले कारण, जोखिम नक्सा र समाधानका उपाय छर्पिएको छ।',
    deckEn:
      'Climate change is rewriting the high Himalayan water cycle. An analysis of why sudden glacial floods are becoming a distinct threat class — and what can be done.',
    bodyNe: [
      {
        k: 'p',
        text: 'मनसुनको बाढी वर्षाको पानीसँग जोडिन्छ; पूर्वाचेतनी दिन सकिन्छ। तर २६ अगस्टको जस्तो घटना फरक थियो — वर्षा नभएको बिहान, नदीको माथिल्लो भागमा हिमनदीसँग जोडिएको प्रक्रियाबाट अचानक ठूलो पानी झुण्डियो। यसलाई विज्ञहरू जोखिमको छुट्टै वर्गका रूपमा लिन्छन्।',
      },
      { k: 'h2', text: 'के हुन्छ, किन हुन्छ' },
      {
        k: 'p',
        text: 'हिमाली क्षेत्रमा हिमताल र हिमनदीको पानी बरफको बाँधले थुनिएको हुन्छ। तापक्रम बढ्दा बरफ पग्लन्छ, ताल फुक्छ र बाँध नाजुक हुँदै जान्छ। छिटो पग्लने प्रक्रियाले ठूलो हिमपहिरो झरेर ताल चुँडाउन पनि सक्छ। जुनै मार्गबाट होस्, तल बसेका बस्तीले पाउने समय मिनेटमै नापिन्छ।',
      },
      {
        k: 'p',
        text: 'नेपालका भोटेकोशी, सङ्कोशी, कालीगण्डकी र तामाकोशीजस्ता नदीहरू यस्तो जोखिमको उच्च क्षेत्रमा पर्छन्। यी नदीका किनारमा सडक, जलविद्युत् आयोजना र व्यापारिक संरचना बन्दै गएकाले एउटै घटनाको क्षति पनि ठूलो हुन्छ।',
      },
      { k: 'h2', text: 'चेतावनी प्रणाली कहाँ छ' },
      {
        k: 'p',
        text: 'केही नदीमा पानीको सतह मापन गर्ने सेन्सर र सायरन व्यवस्था छ, तर कभरेज सीमित छ। जल तथा मौसम विज्ञान विभागका अनुसार हिमताल अनुगमनका लागि स्वचालित स्टेशनको सङ्ख्या आवश्यकताभन्दा धेरै कम छ। यो घटनापछि विस्तार गर्नुपर्ने आवाज स्थानीय तहबाटै उठेको छ।',
      },
      {
        k: 'list',
        items: [
          'जोखिम क्षेत्रको स्पष्ट नक्सा र सार्वजनिक जानकारी',
          'नदी किनारका बस्तीको संरचित स्थानान्तरण योजना',
          'माथिल्लो भागमा सेन्सर, तल्लो भागमा सायरन र एसएमएस चेतावनी',
          'निर्माण अनुमति दिँदा बाढी संवेदनशील क्षेत्रको वर्गीकरण',
        ],
      },
      { k: 'h2', text: 'अबको बाटो' },
      {
        k: 'p',
        text: 'यो घटनाले देखायो: "प्राकृतिक प्रकोप" भनिने धेरै घटना वास्तवमा जोखिम व्यवस्थापनको नीतिगत छनोटसँग जोडिएका हुन्छन्। बस्ती कहाँ बसाउने, कुन संरचना किनारमा बनाउन दिने भन्ने निर्णयले क्षतिको आकार तय गर्छ। जलवायु अनुकूलन बजेट अब मन्त्रालयको कागजी योजनाबाट वास्तविक सुरक्षा संरचनामा जानैपर्छ।',
      },
      {
        k: 'p',
        text: 'नागरिक वाच वातावरण/विपद् डेस्कले जोखिम नक्सा, अनुगमन प्रणालीको अवस्था र अनुकूलन लगानीको शृङ्खलाबद्ध अनुसन्धान गर्दैछ। पाठकका सुझाव र स्थानीय जानकारी आमन्त्रित छन्।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'The 26 August flood was different from a monsoon flood: on a dry morning, water released from a glacial process upstream arrived with almost no warning. Experts treat such events as a distinct risk class.',
      },
      {
        k: 'p',
        text: 'As temperatures rise, glacier-fed lakes grow and their ice dams weaken; a collapse can send a surge downstream in minutes. Rivers like the Bhote Koshi, Sunkoshi and Tamakoshi combine high glacial risk with dense infrastructure on their banks.',
      },
      {
        k: 'p',
        text: 'Automated monitoring coverage remains far below need. Risk mapping, planned relocation, upstream sensors with downstream sirens and SMS alerts, and flood-zone-aware construction permits are the known, affordable answers.',
      },
      {
        k: 'p',
        text: 'What this event ultimately shows is that "natural disasters" are also policy choices: where settlements and infrastructure are allowed determines the size of the loss.',
      },
    ],
    publishedAt: '2026-08-31T02:30:00.000Z',
    readingMinutes: 6,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/glacier-1.jpg',
    heroCaption: 'हिमाली हिमनदी — तापक्रम बढ्दै जाँदा यस्ता स्रोतबाट आकस्मिक बाढीको जोखिम बढ्छ।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['जलवायु परिवर्तन', 'हिमनदी', 'विश्लेषण', 'जोखिम'],
    author: 'वातावरण डेस्क',
    premium: true,
  },
  {
    slug: 'flood-economic-damage-reconstruction-2083',
    desk: 'business',
    titleNe: 'बाढीको आर्थिक चोट: अर्बौंको पूर्वाधार क्षति, पुनर्निर्माणको बिल उठ्दै',
    titleEn: 'The economic blow: billions in damaged infrastructure and a rising reconstruction bill',
    deckNe:
      'सडक, खानेपानी, जलविद्युत् र सीमा व्यापार एकैपटक चोटमा पर्दा यस वर्षायामको कुल क्षति १७ अर्ब रुपैयाँभन्दा माथि पुग्ने अनुमान छ।',
    deckEn:
      'Roads, water schemes, hydropower and border trade hit at once push this season total damage beyond NPR 17 billion.',
    bodyNe: [
      {
        k: 'p',
        text: 'काठमाडौं — वर्षायामका विपद् घटनाले गरेको भौतिक क्षतिको अनुमान १७ अर्ब रुपैयाँभन्दा माथि पुगेको छ। खानेपानी संरचनामा करिब ३.५५ अर्ब, सडक पूर्वाधारमा २.५२ अर्ब रुपैयाँको क्षति पर्ने प्रारम्भिक आकलन छ। भोटेकोशी बाढीले थपेको रसुवागढी नाका र जलविद्युत् आयोजनाको क्षतिले यो आँकडा अझ बढ्ने निश्चित छ।',
      },
      { k: 'h2', text: 'कुन क्षेत्रमा कति चोट' },
      {
        k: 'list',
        items: [
          'सडक तथा भौतिक पूर्वाधार: पहिरोले अवरुद्ध सडकखण्ड पुनर्स्थापना महँगो',
          'जलविद्युत्: भोटेकोशी/त्रिशुली किनारका आयोजनाका संरचना क्षतिग्रस्त',
          'खानेपानी: ग्रामीण संरचना पुनर्जीवित गर्न लाग्ने लागत ठूलो',
          'व्यापार: रसुवागढी नाका बन्द, कन्टेनर र सामान गुमाउँदा बिमा दावी जटिल',
        ],
      },
      {
        k: 'p',
        text: 'आर्थिक असर तत्कालको मात्र होइन। बाटो छिनिए आपूर्ति व्यवस्था महँगो हुन्छ; विद्युत् आयोजना रोकिँदा आय गुम्छ; पर्यटन मौसम अघाउँदो हुन्छ। व्यापार विज्ञहरूका अनुसार नाका पुनर्स्थापनामा लाग्ने समय नै सबैभन्दा ठूलो आर्थिक हानि निर्धारण गर्ने तत्व हो।',
      },
      { k: 'h2', text: 'पुनर्निर्माणको व्यवस्था' },
      {
        k: 'p',
        text: 'सरकारले अन्तर्राष्ट्रिय समुदायसँग प्राविधिक सहयोग र ठूलो परिमाणको पुनर्निर्माण सहयोग खोजिरहेको छ। तर अनुभवले देखाएको छ: क्षति पूर्वाधिरोहित "पुनर्निर्माण" गर्दा अर्को वर्षायाममा उही क्षति फर्किन्छ। नीतिगत छनोट अब जोखिम-जानकारीमा आधारित हुनुपर्छ।',
      },
      {
        k: 'p',
        text: 'बजार डेस्कले नाका व्यापार, निर्माण सामग्रीको मूल्य र बिमा दावी प्रक्रियाको निरन्तर अनुगमन गर्नेछ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Total physical damage this monsoon is estimated above NPR 17 billion — about NPR 3.55 billion to drinking-water schemes and NPR 2.52 billion to roads — and the Bhote Koshi flood will push the figure higher as border-trade and hydropower losses are counted.',
      },
      {
        k: 'p',
        text: 'The bill is not just immediate: severed roads raise supply costs, halted hydropower projects lose revenue, and the timeline to restore the Rasuwagadhi trade route is itself the biggest economic variable.',
      },
      {
        k: 'p',
        text: 'The government is seeking technical help and large reconstruction support internationally. The known trap is rebuilding the same exposed infrastructure — policy choices must shift to risk-informed reconstruction.',
      },
    ],
    publishedAt: '2026-08-30T02:15:00.000Z',
    readingMinutes: 4,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/flood-bridge-2.jpg',
    heroCaption: 'बाढीले क्षतिग्रस्त पुल र सडक — पुनर्स्थापनाको लागत अर्बौंमा नापिन्छ।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['अर्थतन्त्र', 'क्षति', 'पुनर्निर्माण', 'बाढी'],
    author: 'बजार डेस्क',
  },
  {
    slug: 'flood-shelter-health-risks-waterborne-2083',
    desk: 'health',
    titleNe: 'विस्थापित शिविरमा स्वास्थ्य जोखिम: पानीजनित रोगको सङ्क्रमण नियन्त्रणमा ध्यान',
    titleEn: 'Health risks in displacement camps: keeping waterborne disease in check',
    deckNe:
      'आश्रय शिविरमा सफा पानी, सरसफाइ र खोप कवरेज अत्यावश्यक छ। डाइरिया, टाइफाइड र छालाका सङ्क्रमणको जोखिम बढ्न सक्छ।',
    deckEn:
      'Clean water, sanitation and vaccination coverage are urgent in shelters; diarrhoeal disease, typhoid and skin infections can spread fast.',
    bodyNe: [
      {
        k: 'p',
        text: 'धुन्चे/काठमाडौं — बाढीपछिका विस्थापित शिविर स्वास्थ्य जोखिमको अर्को मोर्चा हुन्। सङ्कुचित ठाउँमा धेरै मानिस बस्दा पानीजनित रोग, श्वासप्रश्वासका सङ्क्रमण र छालाका रोग फैलिने दर बढ्छ। स्वास्थ्यकर्मीहरूले आश्रयमा खानेपानी उमालेर पिउने, हात धुने र खाना पकाएर खाने आदतको जोड दिएका छन्।',
      },
      {
        k: 'p',
        text: 'बाढीको पानीसँग संपर्क भएकाहरूमा घाउ संक्रमण र छालाको रोग देखिन थालेको छ। स्वास्थ्य मन्त्रालयका टोली शिविरमा पुगेर परीक्षण गरिरहेका छन्। खोप कभरेज नपुगेका बालबालिकाको सूची बनाइँदै छ।',
      },
      { k: 'h2', text: 'घर फर्किँदा ध्यान दिनुपर्ने कुरा' },
      {
        k: 'list',
        items: [
          'पिउने पानी उमालेर वा सोडियम क्लोराइड औषधि राखेर प्रयोग गर्ने',
          'बाढीले भिजेको अन्न/दाल बासी भए नखाने',
          'भित्ता चुँडिएको घर सुरक्षित नभएसम्म नपस्ने',
          'लामो समय ज्वरो वा पातलो दिसा भए तुरुन्तै स्वास्थ्य संस्था जाने',
        ],
      },
      {
        k: 'p',
        text: 'मानसिक स्वास्थ्य पक्ष पनि उत्तिकै महत्त्वपूर्ण छ। आफन्त गुमाउनेहरू र भयको अनुभव गरेका बालबालिकालाई मनोसामाजिक परामर्श चाहिन्छ। स्थानीय स्वास्थ्य केन्द्रसँग जोडिएर यस्तो सेवा विस्तार गर्न सकिन्छ।',
      },
      {
        k: 'p',
        text: 'नागरिक वाच स्वास्थ्य डेस्कले शिविरका स्वास्थ्य सेवा, औषधि आपूर्ति र रोग निगरानीको नियमित अनुगमन गर्नेछ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Displacement camps are the next health frontline: crowding raises the risk of waterborne and respiratory infections. Health workers stress boiled water, handwashing and fully cooked food; skin and wound infections are already appearing among people who waded through floodwater.',
      },
      {
        k: 'p',
        text: 'Ministry teams are screening in shelters and listing children with missed vaccinations. Psychosocial support for bereaved families and children is flagged as equally important.',
      },
    ],
    publishedAt: '2026-08-29T02:00:00.000Z',
    readingMinutes: 3,
    featured: 'none',
    location: 'रसुवा',
    province: 'bagmati',
    hero: '/photos/disaster/rescue-relief-2.jpg',
    heroCaption: 'शिविरमा स्वास्थ्य परीक्षण र राहत वितरण।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['स्वास्थ्य', 'विस्थापित', 'पानीजनित रोग'],
    author: 'स्वास्थ्य डेस्क',
  },
  {
    slug: 'flood-safety-guide-what-to-do-2083',
    desk: 'disaster',
    titleNe: 'बाढी र पहिरोबाट जोगिने तरिका: घर, यात्रा र सूचनासम्बन्धी जानकारी',
    titleEn: 'How to stay safe from floods and landslides: home, travel and information',
    deckNe:
      'विपद् समयमा उपयोगी हुने सेवा-पत्रकारिता: अघि के तयारी, बाढी चलिरहँदा के गर्ने, पछि के हेर्ने।',
    deckEn:
      'Service journalism for disaster season: what to prepare, what to do during a flood, and what to check afterwards.',
    bodyNe: [
      {
        k: 'p',
        text: 'विपद् आउनुअघि र आइसकेपछि गरिने साना तयारीले जीवन बचाउन सक्छ। नागरिक वाचले प्रहरी, विपद् व्यवस्थापन प्राधिकरण र स्वास्थ्य कर्मीहरूको सुझावका आधारमा यो सेवा-पत्रकारिता तयार पारेको छ — साथै विपद् केन्द्रमा आपत्कालीन फोन नम्बरहरू राखिएका छन्।',
      },
      { k: 'h2', text: 'पहिले नै गर्नुपर्ने तयारी' },
      {
        k: 'list',
        items: [
          'आफ्नो टोल खोलाको जोखिम स्तर थाहा पाउने (वडा कार्यालय/स्थानीय रेडियो सोध्ने)',
          'उकालो थलो र सुरक्षित जमघट ठाउँ पहिचान गरेर परिवारसँग मिलाउने',
          'कागजात, नगद, औषधि र चार्जर प्लास्टिक झोलामा तयार राख्ने',
          'घरमा खानेपानीको भण्डार र पावर बैंक चार्ज राख्ने',
        ],
      },
      { k: 'h2', text: 'चेतावनी आउँदा वा पानी देखिनासाथ' },
      {
        k: 'list',
        items: [
          'बहावको बाटो नाघ्ने प्रयास नगर्ने — घुँडीसम्मको बहने पानीले बगाउँछ',
          'बिजुलीको खम्बा/तार र कमजोर संरचनादेखि टाढा रहने',
          'खोला किनारको रमाइलो, तस्बिर र भिडभाड नगर्ने',
          'सूचना गम्भीर हुँदा बस्तु साँच्ने समयमा जान लगाउने — ज्यान पहिलो हो',
        ],
      },
      { k: 'h2', text: 'घटनापछि' },
      {
        k: 'list',
        items: [
          'पिउने पानी उमालेर प्रयोग गर्ने; सतहको पानी कहिल्यै नपिउने',
          'भित्ता/जग जाँचिनुञ्जेल घरमा नपस्ने',
          'बेपत्ता विवरण नजिकको प्रहरी इकाइमा दर्ता गर्ने',
          'आफैँ नै बाँचेको स्रोत जाँच्ने — सामाजिक सञ्जालका पुराना भिडियो पत्ता लगाउने',
        ],
      },
      {
        k: 'p',
        text: 'आपत्कालीन नम्बर: प्रहरी १००, सशस्त्र प्रहरी (उद्धार) १११, एम्बुलेन्स १०२। थप विवरण र अद्यावधिक अवस्था हाम्रो विपद् केन्द्रमा हेर्न सकिन्छ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Small preparations save lives. Know your neighbourhood risk level, agree on an uphill meeting point, keep documents and medicine in a sealed bag, and store drinking water with a charged power bank.',
      },
      {
        k: 'p',
        text: 'During a flood: never wade through flowing water — knee-deep current can sweep you away; stay clear of poles, wires and weak structures; do not gather on riverbanks to watch or film.',
      },
      {
        k: 'p',
        text: 'Afterwards: boil drinking water, do not enter houses until walls and foundations are checked, register missing-person details with the nearest police unit, and verify viral videos before sharing.',
      },
    ],
    publishedAt: '2026-08-30T04:40:00.000Z',
    readingMinutes: 2,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/flood-village-4.jpg',
    heroCaption: 'खोला किनारका बस्ती — जोखिम थाहा पाउनु नै पहिलो सुरक्षा हो।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['जानकारी', 'सुरक्षा', 'सेवा', 'बाढी'],
    author: 'नागरिक वाच',
  },
  {
    slug: 'fake-videos-flood-misinformation-factcheck-2083',
    desk: 'fact-check',
    titleNe: 'तथ्य जाँच: बाढीबीच भाइरल भइरहेका गलत भिडियो र दाबीहरू',
    titleEn: 'Fact check: the viral videos and claims spreading amid the floods',
    deckNe:
      '"बाँध फुट्यो", पुराना भिडियो र बढाइचढाइ गरिएका मृत्यु आँकडा — विपद् समयमा गलत सूचना ज्यान मार्ने हतियार बन्छ। नागरिक वाचले भाइरल दाबीहरू जाँच्यो।',
    deckEn:
      'Dam-break rumours, recycled videos and inflated death tolls: false information becomes lethal during disasters. We checked the most-shared claims.',
    bodyNe: [
      {
        k: 'p',
        text: 'विपद् समयमा सामाजिक सञ्जाल दुई काम गर्छ — उद्धारका लागि सूचना बहने र आतंक फैलाउने। २६ अगस्टको बाढीपछि पनि केही गलत दाबी भाइरल भए। नागरिक वाच तथ्य जाँच डेस्कले व्यापक रूपमा साझा गरिएका दाबीहरू प्रमाणसँग मिलायो।',
      },
      { k: 'h2', text: 'जाँचिएका दाबी' },
      { k: 'h3', text: 'दाबी १: "कोशी बाँध फुट्यो, तल बसेकाहरू भागौं"' },
      {
        k: 'p',
        text: 'निर्णय: गलत। यो बाढी भोटेकोशी नदीमा हिमनदीसँग जोडिएर आएको हो; कोशी बाँध फुटेको कुनै आधिकारिक वा आँकडामा आधारित सूचना छैन। बाँधसम्बन्धी यस्तो अफवाहले अनावश्यक आतंक र भीड निम्त्याउँछ। स्रोत: जल तथा मौसम विज्ञान विभाग र जिल्ला प्रशासनका आधिकारिक विज्ञप्ति।',
      },
      { k: 'h3', text: 'दाबी २: अर्को देशको बाढीको भिडियो "नेपालको" भनेर' },
      {
        k: 'p',
        text: 'निर्णय: गलत श्रोत देखाइएको। भाइरल भएका केही भिडियो अघिल्ला वर्षहरूका वा अन्य देशका घटनाका हुन्। भिडियोमा देखिने निर्माण शैली, गाडीको नम्बर प्लेट र स्थानीय भाषा यस्ता सङ्केत हुन् जसले उत्पत्ति थाहा दिन्छ। साझा गर्नुअघि अपलोड मिति हेर्नुहोस्।',
      },
      { k: 'h3', text: 'दाबी ३: "मृत्यु दर्जनौं मात्र हो, सरकारले लुकाइरहेको छ"' },
      {
        k: 'p',
        text: 'निर्णय: सन्दर्भ चाहिन्छ। मृत्यु आँकडा उद्धार प्रगतिसँगै अद्यावधिक हुँदै जान्छ — ४६९ पुगेको आँकडा प्रहरीको विवरण हो र बढ्नै सक्छ। "लुकाउनु" र "प्रारम्भिक आँकडा समयसँगै फेरिनु" फरक कुरा हुन्। जनावटी ढाँचामा आँकडा आउँदा प्रतीक्षा गर्नु भरपर्दो तरिका हो।',
      },
      { k: 'h2', text: 'कसरी आफैँ जाँच्ने' },
      {
        k: 'list',
        items: [
          'स्रोत खोज्ने: खबर कसले, कहाँबाट, कहिले दियो?',
          'भिडियोको अपलोड मिति र पहिलेको उपस्थिति जाँच्ने',
          'आँकडा आधिकारिक विज्ञप्तिसँग मिलाउने (प्रहरी, निड्र्मा, जिल्ला प्रशासन)',
          'आतंक फैलाउने शीर्षक भएट्सम्म पटक्कै नसाझा गर्ने',
        ],
      },
      {
        k: 'p',
        text: 'तपाईंलाई शङ्कास्पद देखिने कुनै दाबी हामीलाई पठाउनुहोस् — तथ्य जाँच डेस्कले प्रमाणसँग मिलाएर सार्वजनिक गर्नेछ।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'During disasters, social media both carries rescue information and spreads panic. We checked the most-shared claims after the 26 August flood.',
      },
      {
        k: 'p',
        text: 'Claim 1 — Kosi dam has broken, run for your lives: False. The flood came from the Bhote Koshi; no official source reports any dam breach. Claim 2 — dramatic flood videos from Nepal: several are from earlier years or other countries; check upload dates and details. Claim 3 — the true toll is hidden: needs context; police figures are updated as rescue progresses, which is not concealment.',
      },
      {
        k: 'p',
        text: 'Verify sources, check upload dates, match numbers against official statements, and never share panic headlines.',
      },
    ],
    publishedAt: '2026-08-31T01:20:00.000Z',
    readingMinutes: 3,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/landslide-2.jpg',
    heroCaption: 'विपद् समयमा सूचना पनि जाँचिनैपर्छ — गलत खबरले उद्धार र शान्ति दुवैमा असर पार्छ।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['तथ्य जाँच', 'भनाइ जाँच', 'बाढी', 'गलत सूचना'],
    author: 'तथ्य जाँच डेस्क',
  },
]

floodStoriesPart2.forEach((s) => floodStories.push(s))

const factStories: Story[] = [
  {
    slug: 'earthquake-prediction-viral-claims-2083',
    desk: 'fact-check',
    titleNe: 'तथ्य जाँच: "यो हप्ता ठूलो भूकम्प आउँछ" भन्ने भाइरल भविष्यवाणीहरू',
    titleEn: 'Fact check: the viral earthquake predictions for this week',
    deckNe:
      'भूकम्प पूर्वानुमान गर्ने कुनै वैज्ञानिक विधि हालसम्म छैन — मिति र स्थान देखाएर आएका सबै "भविष्यवाणी" जाँचिन्छन्।',
    deckEn:
      'No scientific method can predict earthquakes date-by-date; every dated prediction circulating online fails basic scrutiny.',
    bodyNe: [
      {
        k: 'p',
        text: 'बाढीपछिको आतंकको मौकामा सामाजिक सञ्जालमा "यो हप्ता नेपालमा ठूलो भूकम्प आउँछ" भन्ने शैलीका सन्देश फेरि भाइरल भएका छन्। केही सन्देशमा मिति, समय र "ग्रह-दशा"को हवाला दिइएको पाइन्छ। नागरिक वाच तथ्य जाँच डेस्कले यस्ता दाबी भूकम्प विज्ञानसँग मिलायो।',
      },
      { k: 'h3', text: 'निर्णय: गलत' },
      {
        k: 'p',
        text: 'भूकम्प पूर्वानुमान गर्ने — अर्थात् आउने मिति, स्थान र परिमाण अगावै भन्न सक्ने — कुनै स्वीकृत वैज्ञानिक विधि संसारमा छैन। राष्ट्रिय भूकम्प मापन केन्द्र र अन्तर्राष्ट्रिय भूकम्प विज्ञान समुदायले यो कुरा बारम्बार स्पष्ट पारेका छन्। जुन सन्देशमा ठोक्किने मिति देखिन्छ, त्यो जाँच्नै नपर्ने खालको अफवाह हो।',
      },
      {
        k: 'p',
        text: 'जे गर्न सकिन्छ भने: जोखिम घटाउने तयारी — घर जाँच गर्ने, आपत्कालीन झोला तयार राख्ने, "डक-कभर-होल्ड" अभ्यास गर्ने र भूकम्पपछिको सूचना आधिकारिक स्रोतबाट लिने। सन्देश नाघ्ने र बुझाउने काम भने विज्ञानको होइन, अफवाहको हो।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Dated earthquake predictions circulating on social media are false: no accepted scientific method can predict the date, place or size of earthquakes. What is possible is preparedness — building checks, go-bags and drop-cover-hold drills.',
      },
    ],
    publishedAt: '2026-08-28T01:15:00.000Z',
    readingMinutes: 2,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/landslide-2.jpg',
    heroCaption: 'आँकडा र विज्ञान नदेखाउने भविष्यवाणी भरपर्दैनन्।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['तथ्य जाँच', 'भूकम्प', 'अफवाह'],
    author: 'तथ्य जाँच डेस्क',
  },
  {
    slug: 'school-closure-fake-notice-2083',
    desk: 'fact-check',
    titleNe: 'तथ्य जाँच: "विद्यालय १५ दिन बन्द" भन्ने भाइरल निर्णय-टिपोट',
    titleEn: 'Fact check: the viral school-closure notice',
    deckNe:
      'प्रभावित जिल्लाका केही विद्यालय अस्थायी रूपमा बन्द छन्, तर "मुलुकभर १५ दिन बन्द" भन्ने टिपोट कुनै आधिकारिक निर्णय होइन।',
    deckEn:
      'Some schools in flood-hit districts are temporarily closed, but the "nationwide 15-day closure" memo is not an official decision.',
    bodyNe: [
      {
        k: 'p',
        text: 'बाढीपछि सामाजिक सञ्जालमा "शिक्षा मन्त्रालयले सबै विद्यालय १५ दिन बन्द गर्यो" भन्ने शैलीका टिपोट भाइरल भए। जाँच्दा यो टिपोट मन्त्रालयको आधिकारिक निर्णयसँग मेल खाँदैन।',
      },
      { k: 'h3', text: 'निर्णय: मिश्रित' },
      {
        k: 'p',
        text: 'वास्तविकता: रसुवा, नुवाकोट र धादिङका प्रभावित विद्यालय जिल्ला शिक्षा कार्यालयको निर्णयअनुसार अस्थायी रूपमा बन्द छन् वा आश्रयका रूपमा प्रयोग भइरहेका छन्। तर "मुलुकभर १५ दिन बन्द" भन्ने दाबी कुनै आधिकारिक विज्ञप्तिमा आधारित छैन। स्थानीय निर्णयलाई राष्ट्रिय निर्णय भनेर उठाउँदा अन्योल फैलिन्छ।',
      },
      {
        k: 'p',
        text: 'विद्यालय खोल्ने/बन्द गर्ने निर्णय स्थानीय तह र जिल्ला शिक्षा कार्यालयले परिस्थिति हेरेर गर्छन्। आफ्नो जिल्लाको सूचना जिल्ला शिक्षा कार्यालय वा वडा कार्यालयबाटै पुष्टि गर्नुहोस्।',
      },
    ],
    bodyEn: [
      {
        k: 'p',
        text: 'Verdict: mixed. Schools in flood-affected districts are indeed temporarily closed or used as shelters on district education office decisions, but the nationwide 15-day closure claim matches no official announcement. Confirm with your district education office.',
      },
    ],
    publishedAt: '2026-08-29T01:30:00.000Z',
    readingMinutes: 2,
    featured: 'none',
    location: 'काठमाडौं',
    province: 'bagmati',
    hero: '/photos/disaster/shelter-children-2.jpg',
    heroCaption: 'आश्रय बनेका विद्यालय र "बन्द" को सूचना — दुवै फरक कुरा हुन्।',
    heroCredit: 'साभार: सञ्चारमाध्यम',
    tags: ['तथ्य जाँच', 'शिक्षा', 'अफवाह'],
    author: 'तथ्य जाँच डेस्क',
  },
]

factStories.forEach((s) => floodStories.push(s))
