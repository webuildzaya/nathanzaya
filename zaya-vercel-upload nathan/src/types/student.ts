export type PaymentStatus = 'UNPAID' | 'PART_PAID' | 'FULLY_PAID'
export type ProgressStatus = 'ACTIVE' | 'READY_FOR_TEST' | 'CERTIFICATE_ISSUED'

export interface CoursePackage {
  id: string
  name: string
  totalLessons: number
  price: string // Decimal serialised as string from Prisma
  durationMinutes: number
  isActive: boolean
}

export interface StudentListItem {
  id: string
  studentCode: string
  fullName: string
  phone: string
  email: string | null
  photoUrl: string | null
  paymentStatus: PaymentStatus
  progressStatus: ProgressStatus
  lessonsCompleted: number
  createdAt: string
  coursePackage: {
    id: string
    name: string
    totalLessons: number
    price: string
    durationMinutes: number
  } | null
}

export interface StudentDetail extends StudentListItem {
  address: string | null
  coursePackageId: string | null
  _count: {
    lessons: number
    payments: number
  }
  payments: {
    id: string
    amount: string
    method: string
    paymentDate: string
    receiptUrl: string | null
    notes: string | null
    voided: boolean
    voidedAt: string | null
    voidedBy: string | null
  }[]
  totalPaid: number
  outstanding: number
}

export interface StudentsResponse {
  data: StudentListItem[]
  total: number
  page: number
  pageSize: number
}

export interface RegisterStudentInput {
  fullName: string
  phone: string
  email?: string
  address?: string
  coursePackageId?: string
}
