'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import PaymentForm from './PaymentForm'
import type { StudentPaymentInfo } from '@/types/payment'

interface StudentPaymentSummaryProps {
  studentId: string
  studentName: string
  info: StudentPaymentInfo
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const methodLabel: Record<string, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Transfer',
  POS: 'POS',
}

const statusBadge: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PART_PAID: 'bg-yellow-100 text-yellow-700',
  FULLY_PAID: 'bg-green-100 text-green-700',
}
const statusLabel: Record<string, string> = {
  UNPAID: 'Unpaid',
  PART_PAID: 'Part Paid',
  FULLY_PAID: 'Fully Paid',
}

export default function StudentPaymentSummary({
  studentId,
  studentName,
  info,
}: StudentPaymentSummaryProps) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <div className="space-y-4">
      {/* Quick payment modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Record Payment — ${studentName}`}
      >
        <PaymentForm prefilledStudentId={studentId} onSuccess={() => setModalOpen(false)} />
      </Modal>

      {/* Summary card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Payments</h2>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge[info.paymentStatus]}`}
          >
            {statusLabel[info.paymentStatus]}
          </span>
        </div>

        {info.coursePackage ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Course fee</span>
              <span className="font-medium">{formatNaira(Number(info.coursePackage.price))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total paid</span>
              <span className="font-medium text-green-600">{formatNaira(info.totalPaid)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-medium text-gray-700">Outstanding</span>
              <span
                className={`font-bold ${info.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {info.outstanding > 0 ? formatNaira(info.outstanding) : 'Fully Paid ✓'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">No course package assigned</p>
        )}

        <button
          id={`record-payment-student-${studentId}`}
          onClick={() => setModalOpen(true)}
          className="mt-4 w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          + Record Payment
        </button>
      </div>

      {/* Payment history for this student */}
      {info.payments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment History</h3>
          <div className="divide-y divide-gray-100">
            {info.payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium tabular-nums ${p.voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                    {formatNaira(Number(p.amount))}
                  </p>
                  <p className="text-xs text-gray-400">
                    {methodLabel[p.method]} · {formatDate(p.paymentDate)}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-gray-400 truncate">{p.notes}</p>
                  )}
                </div>
                {p.voided && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Voided
                  </span>
                )}
                {!p.voided && p.receiptUrl && (
                  <a
                    href={p.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Download receipt"
                    className="h-9 w-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
