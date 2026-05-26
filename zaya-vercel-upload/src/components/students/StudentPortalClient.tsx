'use client'

import { useState } from 'react'
import StudentPortalBooker from '@/components/lessons/StudentPortalBooker'

interface Props {
  student: any
  token: string
}

export default function StudentPortalClient({ student, token }: Props) {
  const [activeTab, setActiveTab] = useState('overview')

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-GB', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { id: 'book', label: 'Book a Lesson', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', badge: '3 slots' },
    { id: 'progress', label: 'My Progress', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'payments', label: 'Payments', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
  ]

  const nextLessonDate = student.nextLesson 
    ? new Date(student.nextLesson.scheduledDate)
    : null

  const paymentStatusLabel: Record<string, string> = {
    UNPAID: 'Payment due',
    PART_PAID: 'Partially paid',
    FULLY_PAID: 'Fully paid',
  }

  const paymentStatusStyle: Record<string, string> = {
    UNPAID: 'bg-red-100 text-red-700 border-red-200',
    PART_PAID: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    FULLY_PAID: 'bg-green-100 text-green-700 border-green-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex flex-col w-64 bg-[#F8FAFC] border-r border-gray-200 px-4 py-8 fixed h-full z-10">
        <div className="px-2 mb-10">
          <img src="/logo.svg" alt="Zaya Drives" className="h-10 w-auto" />
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-full text-sm font-medium transition-all ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                </svg>
                {item.label}
              </div>
              {item.badge && activeTab !== item.id && (
                <span className="text-[10px] bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <button className="mt-auto flex items-center gap-3 px-4 py-3 text-gray-600 hover:text-red-600 transition-colors text-sm font-medium">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Welcome back, <span className="text-blue-600">{student.fullName.split(' ')[0]}</span> 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">{dateStr}</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white md:bg-transparent p-2 rounded-xl border md:border-0 border-gray-100">
            <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                <span className="text-blue-700 font-bold text-sm">{student.initials}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-gray-900 leading-none">{student.fullName}</p>
                <p className="text-xs text-gray-500 mt-1">{student.studentCode}</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Hero Banner */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-800 to-[#0F1B4C] rounded-3xl p-6 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="relative z-10 flex-1">
                <div className="inline-flex items-center bg-blue-400/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4">
                  {student.coursePackage?.name || 'Driving Course'}
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-3">
                  You&apos;re {student.pct}% of the way there, {student.fullName.split(' ')[0]}.
                </h2>
                <p className="text-blue-100/80 text-sm md:text-base max-w-md mb-8 leading-relaxed">
                  {student.lessonsRemaining} lessons left before you&apos;re ready for your road test. Keep the momentum going — you&apos;re doing great.
                </p>
                <button 
                  onClick={() => setActiveTab('book')}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-white/30 rounded-xl font-semibold hover:bg-white/10 transition-all active:scale-95"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book next lesson
                </button>
              </div>

              {/* Circular Progress */}
              <div className="relative flex-shrink-0 w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 120 120">
                  {/* Background Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress Circle */}
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="white"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 54}
                    strokeDashoffset={2 * Math.PI * 54 * (1 - student.pct / 100)}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{student.pct}%</span>
                  <span className="text-[10px] uppercase tracking-tighter opacity-70">complete</span>
                </div>
              </div>

              {/* Decorative shapes */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -ml-16 -mb-16" />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Lessons Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">{student.lessonsCompleted}</div>
                <div className="text-sm text-gray-500 font-medium mb-3">Lessons completed</div>
                <div className="pt-3 border-t border-gray-50 text-blue-600 text-xs font-bold uppercase tracking-wider border-l-4 border-l-blue-600 pl-3">
                  {student.lessonsRemaining} remaining in package
                </div>
              </div>

              {/* Payment Status Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${paymentStatusStyle[student.paymentStatus]}`}
                >
                  {paymentStatusLabel[student.paymentStatus]}
                </div>
                <div className="text-sm text-gray-500 font-medium mt-3 mb-3">Payment status</div>
                <div className="pt-3 border-t border-gray-50 text-blue-600 text-xs font-bold uppercase tracking-wider border-l-4 border-l-blue-600 pl-3">
                  Ask the front desk for payment details.
                </div>
              </div>

              {/* Next Lesson Card */}
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {nextLessonDate ? nextLessonDate.toLocaleDateString('en-GB', { weekday: 'short' }) : 'None'}
                </div>
                <div className="text-sm text-gray-500 font-medium mb-3">Next lesson</div>
                <div className="pt-3 border-t border-gray-50 text-blue-600 text-xs font-bold uppercase tracking-wider border-l-4 border-l-blue-600 pl-3">
                  {nextLessonDate 
                    ? `${nextLessonDate.getDate()} ${nextLessonDate.toLocaleDateString('en-GB', { month: 'short' })} · ${nextLessonDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` 
                    : 'None booked'
                  }
                </div>
              </div>
            </div>

            {/* Book a Lesson Card */}
            <button 
              onClick={() => setActiveTab('book')}
              className="w-full bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 flex flex-col items-center justify-center group hover:border-blue-400 hover:bg-blue-50/30 transition-all active:scale-[0.99]"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-100 group-hover:scale-110 transition-all">
                <svg className="w-8 h-8 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="text-gray-500 font-bold group-hover:text-blue-700">Book a lesson</span>
            </button>
          </div>
        )}

        {activeTab === 'book' && (
          <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Select an available slot
            </h2>
            <StudentPortalBooker 
              studentId={student.id} 
              studentToken={token} 
              durationMinutes={student.coursePackage?.durationMinutes || 60} 
            />
          </div>
        )}

        {(activeTab === 'progress' || activeTab === 'payments' || activeTab === 'settings') && (
          <div className="bg-white rounded-3xl p-20 flex flex-col items-center justify-center text-center border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl">🚧</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 capitalize">{activeTab} section coming soon</h2>
            <p className="text-gray-500 max-w-sm">We&apos;re currently working on this part of your portal. Please check back later!</p>
            <button 
              onClick={() => setActiveTab('overview')}
              className="mt-8 text-blue-600 font-bold hover:underline"
            >
              Back to Overview
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-20">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center min-w-[64px] h-14 rounded-xl transition-all ${
              activeTab === item.id ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            <span className="text-[10px] font-bold mt-1 uppercase tracking-tighter">{item.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
