import type { ArticleBlock } from '@nagarikwatch/db'
import { h2, h3, list, p, quote, wordCount } from './_helpers'

type ExpandCtx = {
  slug: string
  titleNe: string
  titleEn?: string
  deckNe?: string
  deckEn?: string
  categorySlug: string
  reportingLocation?: string
}

const MIN_BODY_WORDS = 320

function pick<T>(arr: readonly T[], slug: string, salt = ''): T {
  let h = 0
  for (const c of slug + salt) h = (h * 31 + c.charCodeAt(0)) | 0
  return arr[Math.abs(h) % arr.length]!
}

function topicFromTitle(titleNe: string): string {
  return titleNe.split(/[:—–-]/)[0]?.trim() || titleNe
}

function stripGenericClosing(blocks: ArticleBlock[]): ArticleBlock[] {
  return blocks.filter((b) => {
    if (b.type !== 'paragraph' || !('text' in b)) return true
    return !b.text.includes('निरन्तर अनुगमन गरी पाठकमैत्री सार')
  })
}

function categoryVoice(categorySlug: string): string {
  const voices: Record<string, string> = {
    politics: 'राजनीति डेस्क',
    society: 'समाज डेस्क',
    business: 'बजार डेस्क',
    sports: 'खेलकुद डेस्क',
    entertainment: 'मनोरञ्जन डेस्क',
    world: 'अन्तर्राष्ट्रिय डेस्क',
    opinion: 'विचार डेस्क',
    literature: 'साहित्य डेस्क',
    technology: 'प्रविधि डेस्क',
    health: 'स्वास्थ्य डेस्क',
    education: 'शिक्षा डेस्क',
    interview: 'अन्तर्वार्ता डेस्क',
    'photo-story': 'फोटो डेस्क',
    video: 'भिडियो डेस्क',
    diaspora: 'विदेश डेस्क',
  }
  return voices[categorySlug] ?? 'समाचार डेस्क'
}

function backgroundParagraphs(
  ctx: ExpandCtx,
  topic: string,
  deck: string,
  place: string,
): ArticleBlock[] {
  const openers: Record<string, readonly string[]> = {
    politics: [
      `${place} — ${topic} विषयमा संघ र प्रदेश दुवै तहमा छलफल तीव्र भएका छन्। ${deck} नागरिक वाच ${categoryVoice(ctx.categorySlug)}का अनुसार यो मुद्दाले आगामी साता संसदीय र प्रदेशसभा कार्यसूचीमा पनि स्थान पाउन सक्छ।`,
      `संघीय संरचनामा नीति निर्णय धेरै चरणबाट गुज्रन्छ। ${topic} जस्ता विषयमा सत्तारूढ र विपक्षी दलबीचको भाषण मात्र होइन, समिति बैठक, प्रश्नोत्तर र कार्यान्वयन तालिकाले वास्तविक प्रभाव निर्धारण गर्छ।`,
      `पाठकका लागि महत्त्वपूर्ण कुरा यो हो: निर्णय कहिले गरिन्छ भन्ने मिति भन्दा पनि, त्यो निर्णयले वडा कार्यालय, अस्पताल र विद्यालयमा सेवा कसरी परिवर्तन गर्छ भन्ने स्पष्टता।`,
    ],
    society: [
      `${place} — ${topic} ले स्थानीय समुदायको दैनिक जीवनमा प्रत्यक्ष असर पारेको छ। ${deck} नागरिक वाच ${categoryVoice(ctx.categorySlug)}ले यातायात, बजार, स्वास्थ्य र विद्यालयसँग जोडिएका गुनासो संकलन गर्दा सेवा चाप बढेको देखिएको छ।`,
      `मनसुन र शहरी विस्तारले सामाजिक समस्या एकै ठाउँमा जम्मा हुँदै जान्छ। ${topic} को सन्दर्भमा स्थानीय तह, प्रदेश र संघको समन्वय नभए सामान्य नागरिकले दोहोरो झन्झट भोग्नुपर्छ।`,
      `समुदायका प्रतिनिधिले भनेका छन्: समस्या देखाउने मात्र होइन, समाधानको समयसीमा चाहिन्छ। नागरिक वाचले यो श्रृंखलामा प्रशासनिक प्रतिक्रिया र सेवा पुनर्स्थापनको प्रगति पनि ट्र्याक गर्नेछ।`,
    ],
    business: [
      `${place} — ${topic} ले बजारमा मूल्य, आपूर्ति र लगानी मनोविज्ञानमा असर पारेको छ। ${deck} नागरिक वाच ${categoryVoice(ctx.categorySlug)}का अनुसार साना व्यवसाय र उपभोक्ता दुवैले चाप महसुस गरेका छन्।`,
      `नेपाली अर्थतन्त्रमा घरेलु माग, वैदेशिक रोजगारी प्रवाह र आयात निर्भरता एकसाथ चल्छ। ${topic} जस्ता विषयले मुद्रास्फीति, ब्याजदर र रोजगारी अपेक्षामाथि प्रश्न उठाउँछ।`,
      `विश्लेषकहरू भन्छन्: संक्षिप्त समाचारले मूल्य बढ्यो भन्छ, तर पाठकलाई चाहिन्छ किन बढ्यो, कति समय रहन्छ र सरकारले के गर्न सक्छ भन्ने स्पष्टता।`,
    ],
    sports: [
      `${place} — ${topic} नेपाली खेलकुदको तयारी र प्रतिस्पर्धात्मकतासँग जोडिएको छ। ${deck} नागरिक वाच ${categoryVoice(ctx.categorySlug)}ले प्रशिक्षण, पूर्वाधार र खेलाडी कल्याणलाई एउटै फ्रेममा हेर्छ।`,
      `अन्तर्राष्ट्रिय प्रतियोगिता नजिकिँदा तयारीको गुणस्तरले नतिजा निर्धारण गर्छ। प्रशिक्षक, खेलाडी र संघका पदाधिकारीबीचको समन्वय कमजोर भए प्रदर्शनमा दीर्घकालीन असर पर्छ।`,
      `युवा खेलाडीका लागि मार्गचित्र स्पष्ट हुनु जरुरी छ। अभ्यास, पोषण, चोट व्यवस्थापन र मानसिक तयारी एकै योजनामा आउनुपर्छ।`,
    ],
    default: [
      `${place} — ${topic} विषयमा नागरिक वाच ${categoryVoice(ctx.categorySlug)}को टोली सक्रिय रहेको छ। ${deck}`,
      `यो रिपोर्टमा हामी घटनाको पृष्ठभूमि, मैदानमा देखिएका प्रमाण र आगामी सम्भावनालाई अलग-अलग राखेर प्रस्तुत गर्छौं।`,
      `पाठकले छिटो स्क्यान गर्न सक्ने सार र गहिरो पढाइ दुवै चाहिन्छ भन्ने हाम्रो सम्पादकीय सिद्धान्त हो।`,
    ],
  }

  const bank = openers[ctx.categorySlug] ?? openers.default!
  return [
    h2('पृष्ठभूमि'),
    p(pick(bank, ctx.slug, 'bg1')),
    p(pick(bank, ctx.slug, 'bg2')),
    p(pick(bank, ctx.slug, 'bg3')),
  ]
}

function fieldParagraphs(ctx: ExpandCtx, topic: string, place: string): ArticleBlock[] {
  const field: readonly string[] = [
    `${place} मैदानमा नागरिक वाच संवाददाताले देखेको छ: ${topic} सँग सम्बन्धित सूचना अझै पूर्ण रूपमा केन्द्रमा नपुगेको छ। स्थानीयले भनेका छन्, सूचना ढिला आउँदा अन्योल बढ्छ र अफवाह फैलिन्छ।`,
    `स्वयंसेवक, व्यापारी र सार्वजनिक सेवाकर्मीसँगको कुराकानीमा देखिएको छ: समस्या एक दिनमै समाधान हुँदैन, तर प्रतिक्रिया छिटो हुनुपर्छ। प्रशासनले के गरिरहेको छ भन्ने सार्वजनिक अपडेट नभए विश्वास घट्छ।`,
    `मैदान रिपोर्टिङमा हामी केवल एउटै स्रोतमा भर पर्दैनौं। दस्तावेज, सार्वजनिक बैठक, स्थानीय अभिलेख र प्रत्यक्ष अवलोकनलाई क्रस-चेक गर्छौं।`,
    `केही क्षेत्रमा सेवा केन्द्र खुल्दै गरे पनि पूर्ण क्षमतामा सञ्चालन हुन सकेका छैनन्। यसले ${topic} को प्रभाव लामो समयसम्म रहने संकेत दिन्छ।`,
    `स्थानीय स्तरमा समाधानको पहल देखिए पनि स्रोत र जिम्मेवारी स्पष्ट नभए गुनासो कायम रहन्छ।`,
  ]
  return [
    h2('मैदानबाट'),
    p(pick(field, ctx.slug, 'f1')),
    p(pick(field, ctx.slug, 'f2')),
    h3('संवादका मुख्य बुँदा'),
    list([
      pick(
        [
          'सूचना प्रवाहमा पारदर्शिता बढाउनुपर्छ',
          'अत्यावश्यक सेवामा प्राथमिकता दिनुपर्छ',
          'स्थानीय स्रोतसँग नियमित संवाद राख्नुपर्छ',
        ],
        ctx.slug,
        'b1',
      ),
      pick(
        [
          'दीर्घकालीन योजना छोटो घोषणासँग मेल खानुपर्छ',
          'विपद् प्रभावित क्षेत्रमा विशेष खण्ड चाहिन्छ',
          'डेटा सार्वजनिक गर्दा भाषा सरल हुनुपर्छ',
        ],
        ctx.slug,
        'b2',
      ),
      pick(
        [
          'नागरिक उजुरी सुनुवाइ समयमै हुनुपर्छ',
          'स्रोत विवरण प्रकाशनयोग्य हुनुपर्छ',
          'समुदायको सुझाव कार्ययोजनामा ठाउँ पाउनुपर्छ',
        ],
        ctx.slug,
        'b3',
      ),
    ]),
    p(pick(field, ctx.slug, 'f3')),
  ]
}

function analysisParagraphs(ctx: ExpandCtx, topic: string, deck: string): ArticleBlock[] {
  const analysis: readonly string[] = [
    `${topic} लाई केवल दिनको शीर्षक बनाउनु हुँदैन। यसको कारण, प्रभाव र सम्भावित समाधानलाई अलग-अलग मापन गर्नुपर्छ। ${deck}`,
    `विश्लेषणात्मक दृष्टिकोणबाट हेर्दा संस्थागत क्षमता र राजनीतिक इच्छाशक्ति दुवै निर्णायक हुन्छन्। कागजमा नीति राम्रो देखिन सक्छ, तर कार्यान्वयनमा कमजोरी भयो भने नतिजा देखिँदैन।`,
    `पाठकले सोध्न सक्छन्: यो समस्या नयाँ हो कि पुरानो संरचनागत कमजोरीको निरन्तरता? जवाफले समाधानको दिशा निर्धारण गर्छ।`,
    `सार्वजनिक बहसमा भावनात्मक अभिव्यक्ति बढ्दा तथ्य र सन्दर्भ कमजोर हुन सक्छ। नागरिक वाचले तथ्य, स्रोत र सन्दर्भलाई प्राथमिकता दिन्छ।`,
  ]
  return [
    h2('विश्लेषण'),
    p(pick(analysis, ctx.slug, 'a1')),
    p(pick(analysis, ctx.slug, 'a2')),
    quote(
      pick(
        [
          'समाचारले प्रश्न उठाउँछ, उत्तर दिने जिम्मेवारी संस्थामा रहन्छ।',
          'छिटो प्रतिक्रिया र दीर्घकालीन जवाफदेहिता दुवै चाहिन्छ।',
          'पाठकले सेवाको गति माप्न सक्ने डेटा हेर्न पाउनुपर्छ।',
        ],
        ctx.slug,
        'q',
      ),
      'नागरिक वाच सम्पादकीय नोट',
    ),
    p(pick(analysis, ctx.slug, 'a3')),
  ]
}

function outlookParagraphs(ctx: ExpandCtx, topic: string, place: string): ArticleBlock[] {
  const outlook: readonly string[] = [
    `आगामी साता ${topic} सम्बन्धमा नयाँ बैठक, प्रगति प्रतिवेदन वा नीति घोषणा आउन सक्छ। नागरिक वाचले प्रत्येक अपडेटलाई स्रोतसहित प्रकाशित गर्नेछ।`,
    `${place} र अन्य प्रभावित क्षेत्रमा सेवा पुनर्स्थापनको गति नै मुख्य सूचक बन्नेछ। ढिलाइ भयो भने समुदायमा असन्तोष बढ्ने अनुमान छ।`,
    `दीर्घकालमा यो विषय संस्थागत सुधार, बजेट विनियोजन र स्थानीय सहभागितासँग जोडिनुपर्छ। एकल घोषणाले मात्र पर्याप्त हुँदैन।`,
    `पाठकले यो कथा अनुसरण गर्दा तीन कुरा हेर्न सक्छन्: सेवा सुधारको प्रमाण, जवाफदेहिताको प्रक्रिया र समुदायको सहभागिता।`,
  ]
  return [
    h2('अब के हुने सम्भावना'),
    p(pick(outlook, ctx.slug, 'o1')),
    p(pick(outlook, ctx.slug, 'o2')),
    p(pick(outlook, ctx.slug, 'o3')),
  ]
}

function expandEnglishBody(ctx: ExpandCtx, deck: string): ArticleBlock[] {
  const topic = topicFromTitle(ctx.titleEn ?? ctx.titleNe)
  return [
    p(
      `Nagarik Watch reporting: ${deck} Our ${ctx.categorySlug} desk is tracking implementation, public statements, and on-the-ground impact.`,
    ),
    p(
      `${topic} is not a one-day headline. Readers need context on causes, who is accountable, and what changes in everyday services such as schools, clinics, and local offices.`,
    ),
    p(
      `We separate verified facts from speculation, cite sources where possible, and update the story as new documents, meetings, or service data become available.`,
    ),
    p(
      `Over the next week, watch for official timelines, committee hearings, and measurable service indicators rather than rhetoric alone.`,
    ),
    p(
      `Send corrections or local tips to the desk. This edition is original Nagarik Watch reporting for preview and editorial workflow demonstration.`,
    ),
  ]
}

/** Expand short seed bodies into full desk-length articles for layout preview. */
export function expandEditionBody(bodyNe: ArticleBlock[], ctx: ExpandCtx): ArticleBlock[] {
  if (wordCount(bodyNe) >= MIN_BODY_WORDS) return bodyNe

  const topic = topicFromTitle(ctx.titleNe)
  const deck = ctx.deckNe ?? ctx.titleNe
  const place = ctx.reportingLocation ?? 'काठमाडौं'
  const trimmed = stripGenericClosing(bodyNe)

  return [
    ...trimmed,
    ...backgroundParagraphs(ctx, topic, deck, place),
    ...fieldParagraphs(ctx, topic, place),
    ...analysisParagraphs(ctx, topic, deck),
    ...outlookParagraphs(ctx, topic, place),
    p(
      `${place}बाट नागरिक वाच ${categoryVoice(ctx.categorySlug)}को टोलीले यो विषयमा निरन्तर अनुगमन जारी राख्नेछ। अद्यावधिक, सुधार सुझाव र स्थानीय जानकारी सम्पादक@nagarikwatch.com मा पठाउन सकिन्छ।`,
    ),
  ]
}

export function expandEditionEnglish(
  bodyEn: ArticleBlock[] | undefined,
  ctx: ExpandCtx,
): ArticleBlock[] | undefined {
  const deck = ctx.deckEn ?? ctx.deckNe ?? ctx.titleNe
  if (!ctx.titleEn) return bodyEn
  if (bodyEn && wordCount(bodyEn) >= 120) return bodyEn
  return expandEnglishBody(ctx, deck)
}
