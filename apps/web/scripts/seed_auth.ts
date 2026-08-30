/**
 * Seed demo newsroom (journalist) accounts + verify reader flow works.
 * Run: bun run scripts/seed_auth.ts
 */
import { PrismaClient } from '@prisma/client'
import { scryptSync, randomBytes } from 'node:crypto'

const db = new PrismaClient()

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

const JOURNALISTS = [
  {
    email: 'sushila@nagarikwatch.com',
    name: 'सुशीला शर्मा',
    desk: 'politics',
    bio: 'संसद् र प्रदेश राजनीतिका लामो समय देखि संवाददाता।',
    password: 'demo1234',
  },
  {
    email: 'rajesh@nagarikwatch.com',
    name: 'राजेश थापा',
    desk: 'business',
    bio: 'अर्थतन्त्र, नेप्से र बजार विश्लेषणका लागि जिम्मेवार।',
    password: 'demo1234',
  },
  {
    email: 'manisha@nagarikwatch.com',
    name: 'मनिषा गुरागाईं',
    desk: 'opinion',
    bio: 'सम्पादकीय र स्तम्भ डेस्क।',
    password: 'demo1234',
  },
]

async function main() {
  for (const j of JOURNALISTS) {
    await db.journalist.upsert({
      where: { email: j.email },
      update: { name: j.name, desk: j.desk, bio: j.bio, active: true },
      create: {
        email: j.email,
        name: j.name,
        desk: j.desk,
        bio: j.bio,
        active: true,
        passwordHash: hashPassword(j.password),
      },
    })
    console.log('seeded journalist:', j.email)
  }
  // A sample pitch for the opinion journalist so the desk demo isn't empty
  const manisha = await db.journalist.findUnique({ where: { email: 'manisha@nagarikwatch.com' } })
  if (manisha) {
    const existing = await db.deskPitch.count({ where: { journalistId: manisha.id } })
    if (existing === 0) {
      await db.deskPitch.create({
        data: {
          journalistId: manisha.id,
          headline: 'शनिबार–आइतबार बिदापछि सेवा वितरणको गति',
          desk: 'opinion',
          summary: 'दुई दिने साप्ताहिक बिदा लागू भएपछि सार्वजनिक कार्यालयको सेवा वितरणमा परेको प्रभावबारे स्तम्भ।',
          body: 'वि.सं. २०८२ साउनदेखि लागू भएको शनिबार–आइतबार बिदाले नागरिकको सेवा अनुभव कसरी बदल्यो, त्यसको विश्लेषण।',
          status: 'in_review',
          editorNote: 'मिति र तथ्यांक थप्नुहोला — सम्पादक',
        },
      })
      console.log('seeded sample pitch for', manisha.name)
    }
  }
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
