import { db } from '@/lib/db'
import { ok, parseBody, limitOr429 } from '@/lib/api'
import { validEmail } from '@/lib/auth'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const contactSchema = z.object({
  name: z.string().trim().min(2, 'नाम कम्तीमा २ अक्षरको हुनुपर्छ।').max(80),
  email: z
    .string()
    .trim()
    .max(120)
    .refine((v) => validEmail(v), 'मान्य इमेल लेख्नुहोस्।'),
  subject: z.string().trim().min(3, 'विषय लेख्नुहोस्।').max(120),
  message: z
    .string()
    .trim()
    .min(20, 'सन्देश कम्तीमा २० अक्षरको हुनुपर्छ।')
    .max(3000, 'सन्देश ३००० अक्षरभित्र राख्नुहोस्।'),
})

/** Public: contact / news-tip form (सम्पर्क पृष्ठ). */
export async function POST(req: Request) {
  const limited = limitOr429(req, 'contact', 3, 60 * 60 * 1000)
  if (limited) return limited

  const { data, error } = await parseBody(req, contactSchema)
  if (error) return error

  await db.contactMessage.create({
    data: { name: data.name, email: data.email, subject: data.subject, message: data.message },
  })
  return ok({ received: true })
}
