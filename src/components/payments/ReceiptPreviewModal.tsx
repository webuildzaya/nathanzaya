'use client'

import { usePaymentStore } from '@/stores/paymentStore'
import Modal from '@/components/ui/Modal'

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('0')) return '234' + cleaned.slice(1)
  if (cleaned.startsWith('234')) return cleaned
  return '234' + cleaned
}

export default function ReceiptPreviewModal() {
  const { receiptModalOpen, receiptModalData, closeReceiptModal } = usePaymentStore()

  if (!receiptModalData) return null

  const {
    receiptUrl,
    receiptNumber,
    studentName,
    studentPhone,
    amount,
    paymentDate,
  } = receiptModalData

  const whatsappPhone = formatNigerianPhone(studentPhone)
  const formattedDate = new Date(paymentDate).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const whatsappMessage = encodeURIComponent(
    receiptUrl
      ? `Hi ${studentName}, here is your payment receipt for ${formatNaira(amount)} paid on ${formattedDate}.\n\nReceipt: ${receiptUrl}`
      : `Hi ${studentName}, your payment of ${formatNaira(amount)} was recorded on ${formattedDate}. Your receipt is currently unavailable.`
  )
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMessage}`

  return (
    <Modal isOpen={receiptModalOpen} onClose={closeReceiptModal} title="Payment Recorded">
      <div className="space-y-5">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center">
            <svg
              className="h-7 w-7 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Receipt summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Student</span>
            <span className="font-medium text-gray-900">{studentName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Amount</span>
            <span className="font-bold text-green-600">{formatNaira(amount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-gray-900">{formattedDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Receipt No.</span>
            <span className="font-medium text-gray-900">{receiptNumber}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          {receiptUrl ? (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </a>
          ) : (
            <button
              disabled
              className="h-11 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 font-semibold text-sm rounded-xl cursor-not-allowed"
            >
              Receipt unavailable
            </button>
          )}

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share via WhatsApp
          </a>
        </div>

        <button
          onClick={closeReceiptModal}
          className="w-full h-11 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}
