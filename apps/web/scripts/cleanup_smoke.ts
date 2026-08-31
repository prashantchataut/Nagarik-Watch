/**
 * Clean smoke-test artifacts (keep seeded demo content).
 * Run: bun run scripts/cleanup_smoke.ts
 */
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  // Remove smoke-test reader + their comments/bookmarks/votes (cascade)
  const smoke = await db.reader.findUnique({ where: { email: 'smoke.test.reader@example.com' } })
  if (smoke) {
    await db.comment.deleteMany({ where: { readerId: smoke.id } })
    await db.bookmark.deleteMany({ where: { readerId: smoke.id } })
    await db.pollVote.deleteMany({ where: { readerId: smoke.id } })
    await db.session.deleteMany({ where: { readerId: smoke.id } })
    await db.reader.delete({ where: { id: smoke.id } })
    console.log('removed smoke reader')
  }
  // Remove smoke contact message
  const msgs = await db.contactMessage.deleteMany({
    where: { email: 'test@example.com' },
  })
  if (msgs.count) console.log('removed', msgs.count, 'contact message(s)')
  // Remove smoke poll vote
  await db.pollVote.deleteMany({ where: { voterKey: 'test-voter-1' } })
  console.log('done')
  await db.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
