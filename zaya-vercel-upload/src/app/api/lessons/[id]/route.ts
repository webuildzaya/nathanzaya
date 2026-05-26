import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { enforceApiRateLimit } from '@/lib/rateLimit'
import { z } from 'zod'

const patchSchema = z.object({
  status: z.enum(['SCHEDULED', 'CHECKED_IN', 'COMPLETED', 'MISSED', 'RESCHEDULED']),
})

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const { id } = await params
  
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true, instructor: { select: { id: true } } },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  const lesson = await prisma.lesson.findUnique({
    where: { id, schoolId: user.schoolId },
    select: {
      id: true,
      scheduledDate: true,
      durationMinutes: true,
      status: true,
      checkedInAt: true,
      completedAt: true,
      notes: true,
      student: { select: { id: true, fullName: true, studentCode: true, phone: true } },
      instructor: { select: { id: true, fullName: true } },
      vehicle: { select: { id: true, name: true } },
    },
  })

  if (!lesson) return Response.json({ error: 'Not found' }, { status: 404 })

  if (user.role === 'INSTRUCTOR' && lesson.instructor?.id !== user.instructor?.id) {
    return Response.json({ error: 'Access denied' }, { status: 403 })
  }

  return Response.json(lesson)
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await enforceApiRateLimit()
  if (limited) return limited

  const { id } = await params

  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorised' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { schoolId: true, role: true },
  })
  if (!user) return Response.json({ error: 'User not found' }, { status: 403 })

  try {
    const body = await req.json()
    const { status } = patchSchema.parse(body)

    const existing = await prisma.lesson.findUnique({
      where: { id, schoolId: user.schoolId },
      select: {
        id: true,
        status: true,
        student: {
          select: {
            id: true,
            lessonsCompleted: true,
            coursePackage: { select: { totalLessons: true } },
          },
        },
      },
    })

    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const updates: any = { status }
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updates.completedAt = new Date()
    } else if (status !== 'COMPLETED') {
      updates.completedAt = null
    }

    const lesson = await prisma.$transaction(async (tx) => {
      const updatedLesson = await tx.lesson.update({
        where: { id, schoolId: user.schoolId },
        data: updates,
        select: {
          id: true,
          scheduledDate: true,
          status: true,
          student: { select: { id: true } }
        }
      })

      // If completing the lesson for the first time
      if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
        const nextLessonsCompleted = existing.student.lessonsCompleted + 1
        const total = existing.student.coursePackage?.totalLessons ?? 0
        
        let newProgress = 'ACTIVE'
        if (nextLessonsCompleted >= total && total > 0) {
          newProgress = 'READY_FOR_TEST'
        }

        await tx.student.update({
          where: { id: existing.student.id, schoolId: user.schoolId },
          data: {
            lessonsCompleted: nextLessonsCompleted,
            progressStatus: newProgress as any,
          }
        })
      }

      return updatedLesson
    })

    return Response.json(lesson)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: error.issues[0]?.message ?? 'Invalid operation' }, { status: 400 })
    }
    console.error('[lessons:id:PATCH] error:', error)
    return Response.json({ error: 'Invalid operation' }, { status: 500 })
  }
}
