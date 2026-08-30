/** लाइभ स्कोर — demo fixtures for the live-scores page. Clearly labelled demo. */

export interface ScoreItem {
  sportNe: string
  leagueNe: string
  teamA: string
  teamB: string
  scoreA: string
  scoreB: string
  statusNe: string
  statusEn: 'live' | 'upcoming' | 'done'
  detailNe: string
}

export const liveScores: ScoreItem[] = [
  {
    sportNe: 'क्रिकेट',
    leagueNe: 'नेपाल राष्ट्रिय लिग · टी-२०',
    teamA: 'नेपाल आर्मी क्लब',
    teamB: 'प्रहरी क्लब',
    scoreA: '१५८/६ (२० ओभर)',
    scoreB: '११२/४ (१४.२ ओभर)',
    statusNe: 'लाइभ',
    statusEn: 'live',
    detailNe: 'प्रहरीलाई ४७ रन चाहिन्याछ · प्रहरी ६ विकेट बाँकी',
  },
  {
    sportNe: 'क्रिकेट',
    leagueNe: 'एसीसी प्रिमियर कप · तयारी',
    teamA: 'नेपाल',
    teamB: 'ओमान',
    scoreA: '—',
    scoreB: '—',
    statusNe: 'आज बिहान ९:३० बजे',
    statusEn: 'upcoming',
    detailNe: 'किर्तिपुर स्टेडियम · टस काठमाडौं समय ९:०० बजे',
  },
  {
    sportNe: 'फुटबल',
    leagueNe: 'आठौँ राष्ट्रिय खेलकुद · पुरुष',
    teamA: 'बागमती प्रदेश',
    teamB: 'कोशी प्रदेश',
    scoreA: '२',
    scoreB: '१',
    statusNe: 'समाप्त',
    statusEn: 'done',
    detailNe: 'गोल: सुबाश (३९\'), रोशन (६७\') / अमित (८१\')',
  },
  {
    sportNe: 'फुटबल',
    leagueNe: 'मार्टिर लिग',
    teamA: 'एपीएफ क्लब',
    teamB: 'मछिन्द्रा क्लब',
    scoreA: '०',
    scoreB: '१',
    statusNe: '६८ मिनेट',
    statusEn: 'live',
    detailNe: 'दशरथ रंगशाला · मछिन्द्राका लागि गोल युवराज बास्केट (५२\')',
  },
  {
    sportNe: 'भलिबल',
    leagueNe: 'राष्ट्रिय महिला च्याम्पियनसिप',
    teamA: 'गण्डकी प्रदेश',
    teamB: 'सुदूरपश्चिम प्रदेश',
    scoreA: '२',
    scoreB: '१',
    statusNe: 'चौथो सेट',
    statusEn: 'live',
    detailNe: 'सेट स्कोर: २५-२३, १९-२५, २५-२१, १४-१२ (चालु)',
  },
]

export const scoreBoardNote = 'यो पानो प्राविधिक प्रदर्शनका लागि तयार पारिएको नमूना डाटा हो — यसलाई वास्तविक प्रतियोगिताको आधिकारिक स्कोर मान्नु हुँदैन।'
