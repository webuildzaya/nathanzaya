'use client'

import { useQuery } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useSession } from 'next-auth/react'
import LessonCard from '@/components/lessons/LessonCard'
import Modal from '@/components/ui/Modal'
import LessonDetailPanel from '@/components/lessons/LessonDetailPanel'
import { useState } from 'react'

export default function SchedulePage() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role || 'INSTRUCTOR'
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null)

  const { data: lessons, isLoading } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['lessons', selectedDate.toISOString().split('T')[0], 'my-schedule'],
    queryFn: () => {
      const p = new URLSearchParams()
      p.set('date', selectedDate.toISOString())
      return fetch(`/api/lessons?${p}`).then(r => r.json())
    }
  })

  // Date controls
  const adjustDate = (days: number) => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + days)
    setSelectedDate(d)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-gray-900">My Schedule</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your upcoming lessons</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <button onClick={() => adjustDate(-1)} className="h-10 w-10 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center">
            ←
          </button>
          
          <div className="text-center">
            <div className="font-bold text-gray-900">{selectedDate.toLocaleDateString([], { weekday: 'long' })}</div>
            <div className="text-sm text-gray-500">{selectedDate.toLocaleDateString([], { month: 'long', day: 'numeric' })}</div>
            {!isToday && (
              <button onClick={() => setSelectedDate(new Date())} className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-1">
                Back to Today
              </button>
            )}
          </div>
          
          <button onClick={() => adjustDate(1)} className="h-10 w-10 border border-gray-200 rounded-xl hover:bg-gray-50 flex items-center justify-center">
            →
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : lessons?.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">☕</p>
          <p className="font-semibold text-gray-900">No lessons today</p>
          <p className="text-sm text-gray-500 mt-1">Your schedule is clear.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {lessons?.map((l: any) => (
            <LessonCard key={l.id} lesson={l} onClick={() => setSelectedLessonId(l.id)} />
          ))}
        </div>
      )}

      {/* Detail Slide/Modal */}
      <Modal isOpen={!!selectedLessonId} onClose={() => setSelectedLessonId(null)} title="Lesson Details">
        {selectedLessonId && <LessonDetailPanel lessonId={selectedLessonId} onClose={() => setSelectedLessonId(null)} role={role} />}
      </Modal>
    </div>
  )
}
