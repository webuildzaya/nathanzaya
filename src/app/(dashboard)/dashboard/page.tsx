import { auth } from '@/lib/auth/config'
import { prisma } from '@/lib/db/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const schoolId = session.user.schoolId
  const firstName = session.user.name?.split(' ')[0] ?? 'there'

  const now = new Date()
  const dayOfWeek = now.getDay()
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + diffToMon)
  weekStart.setHours(0, 0, 0, 0)

  const [studentCount, lessonCount, paymentAgg, outstandingCount] = await Promise.all([
    prisma.student.count({ where: { schoolId } }),
    prisma.lesson.count({
      where: { schoolId, scheduledDate: { gte: weekStart } },
    }),
    prisma.payment.aggregate({
      where: { schoolId, voided: false },
      _sum: { amount: true },
    }),
    prisma.student.count({
      where: { schoolId, paymentStatus: { in: ['UNPAID', 'PART_PAID'] } },
    }),
  ])

  const totalRevenue = Number(paymentAgg._sum.amount || 0)

  const dateStr = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, <span className="text-blue-600">{firstName}</span> 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">{dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <span className="text-blue-700 font-bold text-sm">
              {session.user.name?.[0]?.toUpperCase()}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 to-[#0F1B4C] rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-blue-900/10">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center bg-blue-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
            School Overview
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            You have {studentCount} active {studentCount === 1 ? 'student' : 'students'} enrolled this session.
          </h2>
          <p className="text-blue-100/80 text-sm md:text-base mb-8 leading-relaxed">
            Monitor your school&apos;s performance, track student progress, and manage instructor schedules all from one central dashboard.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/reports" className="px-6 py-3 bg-white text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-lg shadow-white/10">
              View reports
            </Link>
            <Link href="/students" className="px-6 py-3 border border-white/30 rounded-xl font-semibold hover:bg-white/10 transition-all active:scale-95">
              Add new student
            </Link>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mb-16" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Students */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 mb-5">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div className="text-5xl font-extrabold text-gray-900 mb-1 tracking-tight">{studentCount}</div>
          <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-4">Total Students</div>
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <Link href="/students" className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors">
              View all →
            </Link>
          </div>
        </div>

        {/* Lessons */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 mb-5">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-5xl font-extrabold text-gray-900 mb-1 tracking-tight">{lessonCount}</div>
          <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-4">Lessons This Week</div>
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <Link href="/lessons" className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-full hover:bg-purple-100 transition-colors">
              View schedule →
            </Link>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-5">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-5xl font-extrabold text-gray-900 mb-1 tracking-tight">
            ₦{(totalRevenue / 1000).toFixed(0)}K
          </div>
          <div className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-4">Total Revenue</div>
          <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
              {outstandingCount} student{outstandingCount !== 1 ? 's' : ''} with balance
            </span>
            <Link href="/payments" className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}