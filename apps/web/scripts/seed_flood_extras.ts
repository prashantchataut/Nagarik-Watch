/** Seed flood-story pageviews + breaking banner + read log demo. */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  const keys: [string, number][] = [
    ['disaster/bhote-koshi-glacial-flood-death-toll-2083', 96],
    ['disaster/rasuwagadhi-checkpoint-destroyed-border-trade-2083', 71],
    ['disaster/children-impacted-flood-rasuwa-nuwakot-dhading-2083', 54],
    ['disaster/monsoon-disaster-season-7500-events-35-districts-2083', 44],
    ['fact-check/fake-videos-flood-misinformation-factcheck-2083', 39],
    ['disaster/flood-rescue-relief-operation-army-intl-2083', 33],
    ['disaster/glacial-lake-outburst-risk-climate-explainer-2083', 29],
  ]
  for (const [key, base] of keys) {
    for (let i = 0; i < 5; i++) {
      const d = new Date()
      d.setUTCDate(d.getUTCDate() - i)
      const day = d.toISOString().slice(0, 10)
      const count = Math.max(1, Math.round(base * (1 - i * 0.18)))
      await db.pageview.upsert({
        where: { storyKey_day: { storyKey: key, day } },
        create: { storyKey: key, day, count },
        update: { count },
      })
    }
  }
  console.log('seeded flood pageviews')

  const active = await db.breakingNews.findFirst({ where: { active: true } })
  if (!active) {
    await db.breakingNews.create({
      data: {
        textNe: 'भोटेकोशी बाढी: मृत्यु ४६९ पुग्यो, १५०० बेपत्ता — विपद् केन्द्रमा ताजा अद्यावधिक',
        link: '/disaster',
      },
    })
    console.log('seeded flood breaking banner')
  }

  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
