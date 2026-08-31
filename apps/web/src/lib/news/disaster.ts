/**
 * विपद् केन्द्र (Disaster Hub) data — २६ अगस्ट २०२६ भोटेकोशी बाढी विशेष.
 *
 * Facts compiled from public reporting on the 26 August 2026 Bhote Koshi
 * glacial flash flood (Rasuwa / Gyirong border) and the 2026 monsoon season:
 * Nepal Police toll statements, NDRRMA situation reports, UNICEF child-impact
 * figures, and international relief-agency updates. Numbers are labelled with
 * their source and "अन्तिम अद्यावधिक" (last-updated) — they evolve with rescue
 * operations, so the hub always shows the as-of date.
 */

export interface DisasterStat {
  labelNe: string
  value: string
  noteNe: string
  tone: 'critical' | 'warning' | 'info'
}

export interface DistrictImpact {
  districtNe: string
  districtEn: string
  province: string
  deadNe: string
  missingNe: string
  displacedNe: string
  noteNe: string
}

export interface TimelineEntry {
  timeNe: string
  titleNe: string
  bodyNe: string
}

export interface Helpline {
  nameNe: string
  number: string
  descNe: string
}

export interface ReliefPartner {
  nameNe: string
  nameEn: string
  roleNe: string
}

export const disasterStats: DisasterStat[] = [
  {
    labelNe: 'पुष्टि मृत्यु',
    value: '४६९',
    noteNe: 'नेपाल प्रहरीको आँकडा, छिमेकी तिब्बत क्षेत्रसहित',
    tone: 'critical',
  },
  {
    labelNe: 'बेपत्ता',
    value: '१,५००+',
    noteNe: 'उद्धार टोलीको खोज जारी, सङ्ख्या परिवर्तनशील',
    tone: 'critical',
  },
  {
    labelNe: 'प्रभावित परिवार',
    value: '७५,०००+',
    noteNe: '३५ जिल्लामा आंशिक वा पूर्ण क्षति (राहत संस्थाहरूको अनुमान)',
    tone: 'warning',
  },
  {
    labelNe: 'विस्थापित',
    value: '१८,०००+',
    noteNe: 'अस्थायी शिविर र सामुदायिक भवनमा आश्रय',
    tone: 'warning',
  },
  {
    labelNe: 'प्रभावित बालबालिका',
    value: '१७,०००+',
    noteNe: 'रसुवा, नुवाकोट र धादिङमा (युनिसेफ)',
    tone: 'warning',
  },
  {
    labelNe: 'प्रभावित जिल्ला',
    value: '३५',
    noteNe: 'बाढी, पहिरो र डुबानप्रभावित; रसुवा सबैभन्दा बढी',
    tone: 'info',
  },
]

export const districtImpacts: DistrictImpact[] = [
  {
    districtNe: 'रसुवा',
    districtEn: 'Rasuwa',
    province: 'bagmati',
    deadNe: '१७५+',
    missingNe: '१८ (प्रहरी लगायत)',
    displacedNe: '९,०००+',
    noteNe: 'रसुवागढी नाका र भोटेकोशी किनारका बस्ती सखाप; सीमा व्यापार ठप्प',
  },
  {
    districtNe: 'नुवाकोट',
    districtEn: 'Nuwakot',
    province: 'bagmati',
    deadNe: '६०+',
    missingNe: 'दर्जनौं',
    displacedNe: '४,०००+',
    noteNe: 'भोटेकोशी/त्रिशुली किनारका बस्ती र हाइड्रो चोटि; बिजुली लाइन बिच्छेद',
  },
  {
    districtNe: 'धादिङ',
    districtEn: 'Dhading',
    province: 'bagmati',
    deadNe: '४०+',
    missingNe: '—',
    displacedNe: '३,५००+',
    noteNe: 'सडकखण्ड अवरुद्ध; विद्यालय सामुदायिक भवनमा सारिए',
  },
  {
    districtNe: 'सिन्धुपाल्चोक',
    districtEn: 'Sindhupalchok',
    province: 'bagmati',
    deadNe: '३०+',
    missingNe: '—',
    displacedNe: '२,०००+',
    noteNe: 'यस सिजनका अघिल्ला पहिरो क्षति थपियो; भर्खरैको बाढीले जोखिम बढायो',
  },
  {
    districtNe: 'जाजरकोट',
    districtEn: 'Jajarkot',
    province: 'karnali',
    deadNe: 'पूर्व घटनामा ४',
    missingNe: '—',
    displacedNe: '—',
    noteNe: 'साउनदेखिको अविरल वर्षामा बाढी–पहिरो; गाउँ खण्डित',
  },
]

export const timeline: TimelineEntry[] = [
  {
    timeNe: 'भद्र ९ / २५ अगस्ट, रात',
    titleNe: 'हिमनदी सम्भावित भाँचिने क्रम',
    bodyNe:
      'तिब्बतको जिलुङ क्षेत्रनजिकको हिमनदीमा ठूलो हिमपहिरो र पानीजम्ने प्रक्रिया सुरु भएको अनुमान गरिन्छ। भोटेकोशी माथिल्लो भागमा पानीको सतह र बहाव अस्वाभाविक बढ्दै गयो।',
  },
  {
    timeNe: 'भद्र १० / २६ अगस्ट, बिहान',
    titleNe: 'भोटेकोशीमा अचानक बाढी',
    bodyNe:
      'बिहानको समयमा हिमनदीबाट भनिने ठूलो बाढी भोटेकोशीमा झुण्डियो। रसुवागढी नाका, कस्टम कार्यालय र किनारका दर्जनौं बस्ती पानीमा बगे। सीसीटीभी फुटेजमा मानिसहरू दौडेर उकालो तर्फ भागेका देखिन्छन्।',
  },
  {
    timeNe: 'भद्र १०–११ / २६–२७ अगस्ट',
    titleNe: 'उद्धार सुरु, मृत्यु बढ्दै',
    bodyNe:
      'नेपाली सेना, सशस्त्र प्रहरी र स्थानीय प्रहरीको खोज तथा उद्धार सुरु भयो। दिनभरि शव सङ्ख्या बढ्दै गयो; शुक्रबार बिहानसम्म प्रहरीको ताजा विवरणअनुसार मृत्यु ४६९ पुग्यो र १,५०० जना बेपत्ता रहे।',
  },
  {
    timeNe: 'भद्र ११–१२ / २७–२८ अगस्ट',
    titleNe: 'अन्तर्राष्ट्रिय राहत आउँदै',
    bodyNe:
      'केयर, कन्भोई अफ होप र डाइरेक्ट रिलिफजस्ता संस्थाले खानेकुरा, शुद्ध पानी र स्वास्थ्य सेवा पुर्‍याउन थाले। युनिसेफले रसुवा, नुवाकोट र धादिङमा १७ हजार बालबालिका प्रभावित भएको पुष्टि गर्‍यो।',
  },
  {
    timeNe: 'भद्र १२–१५ / २८–३१ अगस्ट',
    titleNe: 'पुनर्स्थापना र जोखिम निरन्तर',
    bodyNe:
      'मुलुकले प्राविधिक सहयोग र अर्बौं रुपैयाँ पुनर्निर्माण सहयोग मागेको छ। भोटेकोशी र त्रिशुली किनारमा थप वर्षाका कारण जोखिम कायम छ; मौसम विज्ञान महाशाखाले सावधानी अपनाउन आग्रह गरेको छ।',
  },
]

export const helplines: Helpline[] = [
  { nameNe: 'प्रहरी', number: '१००', descNe: 'आपत्कालीन रिपोर्ट, उद्धार समन्वय' },
  { nameNe: 'सशस्त्र प्रहरी (बाढी/पहिरो उद्धार)', number: '१११', descNe: 'खोज तथा उद्धार टोली' },
  { nameNe: 'एम्बुलेन्स', number: '१०२', descNe: 'स्वास्थ्य आपतकालीन' },
  { nameNe: 'विद्युत् आपत्कालीन', number: '११५', descNe: 'झुण्डिएका लाइन/खम्बा' },
  { nameNe: 'नेपाल रेडक्रस', number: '०१-४२२००४०', descNe: 'शिविर तथा विस्थापित सहयोग' },
]

export const reliefPartners: ReliefPartner[] = [
  { nameNe: 'नेपाली सेना', nameEn: 'Nepal Army', roleNe: 'खोज तथा उद्धार, हेलिकप्टर निकासी' },
  { nameNe: 'सशस्त्र प्रहरी बल', nameEn: 'Armed Police Force', roleNe: 'उद्धार र शिविर सुरक्षा' },
  { nameNe: 'केयर नेपाल', nameEn: 'CARE Nepal', roleNe: 'आपत्कालीन विस्थापित सहयोग' },
  { nameNe: 'डाइरेक्ट रिलिफ', nameEn: 'Direct Relief', roleNe: 'चिकित्सा टोली र औषधि' },
  { nameNe: 'कन्भोई अफ होप', nameEn: 'Convoy of Hope', roleNe: 'खानेकुरा र शुद्ध पानी' },
  { nameNe: 'युनिसेफ', nameEn: 'UNICEF', roleNe: 'बालबालिका संरक्षण, शिक्षा' },
]

/** Emergency "what to do" guidance — service journalism block for the hub. */
export const safetyGuide: { titleNe: string; itemsNe: string[] }[] = [
  {
    titleNe: 'बाढी आउनुअघि',
    itemsNe: [
      'स्थानीय प्रहरी, वडा कार्यालय वा रेडियोको चेतावनी नियमित सुन्नुहोस्',
      'खोलाको किनार र हेडलेक्षेत्रको घरबाट उकालो थलो पहिचान गर्नुहोस्',
      'महत्त्वपूर्ण कागजात, नगद र औषधि प्लास्टिक झोलामा तयार राख्नुहोस्',
      'मोबाइल पावर बैंक चार्ज राख्नुहोस्; घरमा खानेपानी भरेर राख्नुहोस्',
    ],
  },
  {
    titleNe: 'बाढी चलिरहँदा',
    itemsNe: [
      'पानी बग्ने बाटोमा भए पानी नाघ्ने प्रयास नगर्नुहोस् — घुँडीसम्मको पानीले बगाउँछ',
      'बिजुलीको खम्बा, तार र झुण्डिएका संरचनादेखि टाढा रहनुहोस्',
      'खोला किनारमा रमाइलो गर्न वा तस्बिर खिच्न जानु हुँदैन',
      'सूचना आएदेखि तुरुन्तै उकालो तर्फ सारिनुहोस् — "पानी आएपछि भन्छु" भन्ने छैन',
    ],
  },
  {
    titleNe: 'बाढीपछि',
    itemsNe: [
      'सफा पानी उमालेर पिउनुहोस्; सतहको पानी कहिल्यै पिउनु हुँदैन',
      'भित्ता/जग चुँडिएको घरमा नपस्नुहोस्, पहिले जाँच्नुहोस्',
      'बेपत्ता नातागतको विवरण नजिकको प्रहरी इकाइमा दर्ता गर्नुहोस्',
      'राहत वितरणमा पारदर्शिता खोज्नुहोस्; अफवाह नफैलाउनुहोस्',
    ],
  },
]

/** Where these numbers come from — displayed on the hub for honesty. */
export const disasterSources: string[] = [
  'नेपाल प्रहरीको आँकडा विवरण (शुक्रबार बिहानको ताजा अद्यावधिक)',
  'राष्ट्रिय विपद् व्यवस्थापन प्राधिकरण (नियमित स्थिति प्रतिवेदन)',
  'युनिसेफको बालबालिका प्रभाव अनुमान (रसुवा, नुवाकोट, धादिङ)',
  'अन्तर्राष्ट्रिय राहत संस्थाहरूको विज्ञप्ति (केयर, डाइरेक्ट रिलिफ, कन्भोई अफ होप)',
  'स्थानीय तथा अन्तर्राष्ट्रिय मिडिया रिपोर्टिङ',
]

export const DISASTER_LAST_UPDATED = '२०२६ अगस्ट ३१ / भद्र १५, २०८३'
