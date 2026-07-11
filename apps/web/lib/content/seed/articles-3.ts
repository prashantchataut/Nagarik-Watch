import type { Article } from '@nagarikwatch/db'
import { categoryBySlug } from './categories'
import { authors } from './authors'
import { placeholder } from './media'

const author = authors[0]!
const published = '2026-07-10T06:00:00.000Z'

type SeedInput = {
  category: string
  slug: string
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  label: string
  breaking?: boolean
}

const inputs: SeedInput[] = [
  { category: 'politics', slug: 'how-a-bill-moves-through-parliament', titleNe: 'संसद्मा विधेयक कसरी अघि बढ्छ?', titleEn: 'How a bill moves through Parliament', deckNe: 'दर्तादेखि प्रमाणीकरणसम्मको प्रक्रिया सरल भाषामा।', deckEn: 'A plain-language guide from registration to authentication.', label: 'संसदीय प्रक्रिया' },
  { category: 'politics', slug: 'local-budget-reader-guide', titleNe: 'स्थानीय बजेट पढ्दा नागरिकले हेर्नुपर्ने पाँच कुरा', titleEn: 'Five things citizens should check in a local budget', deckNe: 'आम्दानी, खर्च, प्राथमिकता, कार्यान्वयन र सार्वजनिक जवाफदेहिता बुझ्ने तरिका।', deckEn: 'How to read revenue, spending, priorities, delivery and accountability.', label: 'स्थानीय बजेट' },
  { category: 'society', slug: 'community-water-safety-checklist', titleNe: 'समुदायको खानेपानी सुरक्षित छ कि छैन कसरी जाँच्ने?', titleEn: 'How to check whether community drinking water is safe', deckNe: 'स्रोत, भण्डारण, परीक्षण र स्थानीय निकायसँग समन्वयको व्यावहारिक सूची।', deckEn: 'A practical checklist for sources, storage, testing and local coordination.', label: 'खानेपानी सुरक्षा' },
  { category: 'society', slug: 'public-service-complaint-guide', titleNe: 'सार्वजनिक सेवा ढिलो हुँदा उजुरी कहाँ र कसरी गर्ने?', titleEn: 'Where and how to complain when a public service is delayed', deckNe: 'प्रमाण राख्ने, जिम्मेवार कार्यालय पहिचान गर्ने र जवाफ माग्ने चरण।', deckEn: 'Steps for keeping evidence, finding the responsible office and seeking a response.', label: 'नागरिक सेवा' },
  { category: 'business', slug: 'household-budget-basics-nepal', titleNe: 'घरायसी बजेट बनाउने सरल तरिका', titleEn: 'A simple way to build a household budget', deckNe: 'आवश्यक खर्च, बचत, ऋण र आकस्मिक कोषलाई एउटै योजनामा राख्ने विधि।', deckEn: 'A practical method for essentials, savings, debt and emergency funds.', label: 'घरायसी बजेट' },
  { category: 'business', slug: 'small-business-cashflow-guide', titleNe: 'सानो व्यवसायमा नगद प्रवाह किन महत्त्वपूर्ण हुन्छ?', titleEn: 'Why cash flow matters in a small business', deckNe: 'बिक्री र नाफामात्र होइन, पैसा कहिले भित्रिन्छ र बाहिरिन्छ भन्ने बुझाइ।', deckEn: 'Why timing of money in and out matters beyond sales and profit.', label: 'नगद प्रवाह' },
  { category: 'sports', slug: 'football-scorecard-explainer', titleNe: 'फुटबल स्कोरकार्डका मुख्य संकेत कसरी बुझ्ने?', titleEn: 'How to read the key signals in a football scorecard', deckNe: 'समय, अवस्था, अतिरिक्त समय र प्रतियोगिता चरणको स्पष्ट व्याख्या।', deckEn: 'A clear guide to time, status, stoppage time and competition stages.', label: 'फुटबल व्याख्या' },
  { category: 'sports', slug: 'cricket-score-basics', titleNe: 'क्रिकेट स्कोर बुझ्न सुरु गर्ने आधार', titleEn: 'The basics of reading a cricket score', deckNe: 'रन, विकेट, ओभर, लक्ष्य र रनरेटको छोटो मार्गदर्शिका।', deckEn: 'A short guide to runs, wickets, overs, targets and run rate.', label: 'क्रिकेट स्कोर' },
  { category: 'entertainment', slug: 'how-film-reviews-are-written', titleNe: 'फिल्म समीक्षा लेख्दा के मूल्यांकन गरिन्छ?', titleEn: 'What a film review evaluates', deckNe: 'कथा, अभिनय, दृश्य भाषा, ध्वनि र सामाजिक सन्दर्भलाई छुट्टाछुट्टै हेर्ने तरिका।', deckEn: 'How story, performance, visual language, sound and context are assessed.', label: 'फिल्म समीक्षा' },
  { category: 'entertainment', slug: 'music-credit-reader-guide', titleNe: 'गीतको श्रेय सूची किन पढ्नुपर्छ?', titleEn: 'Why music credits are worth reading', deckNe: 'गायकमात्र होइन, गीतकार, संगीतकार, एरेन्जर र प्राविधिक टोलीको भूमिका।', deckEn: 'The roles of writers, composers, arrangers and technicians beyond the singer.', label: 'संगीत श्रेय' },
  { category: 'world', slug: 'reading-international-news-carefully', titleNe: 'अन्तर्राष्ट्रिय समाचार पढ्दा स्रोत कसरी जाँच्ने?', titleEn: 'How to check sources in international news', deckNe: 'समाचार एजेन्सी, स्थानीय रिपोर्टर, आधिकारिक वक्तव्य र स्वतन्त्र पुष्टि छुट्याउने तरिका।', deckEn: 'How to distinguish agencies, local reporters, official statements and independent confirmation.', label: 'विश्व समाचार' },
  { category: 'world', slug: 'time-zone-news-explainer', titleNe: 'विश्व समाचारमा मिति र समय किन फरक देखिन्छ?', titleEn: 'Why dates and times differ in world news', deckNe: 'समय क्षेत्र, प्रकाशन समय र घटनाको स्थानीय समय बुझ्ने सरल विधि।', deckEn: 'A simple guide to time zones, publication time and local event time.', label: 'समय क्षेत्र' },
  { category: 'opinion', slug: 'what-makes-a-good-public-debate', titleNe: 'सार्वजनिक बहसलाई उपयोगी बनाउने आधार', titleEn: 'What makes a public debate useful', deckNe: 'तथ्य, मत, असहमति र व्यक्तिगत आक्रमणबीचको सीमा।', deckEn: 'The line between facts, opinions, disagreement and personal attacks.', label: 'सार्वजनिक बहस' },
  { category: 'opinion', slug: 'why-corrections-build-trust', titleNe: 'सच्याइले पत्रकारिताको विश्वास किन बढाउँछ?', titleEn: 'Why corrections strengthen trust in journalism', deckNe: 'त्रुटि स्वीकार्नु कमजोरी होइन, जिम्मेवार सम्पादनको प्रमाण हो।', deckEn: 'Owning errors is evidence of accountable editing, not weakness.', label: 'सच्याइ र विश्वास' },
  { category: 'literature', slug: 'build-a-daily-reading-habit', titleNe: 'दैनिक पढ्ने बानी बसाल्ने सात उपाय', titleEn: 'Seven ways to build a daily reading habit', deckNe: 'सानो समय, स्पष्ट सूची र ध्यान विचलन कम गर्ने व्यावहारिक योजना।', deckEn: 'A practical plan using short sessions, clear lists and fewer distractions.', label: 'पढ्ने बानी' },
  { category: 'literature', slug: 'how-to-read-a-poem-slowly', titleNe: 'कविता बिस्तारै पढ्दा के देखिन्छ?', titleEn: 'What becomes visible when a poem is read slowly', deckNe: 'लय, बिम्ब, विराम र शब्दको दोहोरो अर्थ टिप्ने अभ्यास।', deckEn: 'A practice for noticing rhythm, imagery, pauses and layered meaning.', label: 'कविता पढाइ' },
  { category: 'technology', slug: 'protect-your-online-accounts', titleNe: 'अनलाइन खाता सुरक्षित राख्ने आधारभूत उपाय', titleEn: 'Basic steps to protect online accounts', deckNe: 'बलियो पासवर्ड, दुई चरणीय प्रमाणीकरण र फिसिङ पहिचानको सरल सूची।', deckEn: 'A simple checklist for strong passwords, two-factor authentication and phishing awareness.', label: 'डिजिटल सुरक्षा' },
  { category: 'technology', slug: 'check-app-permissions', titleNe: 'मोबाइल एपको अनुमति किन जाँच्नुपर्छ?', titleEn: 'Why mobile app permissions should be reviewed', deckNe: 'क्यामेरा, माइक्रोफोन, स्थान र सम्पर्क सूचीमा पहुँच सीमित गर्ने तरिका।', deckEn: 'How to limit access to camera, microphone, location and contacts.', label: 'एप अनुमति' },
  { category: 'health', slug: 'read-a-medicine-label', titleNe: 'औषधिको लेबल पढ्दा ध्यान दिनुपर्ने कुरा', titleEn: 'What to check on a medicine label', deckNe: 'नाम, मात्रा, म्याद, प्रयोग विधि र चेतावनीबारे आधारभूत जानकारी।', deckEn: 'The basics of names, dosage, expiry, directions and warnings.', label: 'औषधि लेबल' },
  { category: 'health', slug: 'when-to-seek-urgent-care', titleNe: 'कुन लक्षणमा तुरुन्त स्वास्थ्य सेवा लिनुपर्छ?', titleEn: 'Which symptoms require urgent medical attention', deckNe: 'आपतकालीन संकेत पहिचान गर्ने सामान्य जानकारी, व्यक्तिगत निदान होइन।', deckEn: 'General information for recognising urgent warning signs, not a personal diagnosis.', label: 'आपतकालीन स्वास्थ्य' },
  { category: 'education', slug: 'scholarship-application-checklist', titleNe: 'छात्रवृत्ति आवेदनअघि तयार गर्नुपर्ने कागजात', titleEn: 'Documents to prepare before a scholarship application', deckNe: 'समयसीमा, प्रमाणपत्र, सिफारिस, निबन्ध र बजेट योजना व्यवस्थित गर्ने सूची।', deckEn: 'A checklist for deadlines, certificates, references, essays and budgets.', label: 'छात्रवृत्ति आवेदन' },
  { category: 'education', slug: 'verify-exam-result-notices', titleNe: 'परीक्षा नतिजाको सूचना आधिकारिक हो कि होइन कसरी जाँच्ने?', titleEn: 'How to verify whether an exam-result notice is official', deckNe: 'बोर्डको वेबसाइट, सूचना नम्बर र प्रकाशन मिति मिलाउने तरिका।', deckEn: 'How to cross-check the board website, notice number and publication date.', label: 'नतिजा पुष्टि' },
  { category: 'interview', slug: 'how-editors-verify-a-tip', titleNe: 'अन्तर्वार्ता: न्यूजरुमले समाचार टिप कसरी प्रमाणित गर्छ?', titleEn: 'Interview: How a newsroom verifies a story tip', deckNe: 'स्रोतको पहिचान, कागजात, प्रतिपक्ष र सार्वजनिक हितको जाँच।', deckEn: 'Checking source identity, documents, responses and public interest.', label: 'सम्पादकीय प्रश्नोत्तर' },
  { category: 'interview', slug: 'community-radio-public-service', titleNe: 'अन्तर्वार्ता: समुदायमा रेडियोको सार्वजनिक सेवा भूमिका', titleEn: 'Interview: The public-service role of community radio', deckNe: 'स्थानीय सूचना, विपद् सन्देश र नागरिक आवाजबारे प्रश्नोत्तर।', deckEn: 'A conversation about local information, emergency messages and citizen voices.', label: 'समुदाय रेडियो' },
  { category: 'photo-story', slug: 'market-before-opening-photo-story', titleNe: 'फोटो कथा: बजार खुल्नुअघिको एक घण्टा', titleEn: 'Photo story: The hour before a market opens', deckNe: 'सरसफाइ, ढुवानी, सामान मिलाउने काम र पहिलो ग्राहकको प्रतीक्षा।', deckEn: 'Cleaning, deliveries, arranging goods and waiting for the first customer.', label: 'बिहानको बजार' },
  { category: 'photo-story', slug: 'public-library-afternoon', titleNe: 'फोटो कथा: सार्वजनिक पुस्तकालयको एक दिउँसो', titleEn: 'Photo story: An afternoon at a public library', deckNe: 'विद्यार्थी, पाठक, पुस्तक र शान्त साझा स्थानका दृश्य।', deckEn: 'Students, readers, books and the quiet life of a shared public space.', label: 'सार्वजनिक पुस्तकालय' },
  { category: 'video', slug: 'earthquake-alert-video-explainer', titleNe: 'भिडियो व्याख्या: भूकम्पको सूचना आएपछि के गर्ने?', titleEn: 'Video explainer: What to do after an earthquake alert', deckNe: 'सुरक्षित स्थान, परिवार सम्पर्क र आधिकारिक सूचनाको छोटो मार्गदर्शन।', deckEn: 'A short guide to safety, family contact and official information.', label: 'भूकम्प सूचना' },
  { category: 'video', slug: 'date-converter-video-guide', titleNe: 'भिडियो गाइड: विक्रम संवत् र इस्वी संवत् मिति रूपान्तरण', titleEn: 'Video guide: Converting BS and AD dates', deckNe: 'मिति रूपान्तरण उपकरण प्रयोग गर्ने स्पष्ट चरण।', deckEn: 'Clear steps for using the date-conversion utility.', label: 'मिति रूपान्तरण' },
  { category: 'diaspora', slug: 'verify-overseas-job-offer', titleNe: 'वैदेशिक रोजगारीको प्रस्ताव जाँच्ने आधार', titleEn: 'How to check an overseas job offer', deckNe: 'इजाजत, सम्झौता, लागत, सम्पर्क र आधिकारिक रेकर्ड मिलाउने सूची।', deckEn: 'A checklist for licences, contracts, costs, contacts and official records.', label: 'वैदेशिक रोजगारी' },
  { category: 'diaspora', slug: 'send-documents-home-safely', titleNe: 'विदेशबाट कागजात सुरक्षित रूपमा घर पठाउने तरिका', titleEn: 'How to send important documents home safely', deckNe: 'प्रतिलिपि, ट्र्याकिङ, गोपनीयता र प्राप्तिको पुष्टि गर्ने अभ्यास।', deckEn: 'Practical steps for copies, tracking, privacy and proof of receipt.', label: 'सुरक्षित कागजात' },
]

export const serviceArticles: Article[] = inputs.map((input, index) => {
  const category = categoryBySlug.get(input.category)!
  const date = new Date(Date.parse(published) - index * 55 * 60_000).toISOString()
  return {
    id: `service-${input.category}-${index + 1}`,
    slug: input.slug,
    category,
    categoryLabel: category.nameNe,
    titleNe: input.titleNe,
    titleEn: input.titleEn,
    deckNe: input.deckNe,
    deckEn: input.deckEn,
    heroImage: placeholder(input.slug, input.category, input.label, input.titleNe),
    byline: author.name,
    authors: [{ id: author.id, slug: author.slug, name: author.name }],
    publishedAt: date,
    hasEnglish: true,
    isBreaking: Boolean(input.breaking),
    readingMinutes: 3,
    bodyNe: [
      { type: 'paragraph', text: input.deckNe },
      { type: 'paragraph', text: 'यो सामग्री सार्वजनिक हितका लागि तयार गरिएको व्याख्यात्मक मार्गदर्शिका हो। निर्णय गर्नुअघि सम्बन्धित आधिकारिक निकाय, विज्ञ वा मूल कागजातसँग जानकारी पुष्टि गर्नुहोस्।' },
      { type: 'heading2', text: 'मुख्य जाँचसूची' },
      { type: 'list', ordered: true, items: ['मूल स्रोत र प्रकाशन मिति जाँच्नुहोस्।', 'सम्बन्धित कागजात वा आधिकारिक विवरण सुरक्षित राख्नुहोस्।', 'अस्पष्ट जानकारीमा अनुमान नगरी जिम्मेवार निकायसँग पुष्टि गर्नुहोस्।'] },
      { type: 'paragraph', text: 'नागरिक वाचले तथ्य, स्रोत र सुधार प्रक्रियालाई स्पष्ट राख्ने सम्पादकीय नीति अपनाउँछ।' },
    ],
    bodyEn: [
      { type: 'paragraph', text: input.deckEn },
      { type: 'paragraph', text: 'This public-interest explainer is a practical starting point. Confirm important decisions with the responsible authority, a qualified professional or the original document.' },
      { type: 'heading2', text: 'Core checklist' },
      { type: 'list', ordered: true, items: ['Check the original source and publication date.', 'Keep the relevant document or official reference.', 'When information is unclear, verify it instead of guessing.'] },
    ],
    tags: [],
    commentsEnabled: true,
  }
})
