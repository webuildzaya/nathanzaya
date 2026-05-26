import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { randomUUID } from 'crypto'

// POST /api/students/[id]/reset-token — SUPER_ADMIN only
export async function POST(
  _request: Request,
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

  if (user.role !== 'SUPER_ADMIN') {
    return Response.json({ error: 'Access denied — SUPER_ADMIN only' }, { status: 403 })
  }

  const { id } = await params

  const student = await prisma.student.findFirst({
    where: { id, schoolId: user.schoolId },
    select: { id: true, fullName: true },
  })
  if (!student) return Response.json({ error: 'Student not found' }, { status: 404 })

  const newToken = randomUUID()

  await prisma.student.update({
    where: { id, schoolId: user.schoolId },
    data: { loginToken: newToken },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const magicLink = `${baseUrl}/student/${newToken}`

  return Response.json({ magicLink })
  } catch (error) {
    console.error('[students:reset-token:POST] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
