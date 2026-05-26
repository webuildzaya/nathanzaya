export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'POS'

export interface Payment {
  id: string
  schoolId: string
  studentId: string
  amount: string // Decimal serialised as string from Prisma
  method: PaymentMethod
  paymentDate: string // ISO datetime string
  receiptUrl: string | null
  notes: string | null
  voided: boolean
  voidedAt: string | null
  voidedBy: string | null
  createdAt: string
}

export interface PaymentWithStudent extends Payment {
  student: {
    id: string
    fullName: string
    studentCode: string
    phone: string
  }
}

export interface PaymentDetail extends PaymentWithStudent {
  // Extended details for single payment view
}

export interface PaymentSummary {
  todayTotal: number
  weekTotal: number
  monthTotal: number
  byMethod: {
    CASH: number
    BANK_TRANSFER: number
    POS: number
  }
  totalOutstanding: number
}

export interface ReceiptData {
  school: {
    name: string
    address: string | null
    phone: string | null
    logoUrl: string | null
  }
  student: {
    fullName: string
    studentCode: string
    phone: string
  }
  payment: {
    id: string
    amount: number
    method: PaymentMethod
    paymentDate: string
    notes: string | null
  }
  balance: number
  receiptNumber: string
}

export interface RecordPaymentInput {
  studentId: string
  amount: number
  method: PaymentMethod
  paymentDate: string
  notes?: string
}

export interface PaymentsListResponse {
  data: PaymentWithStudent[]
  total: number
}

export interface StudentPaymentInfo {
  coursePackage: {
    name: string
    price: string
    totalLessons: number
  } | null
  totalPaid: number
  outstanding: number
  paymentStatus: 'UNPAID' | 'PART_PAID' | 'FULLY_PAID'
  payments: {
    id: string
    amount: string
    method: PaymentMethod
    paymentDate: string
    receiptUrl: string | null
    notes: string | null
    voided: boolean
    voidedAt: string | null
    voidedBy: string | null
    createdAt: string
  }[]
}
