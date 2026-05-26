'use client'

import { create } from 'zustand'
import type { PaymentStatus } from '@/types/student'

interface StudentStore {
  search: string
  paymentFilter: PaymentStatus | 'ALL'
  isFormOpen: boolean
  setSearch: (q: string) => void
  setPaymentFilter: (f: PaymentStatus | 'ALL') => void
  openForm: () => void
  closeForm: () => void
}

export const useStudentStore = create<StudentStore>((set) => ({
  search: '',
  paymentFilter: 'ALL',
  isFormOpen: false,
  setSearch: (q) => set({ search: q }),
  setPaymentFilter: (f) => set({ paymentFilter: f }),
  openForm: () => set({ isFormOpen: true }),
  closeForm: () => set({ isFormOpen: false }),
}))
