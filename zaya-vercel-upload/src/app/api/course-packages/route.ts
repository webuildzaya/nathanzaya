import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'

export async function GET() {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true },
    })
    if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

    const packages = await prisma.coursePackage.findMany({
      where: { schoolId: user.schoolId, isActive: true },
      select: {
        id: true,
        name: true,
        totalLessons: true,
        price: true,
        durationMinutes: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })

    return Response.json({
      data: packages.map((coursePackage) => ({
        ...coursePackage,
        price: coursePackage.price.toString(),
      })),
    })
  } catch (error) {
    console.error('[course-packages:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
