import { create } from 'zustand'

interface LessonStore {
  selectedDate: Date
  instructorFilter: string
  isBookingFormOpen: boolean
  selectedLessonId: string | null

  setSelectedDate: (date: Date) => void
  setInstructorFilter: (id: string) => void
  openBookingForm: () => void
  closeBookingForm: () => void
  openLessonDetail: (id: string) => void
  closeLessonDetail: () => void
}

export const useLessonStore = create<LessonStore>((set) => ({
  selectedDate: new Date(),
  instructorFilter: 'ALL',
  isBookingFormOpen: false,
  selectedLessonId: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setInstructorFilter: (id) => set({ instructorFilter: id }),
  openBookingForm: () => set({ isBookingFormOpen: true }),
  closeBookingForm: () => set({ isBookingFormOpen: false }),
  openLessonDetail: (id) => set({ selectedLessonId: id }),
  closeLessonDetail: () => set({ selectedLessonId: null }),
}))