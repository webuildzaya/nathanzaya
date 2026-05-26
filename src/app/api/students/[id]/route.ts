import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

const phoneRegex = /^(\+234|0)[789][0-9]\d{8}$/

const updateSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(phoneRegex, 'Enter a valid Nigerian phone number').optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(255).optional(),
  coursePackageId: z.string().cuid().optional().or(z.literal('')),
  progressStatus: z.enum(['ACTIVE', 'READY_FOR_TEST', 'CERTIFICATE_ISSUED']).optional(),
})

// ── GET /api/students/[id] ─────────────────────────────────────────────────
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params

  const student = await prisma.student.findFirst({
    where: { id, schoolId: user.schoolId },
    select: {
      id: true,
      studentCode: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      photoUrl: true,
      paymentStatus: true,
      progressStatus: true,
      lessonsCompleted: true,
      coursePackageId: true,
      createdAt: true,
      coursePackage: {
        select: { id: true, name: true, totalLessons: true, price: true, durationMinutes: true },
      },
      payments: {
        select: {
          id: true,
          amount: true,
          method: true,
          paymentDate: true,
          receiptUrl: true,
          notes: true,
          voided: true,
          voidedAt: true,
          voidedBy: true,
        },
        orderBy: { paymentDate: 'desc' },
      },
      _count: { select: { lessons: true, payments: true } },
    },
  })

  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const totalPaid = student.payments.reduce(
    (sum, p) => sum + (p.voided ? 0 : parseFloat(p.amount.toString())),
    0
  )
  const coursePrice = student.coursePackage
    ? parseFloat(student.coursePackage.price.toString())
    : 0
  const outstanding = Math.max(0, coursePrice - totalPaid)

  return Response.json({
    data: {
      ...student,
      payments: student.payments.map((p) => ({
        ...p,
        amount: p.amount.toString(),
        paymentDate: p.paymentDate.toISOString(),
        voidedAt: p.voidedAt?.toISOString() ?? null,
        receiptUrl: p.receiptUrl,
        notes: p.notes,
      })),
      totalPaid,
      outstanding,
      coursePackage: student.coursePackage
        ? {
            ...student.coursePackage,
            price: student.coursePackage.price.toString(),
          }
        : null,
    },
  })
}

// ── PATCH /api/students/[id] ───────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  if (!['SUPER_ADMIN', 'STAFF'].includes(user.role)) {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  const { id } = await params

  // Confirm student belongs to this school
  const existing = await prisma.student.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true },
  })
  if (!existing) return Response.json({ error: 'Student not found' }, { status: 404 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { fullName, phone, email, address, coursePackageId, progressStatus } = parsed.data
  const { schoolId } = user

  if (coursePackageId) {
    const pkg = await prisma.coursePackage.findFirst({
      where: { id: coursePackageId, schoolId },
      select: { id: true },
    })
    if (!pkg) {
      return Response.json({ error: 'Course package not found' }, { status: 404 })
    }
  }

  const updated = await prisma.student.update({
    where: { id, schoolId },
    data: {
      ...(fullName !== undefined && { fullName }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email: email || null }),
      ...(address !== undefined && { address }),
      ...(coursePackageId !== undefined && { coursePackageId: coursePackageId || null }),
      ...(progressStatus !== undefined && { progressStatus }),
    },
    select: {
      id: true,
      studentCode: true,
      fullName: true,
      phone: true,
      email: true,
      address: true,
      paymentStatus: true,
      progressStatus: true,
    },
  })

  return Response.json({ data: updated })
}
