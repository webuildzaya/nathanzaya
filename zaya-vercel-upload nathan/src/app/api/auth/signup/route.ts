import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  referralSource: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    const body = await req.json()
    const { email, phone, referralSource, password } = signupSchema.parse(body)

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return Response.json(
        { error: 'Email already exists' },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Create a new school for this user
    const schoolName = `${email.split('@')[0]}'s Driving School`
    
    const result = await prisma.$transaction(async (tx) => {
      const school = await tx.school.create({
        data: {
          name: schoolName,
          phone,
        },
      })

      const user = await tx.user.create({
        data: {
          email,
          phone,
          referralSource,
          passwordHash,
          fullName: email.split('@')[0], // Placeholder fullName
          role: 'SUPER_ADMIN',
          schoolId: school.id,
        },
      })

      return user
    })

    return Response.json({ success: true, user: { email: result.email } })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', issues: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[signup] error:', error)
    return Response.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
