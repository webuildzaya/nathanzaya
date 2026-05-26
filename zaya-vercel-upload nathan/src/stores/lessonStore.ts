import { create } from 'zustand'

interface LessonState {
  selectedDate: Date
  instructorFilter: string
  isBookingFormOpen: boolean
  selectedLessonId: string | null
  viewMode: 'DAY' | 'WEEK'
  setSelectedDate: (date: Date) => void
  setInstructorFilter: (id: string) => void
  openBookingForm: () => void
  closeBookingForm: () => void
  openLessonDetail: (id: string) => void
  closeLessonDetail: () => void
  setViewMode: (mode: 'DAY' | 'WEEK') => void
}

export const useLessonStore = create<LessonState>((set) => ({
  selectedDate: new Date(),
  instructorFilter: 'ALL',
  isBookingFormOpen: false,
  selectedLessonId: null,
  viewMode: 'DAY',
  setSelectedDate: (date) => set({ selectedDate: date }),
  setInstructorFilter: (id) => set({ instructorFilter: id }),
  openBookingForm: () => set({ isBookingFormOpen: true }),
  closeBookingForm: () => set({ isBookingFormOpen: false }),
  openLessonDetail: (id) => set({ selectedLessonId: id }),
  closeLessonDetail: () => set({ selectedLessonId: null }),
  setViewMode: (mode) => set({ viewMode: mode }),
}))
