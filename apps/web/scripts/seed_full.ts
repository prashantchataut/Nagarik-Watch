/**
 * Seed the full newsroom demo state (idempotent):
 *   editor role, active poll + votes, breaking banner, one published CMS
 *   article (through the real pipeline), pageviews, a demo reader + comments.
 * Run: bun run scripts/seed_full.ts
 */
import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

function dayString(offsetDays: number): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - offsetDays)
  return d.toISOString().slice(0, 10)
}

async function main() {
  /* ---- roles: sushila = chief editor ---- */
  await db.journalist.update({
    where: { email: 'sushila@nagarikwatch.com' },
    data: { role: 'editor' },
  })
  console.log('role=editor → sushila@nagarikwatch.com')

  /* ---- poll of the day (one active) ---- */
  const existingPoll = await db.poll.findFirst({ where: { active: true } })
  if (!existingPoll) {
    const poll = await db.poll.create({
      data: {
        question: 'स्थानीय तहमा सेवा सुधारका लागि तपाईंको पहिलो प्राथमिकता के हो?',
        options: JSON.stringify([
          { id: 'a', label: 'स्वास्थ्य सेवा' },
          { id: 'b', label: 'शिक्षा गुणस्तर' },
          { id: 'c', label: 'सडक र खानेपानी' },
          { id: 'd', label: 'रोजगारी सिर्जना' },
        ]),
        active: true,
      },
    })
    const seedVotes: [string, number][] = [
      ['a', 214],
      ['b', 176],
      ['c', 259],
      ['d', 132],
    ]
    let i = 0
    for (const [optionId, count] of seedVotes) {
      for (let n = 0; n < count; n++) {
        await db.pollVote.create({
          data: { pollId: poll.id, optionId, voterKey: `seed-${optionId}-${i}-${n}` },
        })
      }
      i++
    }
    console.log('seeded poll +', seedVotes.reduce((s, [, c]) => s + c, 0), 'votes')
  }

  /* ---- breaking banner ---- */
  const breakingCount = await db.breakingNews.count({ where: { active: true } })
  if (breakingCount === 0) {
    await db.breakingNews.create({
      data: {
        textNe: 'मनसुन सक्रिय: कोशी र बागमती प्रदेशमा आजभोलि भारी वर्षाको सम्भावना — यातायातमा सतर्क रहनुहोस्',
        link: 'province',
        active: true,
      },
    })
    console.log('seeded breaking banner')
  }

  /* ---- demo reader + comments ---- */
  let reader = await db.reader.findUnique({ where: { email: 'demo.reader@nagarikwatch.com' } })
  if (!reader) {
    reader = await db.reader.create({
      data: {
        email: 'demo.reader@nagarikwatch.com',
        name: 'आर्यन श्रेष्ठ',
        passwordHash: hashPassword('demo1234'),
      },
    })
    console.log('seeded demo reader (demo.reader@ / demo1234)')
  }
  const commentCount = await db.comment.count({ where: { readerId: reader.id } })
  if (commentCount === 0) {
    await db.comment.createMany({
      data: [
        {
          storyKey: 'politics/provincial-alliance-realignment-2083',
          readerId: reader.id,
          authorName: reader.name,
          body: 'प्रदेश राजनीतिमा जनताको सेवा नै पहिलो हुनुपर्छ — गठबन्धन फेरबदलले सेवा नरोकियोस् भन्नेमा ध्यान दिनुहोला।',
          status: 'visible',
        },
        {
          storyKey: 'business/wholesale-inflation-fuel-cost-pressure',
          readerId: reader.id,
          authorName: reader.name,
          body: 'बजेट खर्चको मिति तालिका सार्वजनिक गर्ने अभ्यासले पारदर्शिता बढाउँछ। राम्रो विश्लेषण।',
          status: 'visible',
        },
      ],
    })
    console.log('seeded 2 demo comments')
  }

  /* ---- one published CMS article through the pipeline ---- */
  const manisha = await db.journalist.findUnique({ where: { email: 'manisha@nagarikwatch.com' } })
  const articleCount = await db.article.count()
  if (manisha && articleCount === 0) {
    const blocks = [
      { k: 'p', text: 'नागरिक वाच अनुसन्धान कक्षको अध्ययनले देखाएको छ — शनिबार–आइतबार दुई दिने साप्ताहिक बिदा लागू भएपछि सार्वजनिक कार्यालयमा आउने नागरिकको संख्या बढेको छ, तर सेवा घण्टा व्यवस्थापनमा चुनौती पनि थपिएको छ।' },
      { k: 'p', text: 'बिदाका दिन विरामी जाँच र अत्यावश्यक सेवा निरन्तर चल्ने व्यवस्था भए पनि जनचेतना अपर्याप्त रहेको अध्ययनमा उल्लेख छ। ग्रामीण क्षेत्रका नागरिकले भने हप्ताको बीचमा मात्र सेवा लिन सक्ने अवस्था सिर्जना भएको गुनासो गरेका छन्।' },
      { k: 'h2', text: 'तथ्यांकले के भन्छ' },
      { k: 'list', items: ['बिदा पछाडिको पहिलो कार्यदिनमा भीड ३०–४० प्रतिशतले बढेको', 'अत्यावश्यक सेवाका लागि कर्मचारी थप तालिम माग', 'अनलाइन सेवा विस्तारले भीड न्यून गर्न सहयोग गरेको'] },
      { k: 'quote', text: 'बिदा जनताको सुविधाका लागि हो, असुविधाका लागि होइन।' },
      { k: 'p', text: 'स्थानीय तहका प्रमुखहरूले भीड व्यवस्थापनका लागि फर्मवार सेवा र अगाडि बुक गर्ने प्रणाली लागू गर्न थालेका छन्। नागरिक वाचले यो अभ्यासको प्रभावकारिता आगामी दिनमा निरन्तर अनुगमन गर्नेछ।' },
    ]
    await db.article.create({
      data: {
        slug: 'two-day-weekend-public-service-impact-2083',
        desk: 'society',
        titleNe: 'दुई दिने साप्ताहिक बिदापछि सार्वजनिक सेवाको गति: अनुभव र चुनौती',
        titleEn: 'Two-day weekend: public services adapt, citizens adjust',
        deckNe: 'शनिबार–आइतबार बिदा लागू भएपछि सेवा वितरणको गति र नागरिक अनुभवमा आएको परिवर्तनको जगेडा।',
        deckEn: 'How Nepal\'s two-day weekend is reshaping citizen experience of public services.',
        bodyNe: JSON.stringify(blocks),
        bodyEn: JSON.stringify([
          { k: 'p', text: 'Nagarik Watch desk reporting: since the two-day weekend took effect, service counters report higher footfall on working days, while essential services continue through weekends with thinner staffing.' },
          { k: 'p', text: 'Local governments are responding with appointment systems and expanded online services to smooth the peaks.' },
        ]),
        hero: '/photos/desks/society.jpg',
        tags: JSON.stringify(['सार्वजनिक सेवा', 'साप्ताहिक बिदा']),
        status: 'published',
        authorId: manisha.id,
        publishedAt: new Date(),
        views: 47,
      },
    })
    console.log('seeded published CMS article (society desk)')
  }

  /* ---- pageviews for trending (7 days, modest honest demo counts) ---- */
  const trendingSeeds: [string, number][] = [
    ['politics/provincial-alliance-realignment-2083', 38],
    ['business/wholesale-inflation-fuel-cost-pressure', 31],
    ['sports/national-cricket-training-camp-focus', 27],
    ['society/two-day-weekend-public-service-impact-2083', 22],
    ['world/west-asia-energy-shock-nepal-lens', 18],
    ['opinion/federalism-accountability-column', 15],
    ['technology/digital-id-public-services', 12],
    ['entertainment/nepali-film-festival-prep', 10],
  ]
  for (const [key, base] of trendingSeeds) {
    for (let d = 0; d < 7; d++) {
      const count = Math.max(1, Math.round((base / 7) * (0.6 + Math.random() * 0.8)))
      const day = dayString(d)
      const existing = await db.pageview.findUnique({
        where: { storyKey_day: { storyKey: key, day } },
      })
      if (!existing) {
        await db.pageview.create({ data: { storyKey: key, day, count } })
      }
    }
  }
  console.log('seeded 7-day pageviews for trending')

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
