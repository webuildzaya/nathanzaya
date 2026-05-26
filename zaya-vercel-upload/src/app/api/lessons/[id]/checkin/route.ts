import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { sendWhatsApp } from '@/lib/notifications'

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const { id } = await params

  try {
    const body = await req.json()
    const { studentToken } = body

    if (!studentToken) {
      return Response.json({ error: 'No student token provided' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({
      where: { loginToken: studentToken },
      select: { id: true, schoolId: true, fullName: true, school: { select: { phone: true } } }
    })

    if (!student) {
      return Response.json({ error: 'Invalid student token' }, { status: 403 })
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id, studentId: student.id, schoolId: student.schoolId },
      select: {
        id: true,
        schoolId: true,
        scheduledDate: true,
        status: true,
        instructor: { select: { phone: true, fullName: true } },
      },
    })

    if (!lesson) {
      return Response.json({ error: 'Lesson not found' }, { status: 404 })
    }

    if (lesson.status !== 'SCHEDULED') {
      return Response.json({ error: 'Lesson is not in SCHEDULED status' }, { status: 400 })
    }

    const today = new Date()
    const lessonDate = new Date(lesson.scheduledDate)

    if (
      lessonDate.getFullYear() !== today.getFullYear() ||
      lessonDate.getMonth() !== today.getMonth() ||
      lessonDate.getDate() !== today.getDate()
    ) {
      return Response.json({ error: 'Can only check in on the day of the lesson' }, { status: 400 })
    }

    await prisma.lesson.update({
      where: { id, schoolId: lesson.schoolId },
      data: {
        status: 'CHECKED_IN',
        checkedInAt: new Date()
      }
    })

    // Fire & forget notifications (don't block response)
    const timeStr = lessonDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const msg = `${student.fullName} has checked in for their lesson at ${timeStr}. - Zaya`

    if (lesson.instructor?.phone) {
      sendWhatsApp(lesson.instructor.phone, msg).catch(() => {})
    }
    if (student.school.phone) {
      sendWhatsApp(student.school.phone, msg).catch(() => {})
    }

    return Response.json({ status: 'success' })
  } catch (error) {
    console.error('[lessons:checkin] error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
