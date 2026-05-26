import type { LessonListItem } from '@/types/lesson'
import LessonStatusBadge from './LessonStatusBadge'

export default function LessonCard({ lesson, onClick }: { lesson: LessonListItem, onClick: () => void }) {
  const d = new Date(lesson.scheduledDate)
  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-2xl p-4 hover:border-blue-300 hover:shadow-sm transition-all focus:outline-none"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-bold text-gray-900 leading-tight">{lesson.student.fullName}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{lesson.student.studentCode}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="font-semibold text-gray-900 text-sm bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">
            {timeStr}
          </span>
        </div>
      </div>
      
      <div className="flex gap-2 text-xs text-gray-600 mb-3">
        {lesson.instructor && (
          <span className="flex items-center gap-1 bg-gray-50 px-2 h-6 rounded-md">
            👤 {lesson.instructor.fullName}
          </span>
        )}
        {lesson.vehicle && (
          <span className="flex items-center gap-1 bg-gray-50 px-2 h-6 rounded-md">
            🚗 {lesson.vehicle.name}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <LessonStatusBadge status={lesson.status} />
        <span className="text-blue-600 text-xs font-medium">View details →</span>
      </div>
    </button>
  )
}
