'use client'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import toast from 'react-hot-toast'
import Link from 'next/link'
import LessonStatusBadge from './LessonStatusBadge'

export default function LessonDetailPanel({ lessonId, onClose, role }: { lessonId: string, onClose: () => void, role: string }) {
  const qc = useQueryClient()

  const { data: lesson, isLoading } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['lesson', lessonId],
    queryFn: () => fetch(`/api/lessons/${lessonId}`).then(r => r.json())
  })

  const updateStatus = useMutation({
    mutationFn: async (status: string) => {
      const r = await fetch(`/api/lessons/${lessonId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!r.ok) throw new Error('Update failed')
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lessons'] })
      qc.invalidateQueries({ queryKey: ['lesson', lessonId] })
      toast.success('Lesson status updated')
    },
    onError: () => toast.error('Failed to update status')
  })

  // Skeleton
  if (isLoading) return <div className="p-5 animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded-lg w-1/2" /></div>
  
  if (!lesson || lesson.error) return <div className="p-5 text-red-500">Lesson not found</div>

  const d = new Date(lesson.scheduledDate)

  return (
    <div className="p-1">
      <div className="mb-6 pb-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          {role !== 'INSTRUCTOR' ? (
            <Link href={`/students/${lesson.student.id}`} className="hover:underline hover:text-blue-600">
              {lesson.student.fullName}
            </Link>
          ) : (
            lesson.student.fullName
          )}
        </h2>
        <p className="text-gray-500 text-sm mb-4">{lesson.student.phone}</p>
        <LessonStatusBadge status={lesson.status} size="md" />
      </div>

      <dl className="space-y-4 text-sm mb-8">
        <div>
          <dt className="text-gray-500 mb-1">Date & Time</dt>
          <dd className="font-medium text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-100">
            {d.toDateString()} at {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </dd>
        </div>
        
        {lesson.instructor && (
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <dt className="text-gray-500">Instructor</dt>
            <dd className="font-medium text-gray-900">{lesson.instructor.fullName}</dd>
          </div>
        )}
        
        {lesson.vehicle && (
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <dt className="text-gray-500">Vehicle</dt>
            <dd className="font-medium text-gray-900">{lesson.vehicle.name}</dd>
          </div>
        )}

        {lesson.checkedInAt && (
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <dt className="text-gray-500">Checked In</dt>
            <dd className="font-medium text-purple-600">{new Date(lesson.checkedInAt).toLocaleTimeString()}</dd>
          </div>
        )}
      </dl>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Actions</p>
        
        {(lesson.status === 'SCHEDULED' || lesson.status === 'CHECKED_IN') && (
          <button
            onClick={() => {
              if (confirm('Mark lesson as fully completed?')) updateStatus.mutate('COMPLETED')
            }}
            disabled={updateStatus.isPending}
            className="w-full h-11 bg-green-50 text-green-700 font-bold rounded-xl hover:bg-green-100 transition-colors"
          >
            Mark as Completed
          </button>
        )}

        {lesson.status === 'SCHEDULED' && (
          <button
            onClick={() => {
              if (confirm('Mark lesson as missed by student?')) updateStatus.mutate('MISSED')
            }}
            disabled={updateStatus.isPending}
            className="w-full h-11 bg-red-50 text-red-700 font-bold rounded-xl hover:bg-red-100 transition-colors"
          >
            Mark as Missed
          </button>
        )}

        {lesson.status === 'SCHEDULED' && (
          <button
            onClick={() => {
              if (confirm('Move to rescheduled status?')) updateStatus.mutate('RESCHEDULED')
            }}
            disabled={updateStatus.isPending}
            className="w-full h-11 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Reschedule
          </button>
        )}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100 text-center">
        <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:text-gray-900">
          Close Panel
        </button>
      </div>
    </div>
  )
}
