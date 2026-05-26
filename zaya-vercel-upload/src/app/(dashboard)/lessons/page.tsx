'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useLessonStore } from '@/stores/lessonStore'
import { useSession } from 'next-auth/react'
import Modal from '@/components/ui/Modal'
import LessonBookingForm from '@/components/lessons/LessonBookingForm'
import LessonDetailPanel from '@/components/lessons/LessonDetailPanel'
import LessonCard from '@/components/lessons/LessonCard'

export default function LessonsPage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || 'STAFF'

  const { 
    selectedDate, instructorFilter, isBookingFormOpen, selectedLessonId,
    setSelectedDate, setInstructorFilter, openBookingForm, closeBookingForm,
    openLessonDetail, closeLessonDetail 
  } = useLessonStore()

  const [page, setPage] = useState(1)

  const { data: instructors } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['instructors'],
    queryFn: () => fetch('/api/instructors').then(r => r.json())
  })

  const { data, isLoading } = useQuery<any>({
    ...defaultQueryOptions,
    queryKey: ['lessons', selectedDate.toISOString().split('T')[0], instructorFilter, page],
    queryFn: () => {
      const p = new URLSearchParams()
      p.set('date', selectedDate.toISOString())
      if (instructorFilter !== 'ALL') p.set('instructorId', instructorFilter)
      p.set('page', page.toString())
      return fetch(`/api/lessons?${p}`).then(r => r.json())
    }
  })

  const lessons = data?.data ?? []
  const pagination = data?.pagination

  // Date controls
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Lessons Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage schedules and bookings</p>
        </div>
        
        <button
          onClick={openBookingForm}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          Book Lesson
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center justify-between md:justify-start gap-4">
            <button onClick={() => adjustDate(-1)} className="h-10 w-10 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center">
              ←
            </button>
            <div className="text-center md:text-left min-w-[150px]">
              <div className="font-bold text-gray-900">{selectedDate.toLocaleDateString([], { weekday: 'long' })}</div>
              <div className="text-sm text-gray-500">{selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
            <button onClick={() => adjustDate(1)} className="h-10 w-10 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center">
              →
            </button>
            {!isToday && (
              <button onClick={() => setSelectedDate(new Date())} className="text-sm font-medium text-blue-600 hover:text-blue-700 hidden md:block ml-4">
                Today
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <select
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              className="h-10 px-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 flex-1 md:w-48"
            >
              <option value="ALL">All Instructors</option>
              {instructors?.map((i: any) => (
                <option key={i.id} value={i.id}>{i.fullName}</option>
              ))}
            </select>
          </div>

        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-28 w-full" />
          ))}
        </div>
      ) : lessons?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📭</p>
          <p className="font-semibold text-gray-900">No lessons scheduled</p>
          <p className="text-sm text-gray-500 mt-1">There are no lessons booked for this date.</p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {lessons?.map((l: any) => (
            <LessonCard key={l.id} lesson={l} onClick={() => openLessonDetail(l.id)} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      <Modal isOpen={isBookingFormOpen} onClose={closeBookingForm} title="Book Lesson">
        <LessonBookingForm 
          onSuccess={closeBookingForm} 
          onCancel={closeBookingForm} 
          preselectedDate={selectedDate}
        />
      </Modal>

      {/* Detail Slide/Modal */}
      <Modal isOpen={!!selectedLessonId} onClose={closeLessonDetail} title="Lesson Details">
        {selectedLessonId && <LessonDetailPanel lessonId={selectedLessonId} onClose={closeLessonDetail} role={role} />}
      </Modal>

    </div>
  )
}
