import type { LessonStatus } from '@/types/lesson'

export default function LessonStatusBadge({ status, size = 'sm' }: { status: LessonStatus; size?: 'sm' | 'md' }) {
  const colours: Record<LessonStatus, string> = {
    SCHEDULED: 'bg-blue-100 text-blue-700',
    CHECKED_IN: 'bg-purple-100 text-purple-700',
    COMPLETED: 'bg-green-100 text-green-700',
    MISSED: 'bg-red-100 text-red-700',
    RESCHEDULED: 'bg-yellow-100 text-yellow-700',
  }

  const padded = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 inline-flex text-xs h-6 items-center'

  return (
    <span className={`rounded-full font-medium ${colours[status]} ${padded}`}>
      {status.replace('_', ' ')}
    </span>
  )
}
