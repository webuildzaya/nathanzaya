import { create } from 'zustand'
import type { ReceiptData } from '@/types/payment'

interface ReceiptModalData {
  paymentId: string
  receiptUrl: string | null
  receiptNumber: string
  studentName: string
  studentPhone: string
  amount: number
  paymentDate: string
}

interface PaymentStore {
  // Selected student for payment recording
  selectedStudentId: string | null
  selectedStudentName: string | null
  setSelectedStudent: (id: string | null, name: string | null) => void

  // Receipt modal state
  receiptModalOpen: boolean
  receiptModalData: ReceiptModalData | null
  openReceiptModal: (data: ReceiptModalData) => void
  closeReceiptModal: () => void

  // Receipt data for display
  currentReceiptData: ReceiptData | null
  setCurrentReceiptData: (data: ReceiptData | null) => void
}

export const usePaymentStore = create<PaymentStore>((set) => ({
  selectedStudentId: null,
  selectedStudentName: null,
  setSelectedStudent: (id, name) =>
    set({ selectedStudentId: id, selectedStudentName: name }),

  receiptModalOpen: false,
  receiptModalData: null,
  openReceiptModal: (data) =>
    set({ receiptModalOpen: true, receiptModalData: data }),
  closeReceiptModal: () =>
    set({ receiptModalOpen: false, receiptModalData: null }),

  currentReceiptData: null,
  setCurrentReceiptData: (data) => set({ currentReceiptData: data }),
}))
