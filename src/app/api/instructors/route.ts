import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const schema = z.object({
  fullName: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6).optional().or(z.literal('')),
})

export async function GET() {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })
    if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

    const instructors = await prisma.instructor.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, phone: true, isActive: true, user: { select: { email: true } } },
    })

    return Response.json(instructors, {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('[instructors:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })
    if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

    if (user.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await req.json()
    const { fullName, phone, email, password } = schema.parse(body)

    let userId: string | undefined

    if (email && password) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return Response.json({ error: 'Email already used for another user' }, { status: 400 })

      const passwordHash = await bcrypt.hash(password, 10)
      const newUser = await prisma.user.create({
        data: {
          schoolId: user.schoolId,
          email,
          fullName,
          passwordHash,
          role: 'INSTRUCTOR',
        },
        select: { id: true },
      })
      userId = newUser.id
    }

    const instructor = await prisma.instructor.create({
      data: {
        fullName,
        phone,
        schoolId: user.schoolId,
        userId,
      },
      select: { id: true, fullName: true, phone: true, isActive: true },
    })
    return Response.json(instructor)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
    }
    console.error('[instructors:POST] error:', error)
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
