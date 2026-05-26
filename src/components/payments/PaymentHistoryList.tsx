'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import PaymentRow from './PaymentRow'
import type { PaymentWithStudent, PaymentMethod } from '@/types/payment'

interface PaymentHistoryListProps {
  /** If provided, shows only this student's payments (no filters bar) */
  studentId?: string
}

// ── Date grouping helpers ──────────────────────────────────────────────────────

function toDateKey(isoString: string): string {
  // Returns "YYYY-MM-DD" in local time so groups match the calendar day
  return new Date(isoString).toLocaleDateString('en-CA') // en-CA gives YYYY-MM-DD
}

function friendlyDateHeader(dateKey: string): string {
  const d = new Date(dateKey + 'T12:00:00') // noon to avoid DST edge cases
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday = d.toDateString() === today.toDateString()
  const isYesterday = d.toDateString() === yesterday.toDateString()

  if (isToday) return 'Today'
  if (isYesterday) return 'Yesterday'

  return d.toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Group a flat payments array into ordered date buckets */
function groupByDate(
  payments: PaymentWithStudent[]
): { dateKey: string; payments: PaymentWithStudent[] }[] {
  const map = new Map<string, PaymentWithStudent[]>()

  for (const p of payments) {
    const key = toDateKey(p.paymentDate)
    const bucket = map.get(key) ?? []
    bucket.push(p)
    map.set(key, bucket)
  }

  // Sort descending (most recent date first)
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateKey, payments]) => ({ dateKey, payments }))
}

// ── Skeleton loader ────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden space-y-px">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="h-16 bg-gray-200 animate-pulse rounded-lg"
          style={{ opacity: 1 - i * 0.12 }}
        />
      ))}
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl py-14 text-center">
      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700">
        {hasFilters ? 'No payments match your filters' : 'No payments recorded yet'}
      </p>
      <p className="text-xs text-gray-400 mt-1">
        {hasFilters ? 'Try changing the date range or payment method' : 'Payments will appear here once recorded'}
      </p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
const today = new Date().toISOString().split('T')[0]

export default function PaymentHistoryList({ studentId }: PaymentHistoryListProps) {
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as { role?: string })?.role === 'SUPER_ADMIN'
  const queryClient = useQueryClient()

  // ── Filters (only shown when not scoped to a single student) ──
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const hasFilters = !!(startDate || endDate || method)

  const params = new URLSearchParams()
  if (studentId) params.set('studentId', studentId)
  if (startDate) params.set('startDate', new Date(startDate).toISOString())
  if (endDate) {
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)
    params.set('endDate', end.toISOString())
  }
  if (method) params.set('method', method)
  
  const [page, setPage] = useState(1)
  params.set('page', page.toString())

  const { data, isLoading } = useQuery<any>({
    ...defaultQueryOptions,
    queryKey: ['payments', studentId, startDate, endDate, method, page],
    queryFn: () => fetch(`/api/payments?${params.toString()}`).then((r) => r.json()),
  })

  const voidPayment = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/payments/${id}`, { method: 'DELETE' }).then((r) => r.json()),
    onSuccess: (json) => {
      if (json.error) {
        toast.error(json.error)
        return
      }
      toast.success('Payment voided')
      queryClient.invalidateQueries({ queryKey: ['payments'] })
      queryClient.invalidateQueries({ queryKey: ['payment-summary'] })
      queryClient.invalidateQueries({ queryKey: ['student'] })
    },
    onError: () => toast.error('Failed to void payment'),
  })

  const payments = data?.data ?? []
  const pagination = data?.pagination
  const grouped = groupByDate(payments)

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* Filters bar — hidden when viewing a single student's payments */}
      {!studentId && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Filter</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="filter-start" className="block text-xs text-gray-500 mb-1">
                From date
              </label>
              <input
                id="filter-start"
                type="date"
                value={startDate}
                max={endDate || today}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="filter-end" className="block text-xs text-gray-500 mb-1">
                To date
              </label>
              <input
                id="filter-end"
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filter-method" className="block text-xs text-gray-500 mb-1">
              Payment method
            </label>
            <select
              id="filter-method"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod | '')}
              className="w-full h-11 px-3 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="POS">POS</option>
            </select>
          </div>

          {hasFilters && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {payments.length} result{payments.length !== 1 ? 's' : ''}
              </p>
              <button
                type="button"
                onClick={() => { setStartDate(''); setEndDate(''); setMethod('') }}
                className="text-xs text-blue-600 hover:underline"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && <Skeleton />}

      {/* Empty state */}
      {!isLoading && payments.length === 0 && (
        <EmptyState hasFilters={hasFilters} />
      )}

      {/* Date-grouped payment list */}
      {!isLoading && grouped.length > 0 && (
        <div className="space-y-4">
          {grouped.map(({ dateKey, payments: dayPayments }) => {
            const dayTotal = dayPayments.reduce((sum, p) => sum + (p.voided ? 0 : Number(p.amount)), 0)

            return (
              <div key={dateKey}>
                {/* Date header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {friendlyDateHeader(dateKey)}
                  </p>
                  <p className="text-xs font-semibold text-gray-500 tabular-nums">
                    ₦{dayTotal.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                </div>

                {/* Payments for this day */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden px-4">
                  {dayPayments.map((p) => (
                    <PaymentRow
                      key={p.id}
                      id={p.id}
                      studentName={p.student.fullName}
                      studentCode={p.student.studentCode}
                      amount={p.amount}
                      method={p.method}
                      paymentDate={p.paymentDate}
                      receiptUrl={p.receiptUrl}
                      notes={p.notes}
                      voided={p.voided}
                      canVoid={isSuperAdmin}
                      onVoid={(id) => voidPayment.mutate(id)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-medium">{pagination.total}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
