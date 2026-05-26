'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import toast from 'react-hot-toast'
import { usePaymentStore } from '@/stores/paymentStore'
import type { PaymentMethod } from '@/types/payment'

interface StudentSummary {
  id: string
  fullName: string
  studentCode: string
  phone: string
  paymentStatus: 'UNPAID' | 'PART_PAID' | 'FULLY_PAID'
  coursePackage: {
    name: string
    price: string
  } | null
  totalPaid: number
  outstanding: number
}

interface PaymentFormProps {
  onSuccess?: () => void
  prefilledStudentId?: string
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const paymentStatusBadge: Record<string, string> = {
  UNPAID: 'bg-red-100 text-red-700',
  PART_PAID: 'bg-yellow-100 text-yellow-700',
  FULLY_PAID: 'bg-green-100 text-green-700',
}
const paymentStatusLabel: Record<string, string> = {
  UNPAID: 'Unpaid',
  PART_PAID: 'Part Paid',
  FULLY_PAID: 'Fully Paid',
}

const today = new Date().toISOString().split('T')[0]

export default function PaymentForm({ onSuccess, prefilledStudentId }: PaymentFormProps) {
  const { openReceiptModal } = usePaymentStore()

  // Student search state
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    prefilledStudentId ?? null
  )

  // Form fields
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('CASH')
  const [paymentDate, setPaymentDate] = useState(today)
  const [notes, setNotes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Search students
  const { data: searchResults, isFetching: isSearching } = useQuery<{
    data: StudentSummary[]
  }>({
    queryKey: ['student-search', searchTerm],
    queryFn: () =>
      fetch(`/api/students?search=${encodeURIComponent(searchTerm)}&limit=20`).then((r) =>
        r.json()
      ),
    enabled: searchTerm.length >= 2 && !selectedStudentId,
  })

  // Load selected student details
  const { data: studentData, isLoading: isLoadingStudent } = useQuery<{
    data: StudentSummary & { totalPaid: number; outstanding: number }
  }>({
    queryKey: ['student-payment-detail', selectedStudentId],
    queryFn: () => fetch(`/api/students/${selectedStudentId}`).then((r) => r.json()),
    enabled: !!selectedStudentId,
  })

  const student = studentData?.data

  // Record payment mutation
  const recordPayment = useMutation({
    mutationFn: (body: object) =>
      fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }).then((r) => r.json()),
    onSuccess: (json) => {
      if (json.error) {
        toast.error(json.error)
        return
      }
      const d = json.data
      // Open receipt modal
      openReceiptModal({
        paymentId: d.id,
        receiptUrl: d.receiptUrl,
        receiptNumber: d.receiptNumber,
        studentName: student?.fullName ?? '',
        studentPhone: student?.phone ?? '',
        amount: d.amount,
        paymentDate: d.paymentDate,
      })
      // Reset form
      setAmount('')
      setNotes('')
      setPaymentDate(today)
      setSelectedStudentId(prefilledStudentId ?? null)
      setSearchTerm('')
      toast.success('Payment recorded successfully')
      onSuccess?.()
    },
    onError: () => toast.error('Failed to record payment. Please try again.'),
  })

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!selectedStudentId) errs.student = 'Please select a student'
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      errs.amount = 'Enter a valid amount greater than zero'
    if (!paymentDate) errs.paymentDate = 'Select a payment date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    recordPayment.mutate({
      studentId: selectedStudentId,
      amount: Number(amount),
      method,
      paymentDate: new Date(paymentDate).toISOString(),
      notes: notes.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* ── Student search ───────────────────────── */}
      {!prefilledStudentId && (
        <div>
          <label htmlFor="student-search" className="block text-sm font-medium text-gray-700 mb-1">
            Student
          </label>
          {selectedStudentId ? (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 h-11">
              <span className="text-sm font-medium text-blue-800">
                {student?.fullName ?? '…'}{' '}
                <span className="font-normal text-blue-500">
                  {student?.studentCode}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedStudentId(null)
                  setSearchTerm('')
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                id="student-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or student code…"
                className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <span className="h-4 w-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                </div>
              )}
              {searchResults?.data && searchResults.data.length > 0 && searchTerm.length >= 2 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                  {searchResults.data.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(s.id)
                        setSearchTerm('')
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-900">{s.fullName}</p>
                      <p className="text-xs text-gray-400">{s.studentCode}</p>
                    </button>
                  ))}
                </div>
              )}
              {searchTerm.length >= 2 && !isSearching && searchResults?.data?.length === 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3">
                  <p className="text-sm text-gray-500">No students found</p>
                </div>
              )}
            </div>
          )}
          {errors.student && <p className="mt-1 text-xs text-red-600">{errors.student}</p>}
        </div>
      )}

      {/* ── Student payment summary ──────────────── */}
      {selectedStudentId && (
        <div>
          {isLoadingStudent ? (
            <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ) : student ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">{student.coursePackage?.name ?? 'No course'}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusBadge[student.paymentStatus]}`}
                >
                  {paymentStatusLabel[student.paymentStatus]}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Course fee</span>
                <span className="font-medium">
                  {formatNaira(Number(student.coursePackage?.price ?? 0))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total paid</span>
                <span className="font-medium text-green-600">{formatNaira(student.totalPaid)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="font-medium text-gray-700">Outstanding</span>
                <span
                  className={`font-bold ${student.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {formatNaira(student.outstanding)}
                </span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Amount ──────────────────────────────── */}
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
          Amount (₦)
        </label>
        <input
          id="amount"
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 50000"
          className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount}</p>}
      </div>

      {/* ── Payment method ───────────────────────── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div className="grid grid-cols-3 gap-2">
          {(['CASH', 'BANK_TRANSFER', 'POS'] as PaymentMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`h-11 rounded-xl text-sm font-medium border transition-colors ${
                method === m
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {m === 'BANK_TRANSFER' ? 'Transfer' : m === 'POS' ? 'POS' : 'Cash'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Date ────────────────────────────────── */}
      <div>
        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
          Payment Date
        </label>
        <input
          id="paymentDate"
          type="date"
          value={paymentDate}
          max={today}
          onChange={(e) => setPaymentDate(e.target.value)}
          className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {errors.paymentDate && (
          <p className="mt-1 text-xs text-red-600">{errors.paymentDate}</p>
        )}
      </div>

      {/* ── Notes (optional) ────────────────────── */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Notes{' '}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <input
          id="notes"
          type="text"
          maxLength={255}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. First instalment payment"
          className="w-full h-11 px-4 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* ── Submit ──────────────────────────────── */}
      <button
        id="record-payment-btn"
        type="submit"
        disabled={recordPayment.isPending}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {recordPayment.isPending ? (
          <>
            <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Recording…
          </>
        ) : (
          'Record Payment'
        )}
      </button>
    </form>
  )
}
