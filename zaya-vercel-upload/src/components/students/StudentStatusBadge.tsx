import type { PaymentStatus, ProgressStatus } from '@/types/student'

const paymentColors: Record<PaymentStatus, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PART_PAID: 'bg-yellow-100 text-yellow-700',
  FULLY_PAID: 'bg-green-100 text-green-700',
}

const paymentLabels: Record<PaymentStatus, string> = {
  UNPAID: 'Unpaid',
  PART_PAID: 'Part Paid',
  FULLY_PAID: 'Fully Paid',
}

const progressColors: Record<ProgressStatus, string> = {
  ACTIVE: 'bg-blue-100 text-blue-700',
  READY_FOR_TEST: 'bg-purple-100 text-purple-700',
  CERTIFICATE_ISSUED: 'bg-green-100 text-green-700',
}

const progressLabels: Record<ProgressStatus, string> = {
  ACTIVE: 'Active',
  READY_FOR_TEST: 'Ready for Test',
  CERTIFICATE_ISSUED: 'Certificate Issued',
}

interface Props {
  status: PaymentStatus | ProgressStatus
  type?: 'payment' | 'progress'
  size?: 'sm' | 'md'
}

export default function StudentStatusBadge({ status, type = 'payment', size = 'sm' }: Props) {
  const isPayment = type === 'payment'
  const colors = isPayment
    ? paymentColors[status as PaymentStatus]
    : progressColors[status as ProgressStatus]
  const label = isPayment
    ? paymentLabels[status as PaymentStatus]
    : progressLabels[status as ProgressStatus]

  const sizeClass = size === 'md' ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colors} ${sizeClass}`}>
      {label}
    </span>
  )
}
