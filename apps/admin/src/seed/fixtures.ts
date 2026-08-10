import type { ArticleBlock } from '@nagarikwatch/db'

export type DemoArticleFixture = {
  slug: string
  categorySlug: string
  authorSlug: string
  titleNe: string
  titleEn: string
  deckNe: string
  deckEn: string
  bodyNe: ArticleBlock[]
  bodyEn: ArticleBlock[]
  tagSlugs: string[]
}

/**
 * Explicitly non-production fixtures for layout and workflow testing.
 *
 * They contain no current-affairs claims, quotations, invented people, or
 * publication-ready reporting. The seed command always stores them as drafts,
 * no-indexes them, excludes them from recommendations/news sitemaps, and
 * prefixes their titles with DEMO.
 */
export const demoArticleFixtures: DemoArticleFixture[] = [
  {
    slug: 'demo-source-verification-workflow',
    categorySlug: 'technology',
    authorSlug: 'fact-check-desk',
    titleNe: '[डेमो] अनलाइन दाबी जाँच्दा अपनाइने पाँच चरण',
    titleEn: '[DEMO] Five steps for checking an online claim',
    deckNe:
      'समाचार कक्षको स्रोत जाँच, समयरेखा र प्रमाण अभिलेख परीक्षण गर्न बनाइएको गैर-प्रकाशनीय सामग्री।',
    deckEn: 'A non-publishable fixture for testing source checks, timelines and evidence records.',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'यो डेमो सामग्री हो। यसमा कुनै वास्तविक घटना, व्यक्ति वा वर्तमान दाबीबारे रिपोर्टिङ गरिएको छैन।',
      },
      { type: 'heading2', text: 'परीक्षण चरण' },
      {
        type: 'list',
        ordered: true,
        items: [
          'मूल दाबी सुरक्षित गर्ने',
          'प्राथमिक स्रोत खोज्ने',
          'मिति र स्थान मिलाउने',
          'दोस्रो स्वतन्त्र स्रोत जाँच्ने',
          'सम्पादकीय निर्णय अभिलेख गर्ने',
        ],
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'This is demo content. It does not report on a real event, person or current claim.',
      },
      { type: 'heading2', text: 'Test workflow' },
      {
        type: 'list',
        ordered: true,
        items: [
          'Preserve the original claim',
          'Find the primary source',
          'Check date and location',
          'Check a second independent source',
          'Record the editorial decision',
        ],
      },
    ],
    tagSlugs: ['public-interest'],
  },
  {
    slug: 'demo-data-story-method-note',
    categorySlug: 'technology',
    authorSlug: 'data-desk',
    titleNe: '[डेमो] डाटा कथामा पद्धति नोट कसरी देखिन्छ',
    titleEn: '[DEMO] How a methodology note appears in a data story',
    deckNe: 'तालिका, स्रोत र सीमितता प्रदर्शन गर्ने गैर-प्रकाशनीय लेआउट परीक्षण।',
    deckEn: 'A non-publishable layout test for tables, sources and limitations.',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'यो सामग्री डाटा कथा टेम्प्लेट परीक्षण गर्न मात्र प्रयोग हुन्छ। यहाँ कुनै वास्तविक तथ्यांक प्रस्तुत गरिएको छैन।',
      },
      { type: 'heading2', text: 'पद्धति' },
      {
        type: 'paragraph',
        text: 'उत्पादन सामग्रीमा स्रोत, सङ्कलन मिति, परिभाषा, सफाइ प्रक्रिया र सीमितता स्पष्ट लेखिनुपर्छ।',
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'This fixture only tests the data-story template. It contains no real dataset.',
      },
      { type: 'heading2', text: 'Method' },
      {
        type: 'paragraph',
        text: 'Production work must state the source, collection date, definitions, cleaning steps and limitations.',
      },
    ],
    tagSlugs: ['data-story'],
  },
  {
    slug: 'demo-reader-tip-review',
    categorySlug: 'society',
    authorSlug: 'reader-desk',
    titleNe: '[डेमो] पाठक सूचनाबाट समाचार बनाउने सम्पादकीय मार्ग',
    titleEn: '[DEMO] Editorial path from reader tip to story',
    deckNe: 'पाठक सूचना, सहमति, प्रमाण र गोपनीयता अवस्थाको परीक्षण सामग्री।',
    deckEn: 'A fixture for testing reader-tip consent, evidence and confidentiality states.',
    bodyNe: [
      {
        type: 'paragraph',
        text: 'यो वास्तविक पाठक सूचना होइन। फारमदेखि सम्पादकीय समीक्षासम्मको प्रणाली परीक्षण गर्न बनाइएको नमुना हो।',
      },
      { type: 'heading2', text: 'सम्पादकीय जाँच' },
      {
        type: 'list',
        ordered: false,
        items: [
          'सम्पर्क र सहमति पुष्टि',
          'प्रमाण सुरक्षित राख्ने',
          'हित र जोखिम मूल्याङ्कन',
          'स्वतन्त्र पुष्टि',
          'प्रकाशन वा अस्वीकृतिको कारण अभिलेख',
        ],
      },
    ],
    bodyEn: [
      {
        type: 'paragraph',
        text: 'This is not a real reader tip. It tests the system from submission through editorial review.',
      },
      { type: 'heading2', text: 'Editorial checks' },
      {
        type: 'list',
        ordered: false,
        items: [
          'Confirm contact and consent',
          'Preserve evidence',
          'Assess public interest and risk',
          'Seek independent verification',
          'Record the publication decision',
        ],
      },
    ],
    tagSlugs: ['reader-submission'],
  },
]
