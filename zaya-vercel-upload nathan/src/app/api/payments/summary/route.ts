import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'

export async function GET() {
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

    const { schoolId } = user
    const now = new Date()

    const todayStart = new Date(now)
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(now)
    todayEnd.setHours(23, 59, 59, 999)

    const dayOfWeek = now.getDay()
    const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() + diffToMon)
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      activeStudents,
      paymentsByStudent,
      paymentsByMethod,
      todayAgg,
      weekAgg,
      monthAgg,
    ] = await Promise.all([
      prisma.student.findMany({
        where: {
          schoolId,
          progressStatus: 'ACTIVE',
          coursePackageId: { not: null },
        },
        select: {
          id: true,
          coursePackage: { select: { price: true } },
        },
      }),
      prisma.payment.groupBy({
        by: ['studentId'],
        where: { schoolId, voided: false },
        _sum: { amount: true },
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: { schoolId, voided: false },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          schoolId,
          voided: false,
          paymentDate: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          schoolId,
          voided: false,
          paymentDate: { gte: weekStart, lte: weekEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          schoolId,
          voided: false,
          paymentDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
    ])

    const paidByStudentId = new Map<string, number>()
    for (const row of paymentsByStudent) {
      paidByStudentId.set(row.studentId, Number(row._sum.amount ?? 0))
    }

    const byMethod: Record<'CASH' | 'BANK_TRANSFER' | 'POS', number> = {
      CASH: 0,
      BANK_TRANSFER: 0,
      POS: 0,
    }
    for (const row of paymentsByMethod) {
      const method = row.method as 'CASH' | 'BANK_TRANSFER' | 'POS'
      byMethod[method] += Number(row._sum.amount ?? 0)
    }

    const totalOutstanding = activeStudents.reduce((sum, student) => {
      const coursePrice = Number(student.coursePackage?.price ?? 0)
      const paid = paidByStudentId.get(student.id) ?? 0
      return sum + Math.max(0, coursePrice - paid)
    }, 0)

    const todayTotal = Number(todayAgg._sum.amount ?? 0)
    const weekTotal = Number(weekAgg._sum.amount ?? 0)
    const monthTotal = Number(monthAgg._sum.amount ?? 0)

    return Response.json(
      {
        data: {
          todayTotal,
          weekTotal,
          monthTotal,
          byMethod,
          totalOutstanding,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    )
  } catch (error) {
    console.error('[payments:summary:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
