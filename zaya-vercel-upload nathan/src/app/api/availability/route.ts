import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'

export async function GET(req: Request) {
  try {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const instructorId = searchParams.get('instructorId')
  const vehicleId = searchParams.get('vehicleId')
  let schoolId = ''
  
  // Try normal auth first
  const session = await auth()
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true },
    })
    if (user) schoolId = user.schoolId
  }

  // Support public token access (important for student portal)
  const studentToken = searchParams.get('studentToken')
  if (!schoolId && studentToken) {
    const student = await prisma.student.findUnique({
      where: { loginToken: studentToken },
      select: { schoolId: true }
    })
    if (student) schoolId = student.schoolId
  }

  if (!schoolId) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  if (!dateStr) {
    return Response.json({ error: 'Date is required' }, { status: 400 })
  }

  // Retrieve default coursePackage duration to know slot intervals
  // Alternatively fallback to 60.
  const packageSettings = await prisma.coursePackage.findFirst({
    where: { schoolId, isActive: true },
    select: { durationMinutes: true }
  })
  const duration = packageSettings?.durationMinutes || 60

  const [year, month, day] = dateStr.split('-').map(Number)
  
  const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0)
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999)

  // 1. Generate all possible slots (8:00 AM to 6:00 PM)
  const slots: Date[] = []
  const currentSlot = new Date(year, month - 1, day, 8, 0, 0, 0)
  const endLimit = new Date(year, month - 1, day, 18, 0, 0, 0)

  while (currentSlot < endLimit) {
    slots.push(new Date(currentSlot))
    currentSlot.setMinutes(currentSlot.getMinutes() + duration)
  }

  // 2. Fetch existing lessons constraints
  const conflicts = await prisma.lesson.findMany({
    where: {
      schoolId,
      status: { in: ['SCHEDULED', 'CHECKED_IN'] },
      scheduledDate: { gte: startOfDay, lte: endOfDay },
      OR: [
        ...(instructorId ? [{ instructorId }] : []),
        ...(vehicleId ? [{ vehicleId }] : []),
      ]
    },
    select: { scheduledDate: true, durationMinutes: true }
  })

  // 3. Mark availability
  const availability = slots.map(slotTime => {
    const slotStartMs = slotTime.getTime()
    const slotEndMs = slotStartMs + duration * 60000

    let isAvailable = true
    for (const c of conflicts) {
      const cStartMs = c.scheduledDate.getTime()
      const cEndMs = cStartMs + c.durationMinutes * 60000

      // If overlap: start < end AND end > start
      if (cStartMs < slotEndMs && cEndMs > slotStartMs) {
        isAvailable = false
        break
      }
    }

    // Ensure past times are disabled correctly globally
    const now = new Date()
    // give a 30 min buffer for booking
    const cutoff = new Date(now.getTime() + 30 * 60000)
    
    if (slotTime.getTime() < cutoff.getTime()) {
        isAvailable = false
    }

    return {
      time: slotTime.toISOString(),
      available: isAvailable
    }
  })

  return Response.json({ data: availability, durationMinutes: duration })
  } catch (error) {
    console.error('[availability:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
