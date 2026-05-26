import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'
import { generateReceipt } from '@/lib/pdf/receipt'
import type { NextRequest } from 'next/server'
import { Decimal } from '@prisma/client/runtime/library'

// ─── Zod validation schema ───────────────────────────────────────────────────
const RecordPaymentSchema = z.object({
  studentId: z.string().cuid({ message: 'Invalid student ID' }),
  amount: z.number().positive({ message: 'Amount must be greater than 0' }),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'POS'] as const, {
    error: 'Method must be CASH, BANK_TRANSFER, or POS',
  }),
  paymentDate: z.string().datetime({ message: 'Payment date must be a valid ISO datetime' }),
  notes: z
    .string()
    .max(255, { message: 'Notes must be 255 characters or fewer' })
    .optional(),
})

// ─── GET /api/payments ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
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

  // INSTRUCTOR role cannot access payment list
  if (user.role === 'INSTRUCTOR') {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  const { schoolId } = user
  const { searchParams } = new URL(request.url)
  const studentId = searchParams.get('studentId')
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')
  const method = searchParams.get('method')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  const validMethod =
    method && ['CASH', 'BANK_TRANSFER', 'POS'].includes(method)
      ? (method as 'CASH' | 'BANK_TRANSFER' | 'POS')
      : undefined

  const where = {
    schoolId,
    voided: false,
    ...(studentId ? { studentId } : {}),
    ...(validMethod ? { method: validMethod } : {}),
    ...(startDate || endDate
      ? {
          paymentDate: {
            ...(startDate ? { gte: new Date(startDate) } : {}),
            ...(endDate ? { lte: new Date(endDate) } : {}),
          },
        }
      : {}),
  }

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
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
        createdAt: true,
        studentId: true,
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            phone: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    }),
    prisma.payment.count({ where }),
  ])

  return Response.json({
    data: data.map((p) => ({
      ...p,
      amount: p.amount.toString(),
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  })
}

// ─── POST /api/payments ───────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
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

  // Only SUPER_ADMIN and STAFF can record payments
  if (user.role === 'INSTRUCTOR') {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  const { schoolId } = user

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = RecordPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Validation failed', issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    )
  }

  const { studentId, amount, method, paymentDate, notes } = parsed.data

  // Verify student belongs to this school
  const student = await prisma.student.findFirst({
    where: { id: studentId, schoolId },
    select: {
      id: true,
      fullName: true,
      studentCode: true,
      phone: true,
      coursePackageId: true,
      coursePackage: {
        select: { price: true },
      },
    },
  })
  if (!student) {
    return Response.json({ error: 'Student not found' }, { status: 404 })
  }

  // Save the payment
  const payment = await prisma.payment.create({
    data: {
      schoolId,
      studentId,
      amount: new Decimal(amount),
      method,
      paymentDate: new Date(paymentDate),
      notes: notes ?? null,
    },
    select: { id: true, amount: true, method: true, paymentDate: true, notes: true },
  })

  // Calculate total paid for this student
  const aggregate = await prisma.payment.aggregate({
    where: { studentId, schoolId, voided: false },
    _sum: { amount: true },
  })
  const totalPaid = Number(aggregate._sum.amount ?? 0)

  // Determine new payment status
  const coursePrice = student.coursePackage ? Number(student.coursePackage.price) : 0
  let paymentStatus: 'UNPAID' | 'PART_PAID' | 'FULLY_PAID'
  if (totalPaid <= 0) {
    paymentStatus = 'UNPAID'
  } else if (coursePrice > 0 && totalPaid >= coursePrice) {
    paymentStatus = 'FULLY_PAID'
  } else {
    paymentStatus = 'PART_PAID'
  }

  // Update student payment status
  await prisma.student.update({
    where: { id: studentId, schoolId },
    data: { paymentStatus },
  })

  const balance = Math.max(0, coursePrice - totalPaid)

  // Fetch school info for the receipt
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { name: true, address: true, phone: true, logoUrl: true },
  })

  // Generate PDF receipt
  const receiptNumber = `RCP-${payment.id.slice(0, 8).toUpperCase()}`
  let receiptUrl: string | null = null

  try {
    receiptUrl = await generateReceipt({
      school: school ?? { name: 'Driving School', address: null, phone: null, logoUrl: null },
      student: {
        fullName: student.fullName,
        studentCode: student.studentCode,
        phone: student.phone,
      },
      payment: {
        id: payment.id,
        amount,
        method,
        paymentDate,
        notes: notes ?? null,
      },
      balance,
      receiptNumber,
    })

    if (receiptUrl) {
      // Update payment row with receipt URL
      await prisma.payment.update({
        where: { id: payment.id, schoolId },
        data: { receiptUrl },
      })
    }
  } catch (err) {
    // Receipt generation is non-fatal — payment is saved regardless
    console.error('[generateReceipt] Failed:', err)
  }

  return Response.json(
    {
      data: {
        id: payment.id,
        amount: payment.amount.toString(),
        method: payment.method,
        paymentDate: payment.paymentDate,
        notes: payment.notes,
        receiptUrl,
        receiptNumber,
        totalPaid,
        balance,
        paymentStatus,
      },
    },
    { status: 201 }
  )
}
