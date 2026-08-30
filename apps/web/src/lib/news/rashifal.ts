/** राशिफल — daily horoscope (deterministic demo content, rotated by date). */

export interface Rashi {
  slug: string
  nameNe: string
  nameEn: string
  symbol: string
  luckyNumber: string
  luckyColorNe: string
  moodNe: string
}

export const rashis: Rashi[] = [
  { slug: 'mesh', nameNe: 'मेष', nameEn: 'Aries', symbol: '♈', luckyNumber: '३', luckyColorNe: 'रातो', moodNe: 'ऊर्जावान्' },
  { slug: 'brish', nameNe: 'वृष', nameEn: 'Taurus', symbol: '♉', luckyNumber: '६', luckyColorNe: 'सेतो', moodNe: 'स्थिर' },
  { slug: 'mithun', nameNe: 'मिथुन', nameEn: 'Gemini', symbol: '♊', luckyNumber: '५', luckyColorNe: 'हरियो', moodNe: 'चन्चल' },
  { slug: 'karkat', nameNe: 'कर्कट', nameEn: 'Cancer', symbol: '♋', luckyNumber: '२', luckyColorNe: 'रुबिनी', moodNe: 'भावुक' },
  { slug: 'simha', nameNe: 'सिंह', nameEn: 'Leo', symbol: '♌', luckyNumber: '१', luckyColorNe: 'सुनौलो', moodNe: 'आत्मविश्वासी' },
  { slug: 'kanya', nameNe: 'कन्या', nameEn: 'Virgo', symbol: '♍', luckyNumber: '५', luckyColorNe: 'खैरो', moodNe: 'विश्लेषणात्मक' },
  { slug: 'tula', nameNe: 'तुला', nameEn: 'Libra', symbol: '♎', luckyNumber: '६', luckyColorNe: 'नीलो', moodNe: 'सन्तुलित' },
  { slug: 'brischik', nameNe: 'वृश्चिक', nameEn: 'Scorpio', symbol: '♏', luckyNumber: '९', luckyColorNe: 'गाढा रातो', moodNe: 'गहन' },
  { slug: 'dhanu', nameNe: 'धनु', nameEn: 'Sagittarius', symbol: '♐', luckyNumber: '३', luckyColorNe: 'पहेँलो', moodNe: 'अन्वेषी' },
  { slug: 'makar', nameNe: 'मकर', nameEn: 'Capricorn', symbol: '♑', luckyNumber: '८', luckyColorNe: 'कालो', moodNe: 'अनुशासित' },
  { slug: 'kumbha', nameNe: 'कुम्भ', nameEn: 'Aquarius', symbol: '♒', luckyNumber: '४', luckyColorNe: 'आकाशे', moodNe: 'स्वतन्त्र' },
  { slug: 'meen', nameNe: 'मीन', nameEn: 'Pisces', symbol: '♓', luckyNumber: '७', luckyColorNe: 'समुद्री', moodNe: 'कल्पनाशील' },
]

const OPENINGS = [
  'आजको दिन नयाँ सोच लिने उपयुक्त समय हो।',
  'आज साना निर्णयहरूले ठूलो फरक पार्न सक्छन्।',
  'आजको ग्रह स्थितिले सहनशीलता बढाउन सुझाव दिन्छ।',
  'आज जुटेको काम पूरा गर्न उत्तम दिन मानिन्छ।',
  'आज आराम र मेहनतबीच सन्तुलन खोज्नुहोस्।',
]

const CAREERS = [
  'कार्यक्षेत्रमा पुराना सहकर्मीसँगको संगतले नयाँ अवसरको ढोका खोल्न सक्छ।',
  'व्यवसायमा लगानी गर्नुअघि विवरण दोहोर्‍याउनु राम्रो हुन्छ।',
  'आज प्रस्तुत गरिने योजनाले माथिल्लो तहबाट प्रशंसा पाउने सम्भावना छ।',
  'नयाँ परियोजना सुरु गर्न आजको दिन अनुकूल देखिन्छ।',
  'काममा भएको अस्पष्टता साथीभाइसँग खुलेर छलफल गरे समाधान निस्कन्छ।',
]

const RELATIONS = [
  'पारिवारिक जमघटले मन हल्का बनाउनेछ।',
  'जीवनसाथीसँगको सानो असमझ्यान निवारणका लागि धैर्य राख्नुहोस्।',
  'पुरानो साथीसँग आजको कुराकानीले सम्बन्ध नयाँ ऊर्जा दिनेछ।',
  'मायाका शब्दहरू आज बढी अर्थपूर्ण हुनेछन्।',
  'आफन्तसँगको दूरी आज घट्ने अच्छसा छ।',
]

const HEALTHS = [
  'पानी पर्याप्त मात्रामा पिउने बानी बनाउनुहोस्।',
  'बिहानको हिँडाइले दिनभरको ऊर्जा बढाउनेछ।',
  'निद्राको समय नियमित गर्दा स्वास्थ्य सन्तुलनमा रहन्छ।',
  'आज हल्का योग वा तनावमुक्ति अभ्यास लाभदायक हुन्छ।',
  'खानपानमा हरियो सागपात समावेश गर्नुहोस्।',
]

function pick<T>(arr: T[], offset: number): T {
  return arr[offset % arr.length]!
}

export function horoscopeFor(slug: string, dateSeed: number) {
  const idx = rashis.findIndex((r) => r.slug === slug)
  const offset = dateSeed + Math.max(0, idx)
  return {
    opening: pick(OPENINGS, offset),
    career: pick(CAREERS, offset * 2 + 1),
    relations: pick(RELATIONS, offset * 3 + 2),
    health: pick(HEALTHS, offset * 4 + 3),
  }
}

export function dateSeed(date: Date): number {
  return Math.floor(date.getTime() / 86400000)
}
