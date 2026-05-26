import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db/prisma'
import StudentPortalClient from '@/components/students/StudentPortalClient'

interface Props {
  params: Promise<{ token: string }>
}

export default async function StudentPortalPage({ params }: Props) {
  const { token } = await params

  const student = await prisma.student.findUnique({
    where: { loginToken: token },
    select: {
      id: true,
      fullName: true,
      studentCode: true,
      paymentStatus: true,
      progressStatus: true,
      lessonsCompleted: true,
      createdAt: true,
      coursePackage: {
        select: { id: true, name: true, totalLessons: true, durationMinutes: true },
      },
      lessons: {
        where: {
          status: 'SCHEDULED',
          scheduledDate: { gte: new Date() },
        },
        orderBy: { scheduledDate: 'asc' },
        take: 1,
        select: { scheduledDate: true },
      },
    },
  })

  if (!student) return notFound()
  
  const coursePackage = student.coursePackage
  const totalLessons = coursePackage?.totalLessons || 0
  const lessonsCompleted = student.lessonsCompleted
  const lessonsRemaining = Math.max(0, totalLessons - lessonsCompleted)
  const pct = totalLessons > 0 ? Math.round((lessonsCompleted / totalLessons) * 100) : 0
  
  const nextLesson = student.lessons[0]
  
  const initials = student.fullName
    .split(' ')
    .filter(Boolean)
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const studentData = {
    ...student,
    pct,
    lessonsRemaining,
    nextLesson,
    initials
  }

  return (
    <StudentPortalClient 
      student={studentData} 
      token={token} 
    />
  )
}
