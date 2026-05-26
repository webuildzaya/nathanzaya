export type LessonStatus = 'SCHEDULED' | 'CHECKED_IN' | 'COMPLETED' | 'MISSED' | 'RESCHEDULED'

export interface Instructor {
  id: string
  fullName: string
  phone: string | null
  isActive: boolean
}

export interface Vehicle {
  id: string
  name: string
  type: string | null
  isActive: boolean
}

export interface LessonDetail {
  id: string
  scheduledDate: string
  durationMinutes: number
  status: LessonStatus
  checkedInAt: string | null
  completedAt: string | null
  notes: string | null
  student: {
    id: string
    fullName: string
    studentCode: string
    phone: string
  }
  instructor: {
    id: string
    fullName: string
  } | null
  vehicle: {
    id: string
    name: string
  } | null
}

// Lighter shape for the lessons *list* view.
// The list UI doesn’t need full detail fields like phone/duration/notes.
export interface LessonListItem {
  id: string
  scheduledDate: string
  status: LessonStatus
  student: {
    id: string
    fullName: string
    studentCode: string
  }
  instructor: {
    id: string
    fullName: string
  } | null
  vehicle: {
    id: string
    name: string
  } | null
}

export interface TimeSlot {
  time: string // ISO string or HH:mm
  available: boolean
}
