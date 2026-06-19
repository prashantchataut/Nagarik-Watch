import type { Category } from '@nagarikwatch/db'

/**
 * Seed categories (content-model.md §2). The final list per PRODUCT.md: Politics, Society,
 * Business, Sports, Entertainment, World, Opinion, plus a catch-all Diaspora section. Slugs
 * are Latin (URL segment), labels are Devanagari-primary + English.
 */
export const categories: Category[] = [
  {
    id: 'cat-politics',
    slug: 'politics',
    nameNe: 'राजनीति',
    nameEn: 'Politics',
    descriptionNe: 'संसद्, सरकार, दल र नीतिगत विमर्शका समाचार र विश्लेषण।',
    descriptionEn: 'News and analysis from parliament, government, parties and policy.',
    navOrder: 1,
    showInNav: true,
  },
  {
    id: 'cat-society',
    slug: 'society',
    nameNe: 'समाज',
    nameEn: 'Society',
    descriptionNe: 'शिक्षा, स्वास्थ्य, समुदाय र दैनिक जीवनका समाचार।',
    descriptionEn: 'Education, health, community and the stories of everyday life.',
    navOrder: 2,
    showInNav: true,
  },
  {
    id: 'cat-business',
    slug: 'business',
    nameNe: 'बजार',
    nameEn: 'Business',
    descriptionNe: 'अर्थतन्त्र, बजार, लगानी र रोजगारीका समाचार।',
    descriptionEn: 'Economy, markets, investment and the jobs story.',
    navOrder: 3,
    showInNav: true,
  },
  {
    id: 'cat-sports',
    slug: 'sports',
    nameNe: 'खेलकुद',
    nameEn: 'Sports',
    descriptionNe: 'क्रिकेट, फुटबल र राष्ट्रिय तथा अन्तर्राष्ट्रिय खेलका समाचार।',
    descriptionEn: 'Cricket, football and national and international sport.',
    navOrder: 4,
    showInNav: true,
  },
  {
    id: 'cat-entertainment',
    slug: 'entertainment',
    nameNe: 'मनोरञ्जन',
    nameEn: 'Entertainment',
    descriptionNe: 'चलचित्र, संगीत र संस्कृतिका समाचार।',
    descriptionEn: 'Film, music and culture.',
    navOrder: 5,
    showInNav: true,
  },
  {
    id: 'cat-world',
    slug: 'world',
    nameNe: 'विश्व',
    nameEn: 'World',
    descriptionNe: 'विश्वभरका महत्त्वपूर्ण समाचार।',
    descriptionEn: 'The stories that matter from across the world.',
    navOrder: 6,
    showInNav: true,
  },
  {
    id: 'cat-opinion',
    slug: 'opinion',
    nameNe: 'विचार',
    nameEn: 'Opinion',
    descriptionNe: 'स्तम्भ, विश्लेषण र सम्पादकीय राय।',
    descriptionEn: 'Columns, analysis and editorial voices.',
    navOrder: 7,
    showInNav: true,
  },
  {
    id: 'cat-diaspora',
    slug: 'diaspora',
    nameNe: 'प्रवास',
    nameEn: 'Diaspora',
    descriptionNe: 'विदेशमा रहेका नेपालीहरूका समाचार र अनुभव।',
    descriptionEn: 'News and voices of Nepalis living abroad.',
    navOrder: 8,
    showInNav: false,
  },
]

/** Quick id -> category lookup used across the seed. */
export const categoryById = new Map(categories.map((c) => [c.id, c]))
export const categoryBySlug = new Map(categories.map((c) => [c.slug, c]))
