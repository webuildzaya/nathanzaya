import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1),
  type: z.string().optional(),
})

export async function GET() {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  const vehicles = await prisma.vehicle.findMany({
    where: { schoolId: user.schoolId, isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, type: true, isActive: true },
  })

  return Response.json(vehicles, {
    headers: {
      'Cache-Control': 's-maxage=60, stale-while-revalidate=300'
    }
  })
}

export async function POST(req: Request) {
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

  try {
    const body = await req.json()
    const data = schema.parse(body)

    const vehicle = await prisma.vehicle.create({
      data: {
        ...data,
        schoolId: user.schoolId,
      },
    })
    return Response.json(vehicle)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
    }
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }
}
