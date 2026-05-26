import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

// Nigerian phone: 08012345678 or +2348012345678
const phoneRegex = /^(\+234|0)[789][0-9]\d{8}$/

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  phone: z.string().regex(phoneRegex, 'Enter a valid Nigerian phone number (e.g. 08012345678)'),
  email: z.string().email('Enter a valid email address').optional().or(z.literal('')),
  address: z.string().max(255).optional(),
  coursePackageId: z.string().cuid('Invalid course package').optional().or(z.literal('')),
})

// ── GET /api/students ──────────────────────────────────────────────────────
export async function GET(request: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  if (user.role === 'INSTRUCTOR') {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  const { schoolId } = user
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') ?? ''
  const paymentFilter = searchParams.get('paymentStatus') ?? ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const where = {
    schoolId,
    ...(paymentFilter && ['UNPAID', 'PART_PAID', 'FULLY_PAID'].includes(paymentFilter)
      ? { paymentStatus: paymentFilter as 'UNPAID' | 'PART_PAID' | 'FULLY_PAID' }
      : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' as const } },
            { phone: { contains: search } },
            { studentCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        photoUrl: true,
        paymentStatus: true,
        progressStatus: true,
        coursePackage: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.student.count({ where }),
  ])

  return Response.json({
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}

// ── POST /api/students ─────────────────────────────────────────────────────
export async function POST(request: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  // STAFF and SUPER_ADMIN can register students
  if (!['SUPER_ADMIN', 'STAFF'].includes(user.role)) {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { fullName, phone, email, address, coursePackageId } = parsed.data
  const { schoolId } = user

  // Validate coursePackage belongs to this school
  if (coursePackageId) {
    const pkg = await prisma.coursePackage.findFirst({
      where: { id: coursePackageId, schoolId, isActive: true },
      select: { id: true },
    })
    if (!pkg) {
      return Response.json({ error: 'Course package not found' }, { status: 404 })
    }
  }

  // Generate studentCode: ZYA-YEAR-XXXX
  const year = new Date().getFullYear()
  const lastStudent = await prisma.student.findFirst({
    where: { schoolId, studentCode: { startsWith: `ZYA-${year}-` } },
    orderBy: { studentCode: 'desc' },
    select: { studentCode: true },
  })
  const lastNumber = lastStudent ? parseInt(lastStudent.studentCode.split('-')[2]) : 0
  const studentCode = `ZYA-${year}-${String(lastNumber + 1).padStart(4, '0')}`

  try {
    const student = await prisma.student.create({
      data: {
        schoolId,
        studentCode,
        fullName,
        phone,
        email: email || null,
        address: address || null,
        coursePackageId: coursePackageId || null,
      },
      select: {
        id: true,
        studentCode: true,
        fullName: true,
        phone: true,
        email: true,
        paymentStatus: true,
        progressStatus: true,
        createdAt: true,
      },
    })

    return Response.json({ data: student }, { status: 201 })
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return Response.json({ error: 'A student with this code already exists. Please try again.' }, { status: 409 })
    }
    console.error('[students:POST] error:', error)
    return Response.json({ error: 'Failed to create student' }, { status: 500 })
  }
}
