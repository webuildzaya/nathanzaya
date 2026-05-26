import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import type { NextRequest } from 'next/server'

// ─── GET /api/payments/[id] ───────────────────────────────────────────────────
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

  const payment = await prisma.payment.findFirst({
    where: { id, schoolId: user.schoolId },
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
          paymentStatus: true,
          coursePackage: {
            select: { name: true, price: true },
          },
        },
      },
    },
  })

  if (!payment) {
    return Response.json({ error: 'Payment not found' }, { status: 404 })
  }

  return Response.json({
    data: {
      ...payment,
      amount: payment.amount.toString(),
      student: {
        ...payment.student,
        coursePackage: payment.student.coursePackage
          ? {
              ...payment.student.coursePackage,
              price: payment.student.coursePackage.price.toString(),
            }
          : null,
      },
    },
  })
  } catch (error) {
    console.error('[payments:id:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

// ─── DELETE /api/payments/[id] ────────────────────────────────────────────────
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  // DELETE is restricted to SUPER_ADMIN only
  if (user.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Access denied — Super Admin only' }, { status: 403 })
  }

  const { id } = await params

  // Confirm payment exists and belongs to this school
  const payment = await prisma.payment.findFirst({
    where: { id, schoolId: user.schoolId, voided: false },
    select: { id: true, studentId: true },
  })
  if (!payment) {
    return Response.json({ error: 'Payment not found' }, { status: 404 })
  }

  // Soft-void the payment so the audit trail remains intact.
  await prisma.payment.update({
    where: { id, schoolId: user.schoolId },
    data: {
      voided: true,
      voidedAt: new Date(),
      voidedBy: user.id,
    },
  })

  // Recalculate payment status for the student
  const student = await prisma.student.findFirst({
    where: { id: payment.studentId, schoolId: user.schoolId },
    select: {
      id: true,
      coursePackage: { select: { price: true } },
    },
  })

  if (student) {
    const aggregate = await prisma.payment.aggregate({
      where: { studentId: payment.studentId, schoolId: user.schoolId, voided: false },
      _sum: { amount: true },
    })
    const totalPaid = Number(aggregate._sum.amount ?? 0)
    const coursePrice = student.coursePackage ? Number(student.coursePackage.price) : 0

    let paymentStatus: 'UNPAID' | 'PART_PAID' | 'FULLY_PAID'
    if (totalPaid <= 0) {
      paymentStatus = 'UNPAID'
    } else if (coursePrice > 0 && totalPaid >= coursePrice) {
      paymentStatus = 'FULLY_PAID'
    } else {
      paymentStatus = 'PART_PAID'
    }

    await prisma.student.update({
      where: { id: payment.studentId, schoolId: user.schoolId },
      data: { paymentStatus },
    })
  }

  return Response.json({ message: 'Payment voided successfully' })
  } catch (error) {
    console.error('[payments:id:DELETE] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
