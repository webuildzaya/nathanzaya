import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { sendWhatsApp } from '@/lib/notifications'
import { z } from 'zod'

const portalBookSchema = z.object({
  studentToken: z.string().min(1),
  instructorId: z.string().cuid().optional().nullable(),
  vehicleId: z.string().cuid().optional().nullable(),
  scheduledDate: z.string().datetime(),
  durationMinutes: z.number().int().positive().max(480).default(60),
})

async function findStudent(studentToken: string) {
  return prisma.student.findUnique({
    where: { loginToken: studentToken },
    select: {
      id: true,
      schoolId: true,
      fullName: true,
      phone: true,
    },
  })
}

export async function GET(request: Request) {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const studentToken = searchParams.get('studentToken')
    if (!studentToken) {
      return Response.json({ error: 'No student token provided' }, { status: 400 })
    }

    const student = await findStudent(studentToken)
    if (!student) {
      return Response.json({ error: 'Invalid student token' }, { status: 403 })
    }

    const lessons = await prisma.lesson.findMany({
      where: {
        schoolId: student.schoolId,
        studentId: student.id,
        status: { in: ['SCHEDULED', 'CHECKED_IN'] },
        scheduledDate: { gte: new Date() },
      },
      orderBy: { scheduledDate: 'asc' },
      select: {
        id: true,
        scheduledDate: true,
        status: true,
        instructor: { select: { fullName: true } },
      },
    })

    return Response.json({ data: lessons })
  } catch (error) {
    console.error('[student-portal:lessons:GET] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const limited = await enforceApiRateLimit()
    if (limited) return limited

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const parsed = portalBookSchema.safeParse(body)
    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid payload' },
        { status: 400 }
      )
    }

    const { studentToken, instructorId, vehicleId, scheduledDate, durationMinutes } = parsed.data
    const student = await findStudent(studentToken)
    if (!student) {
      return Response.json({ error: 'Invalid student token' }, { status: 403 })
    }

    const [instructor, vehicle] = await Promise.all([
      instructorId
        ? prisma.instructor.findFirst({
            where: { id: instructorId, schoolId: student.schoolId },
            select: { id: true },
          })
        : null,
      vehicleId
        ? prisma.vehicle.findFirst({
            where: { id: vehicleId, schoolId: student.schoolId },
            select: { id: true },
          })
        : null,
    ])

    if (instructorId && !instructor) {
      return Response.json({ error: 'Instructor not found' }, { status: 404 })
    }
    if (vehicleId && !vehicle) {
      return Response.json({ error: 'Vehicle not found' }, { status: 404 })
    }

    const reqStartMs = new Date(scheduledDate).getTime()
    const reqEndMs = reqStartMs + durationMinutes * 60000
    const conflictTargets = [
      ...(instructorId ? [{ instructorId }] : []),
      ...(vehicleId ? [{ vehicleId }] : []),
    ]

    const conflicts = conflictTargets.length
      ? await prisma.lesson.findMany({
          where: {
            schoolId: student.schoolId,
            status: { in: ['SCHEDULED', 'CHECKED_IN'] },
            OR: conflictTargets,
          },
          select: { instructorId: true, vehicleId: true, scheduledDate: true, durationMinutes: true },
        })
      : []

    for (const conflict of conflicts) {
      const conflictStartMs = conflict.scheduledDate.getTime()
      const conflictEndMs = conflictStartMs + conflict.durationMinutes * 60000
      if (conflictStartMs < reqEndMs && conflictEndMs > reqStartMs) {
        if (instructorId && conflict.instructorId === instructorId) {
          return Response.json(
            { error: 'This instructor is already booked at that time.' },
            { status: 409 }
          )
        }
        if (vehicleId && conflict.vehicleId === vehicleId) {
          return Response.json(
            { error: 'This vehicle is already booked at that time.' },
            { status: 409 }
          )
        }
      }
    }

    const lesson = await prisma.lesson.create({
      data: {
        schoolId: student.schoolId,
        studentId: student.id,
        instructorId: instructorId ?? null,
        vehicleId: vehicleId ?? null,
        scheduledDate: new Date(scheduledDate),
        durationMinutes,
        status: 'SCHEDULED',
      },
      select: {
        id: true,
        scheduledDate: true,
        status: true,
        instructor: { select: { fullName: true } },
      },
    })

    const bookedDate = new Date(lesson.scheduledDate)
    const dateStr = bookedDate.toLocaleDateString()
    const timeStr = bookedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const instructorName = lesson.instructor?.fullName || 'an instructor'

    await sendWhatsApp(
      student.phone,
      `Hi ${student.fullName}, your lesson is booked for ${dateStr} at ${timeStr} with ${instructorName}. - Zaya`
    ).catch((error) => console.error('[student-portal:lessons:notify] error:', error))

    return Response.json({ data: lesson }, { status: 201 })
  } catch (error) {
    console.error('[student-portal:lessons:POST] error:', error)
    return Response.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
