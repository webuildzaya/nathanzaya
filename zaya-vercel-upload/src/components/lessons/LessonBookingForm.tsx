'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import toast from 'react-hot-toast'
import TimeSlotPicker from './TimeSlotPicker'

export default function LessonBookingForm({ onSuccess, onCancel, preselectedDate }: { onSuccess: () => void, onCancel: () => void, preselectedDate: Date }) {
  const qc = useQueryClient()
  const [studentSearch, setStudentSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(preselectedDate.toISOString().split('T')[0])
  const [time, setTime] = useState('')
  const [instructorId, setInstructorId] = useState('')
  const [vehicleId, setVehicleId] = useState('')

  // Data fetching
  const { data: students } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['students', studentSearch],
    queryFn: () => fetch(`/api/students?search=${studentSearch}`).then(r => r.json()).then(d => d.data || [])
  })
  
  const { data: instructors } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['instructors'],
    queryFn: () => fetch('/api/instructors').then(r => r.json())
  })

  const { data: vehicles } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['vehicles'],
    queryFn: () => fetch('/api/vehicles').then(r => r.json())
  })

  const { data: availability } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['availability', date, instructorId, vehicleId],
    queryFn: () => {
      const p = new URLSearchParams()
      p.set('date', date)
      if (instructorId) p.set('instructorId', instructorId)
      if (vehicleId) p.set('vehicleId', vehicleId)
      return fetch(`/api/availability?${p}`).then(r => r.json())
    },
    enabled: !!date
  })

  const book = useMutation({
    mutationFn: async (payload: any) => {
      const r = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) {
        const error = await r.json()
        throw new Error(error.error || 'Server error')
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] })
      qc.invalidateQueries({ queryKey: ['availability'] })
      toast.success('Lesson booked successfully')
      onSuccess()
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!studentId || !date || !time) return toast.error('Student and Time slot are required')

    book.mutate({
      studentId,
      instructorId: instructorId || undefined,
      vehicleId: vehicleId || undefined,
      scheduledDate: time,
      durationMinutes: availability?.durationMinutes || 60
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
        <div className="space-y-2">
          {!studentId ? (
            <>
              <input
                type="text"
                placeholder="Search name or ID..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {studentSearch && students?.length > 0 && (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-40 overflow-y-auto">
                  {students.map((s: any) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => { setStudentId(s.id); setStudentSearch(s.fullName) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b last:border-0"
                    >
                      <span className="font-medium text-gray-900">{s.fullName}</span>
                      <span className="text-gray-500 ml-2">{s.studentCode}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between h-11 px-3 border border-gray-200 rounded-xl bg-gray-50">
              <span className="text-sm font-medium text-gray-900">{studentSearch}</span>
              <button type="button" onClick={() => setStudentId('')} className="text-gray-400 hover:text-red-600">✕</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            required
            value={date}
            onChange={e => { setDate(e.target.value); setTime('') }}
            className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Instructor (Optional)</label>
          <select
            value={instructorId}
            onChange={e => { setInstructorId(e.target.value); setTime('') }}
            className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">Any Instructor</option>
            {instructors?.map((i: any) => (
              <option key={i.id} value={i.id}>{i.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle (Optional)</label>
        <select
          value={vehicleId}
          onChange={e => { setVehicleId(e.target.value); setTime('') }}
          className="w-full h-11 px-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">Any Vehicle</option>
          {vehicles?.map((v: any) => (
            <option key={v.id} value={v.id}>{v.name} {v.type ? `(${v.type})` : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots</label>
        <TimeSlotPicker slots={availability?.data} value={time} onChange={setTime} />
      </div>

      <div className="pt-4 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 h-11 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={book.isPending || !time || !studentId}
          className="flex-1 h-11 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {book.isPending ? 'Booking...' : 'Book Lesson'}
        </button>
      </div>
    </form>
  )
}
