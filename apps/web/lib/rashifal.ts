/**
 * Rashifal (horoscope) data. 12 zodiac signs with today's forecast in Nepali
 * and English. This is static editorial content (not copyrighted — generic
 * horoscope text). In production, an editor updates this daily from the admin
 * (Phase 3: rashifal manager). For now, it ships as a server-side constant.
 */

export type RashifalSign = {
  slug: string
  nameNe: string
  nameEn: string
  symbol: string
  forecastNe: string
  forecastEn: string
  luckyNumber: number
  luckyColorNe: string
  luckyColorEn: string
}

export const RASHIFAL_SIGNS: RashifalSign[] = [
  {
    slug: 'mesha',
    nameNe: 'मेष',
    nameEn: 'Aries',
    symbol: '♈',
    forecastNe:
      'आज तपाईंको ऊर्जा उच्च छ। नयाँ काम सुरु गर्न उपयुक्त दिन। आत्मविश्वासका साथ अघि बढ्नुहोस्।',
    forecastEn:
      'Your energy is high today. A good day to start new work. Move forward with confidence.',
    luckyNumber: 9,
    luckyColorNe: 'रातो',
    luckyColorEn: 'Red',
  },
  {
    slug: 'vrishabha',
    nameNe: 'वृषभ',
    nameEn: 'Taurus',
    symbol: '♉',
    forecastNe:
      'वित्तीय मामिलामा सावधानी अपनाउनुहोस्। पारिवारिक समर्थन प्राप्त हुनेछ। धैर्यता तपाईंको शक्ति हो।',
    forecastEn:
      'Be cautious in financial matters. Family support will be available. Patience is your strength.',
    luckyNumber: 6,
    luckyColorNe: 'सेतो',
    luckyColorEn: 'White',
  },
  {
    slug: 'mithuna',
    nameNe: 'मिथुन',
    nameEn: 'Gemini',
    symbol: '♊',
    forecastNe:
      'सञ्चार र विचार विनिमयमा सफलता मिल्नेछ। नयाँ मानिससँग परिचय हुन सक्छ। व्यस्त तर उत्पादक दिन।',
    forecastEn:
      'Success in communication and exchange of ideas. You may meet new people. A busy but productive day.',
    luckyNumber: 5,
    luckyColorNe: 'हरियो',
    luckyColorEn: 'Green',
  },
  {
    slug: 'karka',
    nameNe: 'कर्क',
    nameEn: 'Cancer',
    symbol: '♋',
    forecastNe:
      'भावनात्मक संवेदनशीलता बढी हुनेछ। प्रियजनसँग समय बिताउनुहोस्। घरभित्र शान्ति रहनेछ।',
    forecastEn: 'Emotional sensitivity will be high. Spend time with loved ones. Peace at home.',
    luckyNumber: 2,
    luckyColorNe: 'चाँदी',
    luckyColorEn: 'Silver',
  },
  {
    slug: 'simha',
    nameNe: 'सिंह',
    nameEn: 'Leo',
    symbol: '♌',
    forecastNe: 'नेतृत्वको अवसर प्राप्त हुनेछ। आत्मविश्वास तपाईंको पहिचान हो। मेहनतको फल मिल्नेछ।',
    forecastEn:
      'Leadership opportunity will come. Confidence is your identity. Hard work will pay off.',
    luckyNumber: 1,
    luckyColorNe: 'सुनौलो',
    luckyColorEn: 'Gold',
  },
  {
    slug: 'kanya',
    nameNe: 'कन्या',
    nameEn: 'Virgo',
    symbol: '♍',
    forecastNe:
      'विश्लेषण र योजनामा उत्कृष्टता देखिनेछ। स्वास्थ्यमा ध्यान दिनुहोस्। विस्तारै अघि बढ्नुहोस्।',
    forecastEn:
      'Excellence in analysis and planning. Pay attention to health. Move forward gradually.',
    luckyNumber: 5,
    luckyColorNe: 'नीलो',
    luckyColorEn: 'Blue',
  },
  {
    slug: 'tula',
    nameNe: 'तुला',
    nameEn: 'Libra',
    symbol: '♎',
    forecastNe:
      'सन्तुलन र सद्भाव कायम राख्नुहोस्। सामाजिक सम्बन्धमा सुधार हुनेछ। सौन्दर्य र कलामा रुचि बढ्छ।',
    forecastEn:
      'Maintain balance and harmony. Improvement in social relations. Interest in beauty and art increases.',
    luckyNumber: 6,
    luckyColorNe: 'गुलाबी',
    luckyColorEn: 'Pink',
  },
  {
    slug: 'vrishchika',
    nameNe: 'वृश्चिक',
    nameEn: 'Scorpio',
    symbol: '♏',
    forecastNe: 'गहिरो विचार र अनुसन्धानमा सफलता। गोप्यियता कायम राख्नुहोस्। इच्छाशक्ति बलियो छ।',
    forecastEn: 'Success in deep thought and research. Maintain secrecy. Willpower is strong.',
    luckyNumber: 8,
    luckyColorNe: 'कालो',
    luckyColorEn: 'Black',
  },
  {
    slug: 'dhanu',
    nameNe: 'धनु',
    nameEn: 'Sagittarius',
    symbol: '♐',
    forecastNe:
      'यात्रा र सिकाइको अवसर मिल्नेछ। दर्शन र धर्ममा रुचि बढ्छ। आशावादी दृष्टिकोण राख्नुहोस्।',
    forecastEn:
      'Opportunity for travel and learning. Interest in philosophy and religion increases. Stay optimistic.',
    luckyNumber: 3,
    luckyColorNe: 'पहेंलो',
    luckyColorEn: 'Yellow',
  },
  {
    slug: 'makara',
    nameNe: 'मकर',
    nameEn: 'Capricorn',
    symbol: '♑',
    forecastNe:
      'करियरमा प्रगति र मान्यता मिल्नेछ। अनुशासन र मेहनतको फल पाउनुहुनेछ। व्यावसायिक सफलता।',
    forecastEn:
      'Progress and recognition in career. You will reap the fruit of discipline and hard work. Professional success.',
    luckyNumber: 8,
    luckyColorNe: 'खैरो',
    luckyColorEn: 'Brown',
  },
  {
    slug: 'kumbha',
    nameNe: 'कुम्भ',
    nameEn: 'Aquarius',
    symbol: '♒',
    forecastNe:
      'नवीन विचार र सामाजिक कार्यमा सफलता। मित्रहरूको सहयोग प्राप्त हुनेछ। सेवाभाव राख्नुहोस्।',
    forecastEn:
      'Success in innovative ideas and social work. Support from friends. Maintain a service mindset.',
    luckyNumber: 4,
    luckyColorNe: 'आकाशी',
    luckyColorEn: 'Sky Blue',
  },
  {
    slug: 'mina',
    nameNe: 'मीन',
    nameEn: 'Pisces',
    symbol: '♓',
    forecastNe:
      'सृजनशीलता र अन्तर्ज्ञान बलियो छ। कला र संगीतमा रुचि बढ्छ। भावनात्मक सन्तुलन राख्नुहोस्।',
    forecastEn:
      'Creativity and intuition are strong. Interest in art and music increases. Maintain emotional balance.',
    luckyNumber: 7,
    luckyColorNe: 'बैंगनी',
    luckyColorEn: 'Purple',
  },
]
