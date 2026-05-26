'use client'

import { useState } from 'react'
import type { PaymentMethod } from '@/types/payment'

interface PaymentRowProps {
  id: string
  studentName: string
  studentCode: string
  amount: string
  method: PaymentMethod
  paymentDate: string
  receiptUrl: string | null
  notes?: string | null
  voided?: boolean
  onVoid?: (id: string) => void
  canVoid?: boolean
}

function formatNaira(amount: string): string {
  return `₦${Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const methodLabel: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  BANK_TRANSFER: 'Bank Transfer',
  POS: 'POS',
}

const methodBadge: Record<PaymentMethod, string> = {
  CASH: 'bg-green-50 text-green-700',
  BANK_TRANSFER: 'bg-blue-50 text-blue-700',
  POS: 'bg-purple-50 text-purple-700',
}

export default function PaymentRow({
  id,
  studentName,
  studentCode,
  amount,
  method,
  paymentDate,
  receiptUrl,
  notes,
  voided = false,
  onVoid,
  canVoid = false,
}: PaymentRowProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      {/* ── Collapsed row — tap anywhere to expand ── */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 py-3 px-0 text-left focus:outline-none"
        aria-expanded={expanded}
        aria-label={`Payment from ${studentName} — ${formatNaira(amount)}`}
      >
        {/* Student info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{studentName}</p>
          <p className="text-xs text-gray-400">{studentCode} · {formatDate(paymentDate)}</p>
        </div>

        {/* Method badge */}
        {voided ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 bg-gray-100 text-gray-500">
            Voided
          </span>
        ) : (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${methodBadge[method]}`}
          >
            {methodLabel[method]}
          </span>
        )}

        {/* Amount */}
        <span className={`text-sm font-bold flex-shrink-0 tabular-nums ${voided ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
          {formatNaira(amount)}
        </span>

        {/* Expand chevron */}
        <svg
          className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="pb-3 space-y-3 animate-in fade-in duration-150">
          {/* Detail rows */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Full name</span>
              <span className="font-medium text-gray-900">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Student ID</span>
              <span className="font-medium text-gray-900">{studentCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount paid</span>
              <span className="font-bold text-gray-900 tabular-nums">{formatNaira(amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method</span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${methodBadge[method]}`}
              >
                {methodLabel[method]}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Date &amp; time</span>
              <span className="font-medium text-gray-900 text-right">{formatDateTime(paymentDate)}</span>
            </div>
            {notes && (
              <div className="flex justify-between gap-4">
                <span className="text-gray-500 flex-shrink-0">Notes</span>
                <span className="font-medium text-gray-900 text-right">{notes}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!voided && receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium transition-colors hover:bg-blue-100 active:bg-blue-200"
                onClick={(e) => e.stopPropagation()}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Receipt
              </a>
            ) : (
              <div className="flex-1 flex items-center justify-center h-10 rounded-lg border border-gray-200 text-gray-400 text-sm">
                Receipt unavailable
              </div>
            )}

            {!voided && canVoid && onVoid && (
              <button
                id={`void-payment-${id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm('Void this payment? This cannot be undone.')) {
                    onVoid(id)
                  }
                }}
                aria-label="Void payment"
                className="h-10 px-4 flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium transition-colors hover:bg-red-100 active:bg-red-200 flex-shrink-0"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Void
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
