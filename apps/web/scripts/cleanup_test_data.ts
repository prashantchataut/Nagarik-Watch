/** Clean up test data from verification runs. */
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
  await db.deskPitch.deleteMany({ where: { headline: { contains: 'परीक्षण' } } })
  await db.deskPitch.deleteMany({ where: { headline: { contains: 'ब्राउजरबाट' } } })
  await db.reader.deleteMany({ where: { email: { in: ['reader@test.com', 'tikshna@test.com'] } } })
  await db.newsletterSubscriber.deleteMany({ where: { email: { in: ['sub@test.com'] } } })
  await db.session.deleteMany({})
  console.log('cleaned test data')
  await db.$disconnect()
}

main()
