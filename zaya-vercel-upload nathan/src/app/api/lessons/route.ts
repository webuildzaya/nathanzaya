import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'
import { sendWhatsApp } from '@/lib/notifications'

const bookSchema = z.object({
  studentId: z.string().cuid(),
  instructorId: z.string().cuid().optional().nullable(),
  vehicleId: z.string().cuid().optional().nullable(),
  scheduledDate: z.string().datetime(),
  durationMinutes: z.number().int().positive().default(60),
})

export async function GET(req: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true, instructor: { select: { id: true } } },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const instructorId = searchParams.get('instructorId')
  const studentId = searchParams.get('studentId')
  const status = searchParams.get('status') as any
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const skip = (page - 1) * limit

  // Date filtering
  let dateFilter = {}
  if (dateStr) {
    const start = new Date(dateStr)
    start.setHours(0, 0, 0, 0)
    const end = new Date(dateStr)
    end.setHours(23, 59, 59, 999)
    dateFilter = {
      scheduledDate: { gte: start, lte: end },
    }
  }

  // Role filtering
  let accessFilter = {}
  if (user.role === 'INSTRUCTOR') {
    if (!user.instructor?.id) {
      return Response.json([]) // No mapped instructor, empty list
    }
    accessFilter = { instructorId: user.instructor.id }
  } else if (instructorId) {
    accessFilter = { instructorId }
  }

  const where = {
    schoolId: user.schoolId,
    ...dateFilter,
    ...accessFilter,
    ...(studentId ? { studentId } : {}),
    ...(status && status !== 'ALL' ? { status } : {}),
  }

  const [data, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      skip,
      take: limit,
      select: {
        id: true,
        scheduledDate: true,
        status: true,
        student: { select: { id: true, fullName: true, studentCode: true } },
        instructor: { select: { id: true, fullName: true } },
        vehicle: { select: { id: true, name: true } },
      },
    }),
    prisma.lesson.count({ where }),
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

export async function POST(req: Request) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  // Public variant support for student portal
  let schoolId = ''
  
  // Try normal auth first
  const session = await auth()
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { schoolId: true, role: true },
    })
    if (user) schoolId = user.schoolId
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // If we don't have a session, maybe it's a student portal request
  if (!schoolId && body.studentToken) {
    const studentCheck = await prisma.student.findUnique({
      where: { loginToken: body.studentToken },
      select: { schoolId: true, id: true },
    })
    if (studentCheck && studentCheck.id === body.studentId) {
      schoolId = studentCheck.schoolId
    } else {
      return Response.json({ error: 'Unauthorised check failed' }, { status: 403 })
    }
  }

  if (!schoolId) {
    return Response.json({ error: 'Unauthorised' }, { status: 401 })
  }

  try {
    const data = bookSchema.parse(body)
    const { studentId, instructorId, vehicleId } = data

    const [student, instructor, vehicle] = await Promise.all([
      studentId
        ? prisma.student.findFirst({
            where: { id: studentId, schoolId },
            select: { id: true },
          })
        : null,
      instructorId
        ? prisma.instructor.findFirst({
            where: { id: instructorId, schoolId },
            select: { id: true },
          })
        : null,
      vehicleId
        ? prisma.vehicle.findFirst({
            where: { id: vehicleId, schoolId },
            select: { id: true },
          })
        : null,
    ])

    if (studentId && !student) {
      return Response.json({ error: 'Student not found' }, { status: 404 })
    }
    if (instructorId && !instructor) {
      return Response.json({ error: 'Instructor not found' }, { status: 404 })
    }
    if (vehicleId && !vehicle) {
      return Response.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    // Conflict detection
    const reqStartMs = new Date(data.scheduledDate).getTime()
    const reqEndMs = reqStartMs + data.durationMinutes * 60000

    const conflictTargets = [
      ...(instructorId ? [{ instructorId }] : []),
      ...(vehicleId ? [{ vehicleId }] : []),
    ]

    // Fetch overlapping active lessons for either instructor or vehicle
    const conflicts = conflictTargets.length
      ? await prisma.lesson.findMany({
          where: {
            schoolId,
            status: { in: ['SCHEDULED', 'CHECKED_IN'] },
            OR: conflictTargets,
          },
          select: { instructorId: true, vehicleId: true, scheduledDate: true, durationMinutes: true }
        })
      : []

    // Manual overlaps check
    for (const c of conflicts) {
      const cStartMs = c.scheduledDate.getTime()
      const cEndMs = cStartMs + c.durationMinutes * 60000

      // Overlap condition: start < reqEnd && end > reqStart
      if (cStartMs < reqEndMs && cEndMs > reqStartMs) {
        if (instructorId && c.instructorId === instructorId) {
          return Response.json(
            { error: 'This instructor is already booked at that time.' },
            { status: 409 }
          )
        }
        if (vehicleId && c.vehicleId === vehicleId) {
          return Response.json(
            { error: 'This vehicle is already booked at that time.' },
            { status: 409 }
          )
        }
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        ...data,
        schoolId,
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        scheduledDate: true,
        durationMinutes: true,
        status: true,
        checkedInAt: true,
        completedAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            studentCode: true,
            phone: true,
          },
        },
        instructor: {
          select: {
            id: true,
            fullName: true,
            phone: true,
          },
        },
        vehicle: {
          select: { id: true, name: true, type: true },
        },
      },
    })

    // Notification
    const dateStr = new Date(lesson.scheduledDate).toLocaleDateString()
    const timeStr = new Date(lesson.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const instName = lesson.instructor?.fullName || 'an instructor'
    
    await sendWhatsApp(
      lesson.student.phone,
      `Hi ${lesson.student.fullName}, your lesson is booked for ${dateStr} at ${timeStr} with ${instName}. - Zaya`
    ).catch(e => console.error('Failed to send WA message', e))

    return Response.json(lesson)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? 'Invalid payload' }, { status: 400 })
    }
    console.error('[lessons:POST] error:', error)
    return Response.json({ error: 'Error booking lesson' }, { status: 500 })
  }
}
