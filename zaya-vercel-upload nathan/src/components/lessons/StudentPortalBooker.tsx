'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import toast from 'react-hot-toast'
import LessonStatusBadge from './LessonStatusBadge'

export default function StudentPortalBooker({ 
  studentId, studentToken, durationMinutes 
}: { 
  studentId: string, studentToken: string, durationMinutes: number 
}) {
  const qc = useQueryClient()
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0])

  // Get upcoming 7 dates
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  // Fetch slots
  const { data: availability } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['availability', dateStr],
    queryFn: () => fetch(`/api/availability?date=${dateStr}&studentToken=${studentToken}`).then(r => r.json()),
  })

  // Fetch upcoming lessons for this student
  const { data: upcomingLessons } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['student-lessons', studentId],
    queryFn: () => fetch(`/api/student-portal/lessons?studentToken=${studentToken}`).then(r => r.json())
  })

  const lessons = upcomingLessons?.data ?? []

  const book = useMutation({
    mutationFn: async (time: string) => {
      const r = await fetch('/api/student-portal/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          studentToken, // Auth bypass purely for portal mapped strictly
          scheduledDate: time,
          durationMinutes
        })
      })
      if (!r.ok) {
         const err = await r.json()
         throw new Error(err.error || 'Booking failed')
      }
      return r.json()
    },
    onSuccess: () => {
      toast.success('Lesson booked successfully!')
      qc.invalidateQueries({ queryKey: ['student-lessons'] })
      qc.invalidateQueries({ queryKey: ['availability'] })
    },
    onError: (e: any) => toast.error(e.message)
  })

  const checkin = useMutation({
     mutationFn: async (id: string) => {
       const r = await fetch(`/api/lessons/${id}/checkin`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ studentToken })
       })
       if (!r.ok) throw new Error('Check-in failed. Are you sure it is today?')
       return r.json()
     },
     onSuccess: () => {
       toast.success('Successfully checked in. Waiting for instructor!')
       qc.invalidateQueries({ queryKey: ['student-lessons'] })
     },
     onError: (e: any) => toast.error(e.message)
  })

  const today = new Date().toDateString()

  return (
    <div className="space-y-6">
      
      {/* Upcoming Lessons */}
      {lessons.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <h2 className="font-semibold text-gray-900">Your Upcoming Lessons</h2>
          {lessons.map((l: any) => {
             const ld = new Date(l.scheduledDate)
             const canCheckIn = ld.toDateString() === today

             return (
               <div key={l.id} className="p-4 border border-gray-100 rounded-xl bg-gray-50 flex flex-col gap-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <div className="font-bold text-gray-900">{ld.toDateString()}</div>
                     <div className="text-sm text-gray-600">{ld.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                   </div>
                   <LessonStatusBadge status={l.status} />
                 </div>
                 
                 {canCheckIn ? (
                   <button 
                     onClick={() => {
                        if (confirm('Verify your arrival at the school front desk?')) checkin.mutate(l.id)
                     }}
                     disabled={checkin.isPending}
                     className="mt-2 h-10 w-full bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors"
                   >
                     {checkin.isPending ? 'Checking in...' : 'Tap to Check-In Now'}
                   </button>
                 ) : (
                   <p className="text-xs text-gray-400 mt-1">Check-in opens on the day of your lesson.</p>
                 )}
               </div>
             )
          })}
        </div>
      )}

      {/* Book a Lesson */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Book a Lesson</h2>
        
        {/* Date scroller */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-2">
          {dates.map((d) => {
            const iso = d.toISOString().split('T')[0]
            const active = iso === dateStr
            return (
              <button
                key={iso}
                onClick={() => setDateStr(iso)}
                className={`flex-shrink-0 flex flex-col items-center justify-center h-16 w-14 rounded-xl border transition-colors ${
                  active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xs font-medium uppercase">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                <span className="text-lg font-bold leading-none mt-1">{d.getDate()}</span>
              </button>
            )
          })}
        </div>

        {/* Time slots */}
        {!availability ? (
          <div className="animate-pulse flex gap-2">
            <div className="h-10 w-24 bg-gray-100 rounded-xl" />
            <div className="h-10 w-24 bg-gray-100 rounded-xl" />
          </div>
        ) : availability.data.length === 0 ? (
          <p className="text-sm text-gray-500">No slots available on this date.</p>
        ) : (
          <div className="grid grid-cols-2 min-[380px]:grid-cols-3 gap-2">
            {availability.data.map((s: any) => {
              const display = new Date(s.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              return (
                <button
                  key={s.time}
                  disabled={!s.available || book.isPending}
                  onClick={() => {
                    if (confirm(`Book lesson at ${display}?`)) book.mutate(s.time)
                  }}
                  className={`
                    h-12 md:h-10 px-1 rounded-xl text-sm font-medium transition-colors border select-none active:scale-95 touch-manipulation
                    ${s.available ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50' : 
                      'bg-gray-50 border-gray-100 text-gray-400 opacity-50 cursor-not-allowed'}
                  `}
                >
                  {display}
                </button>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}
