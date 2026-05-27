'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useDebounce } from '@/hooks/useDebounce'
import { useStudentStore } from '@/stores/studentStore'
import StudentCard from '@/components/students/StudentCard'
import StudentRegistrationForm from '@/components/students/StudentRegistrationForm'
import Modal from '@/components/ui/Modal'
import type { StudentsResponse, PaymentStatus } from '@/types/student'

const FILTERS: { label: string; value: 'ALL' | PaymentStatus }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Unpaid', value: 'UNPAID' },
  { label: 'Part Paid', value: 'PART_PAID' },
  { label: 'Fully Paid', value: 'FULLY_PAID' },
]

export default function StudentsPage() {
  const { search, paymentFilter, isFormOpen, setSearch, setPaymentFilter, openForm, closeForm } =
    useStudentStore()
  const debouncedSearch = useDebounce(search, 350)
  const [page, setPage] = useState(1)

  const handleFilterChange = (value: 'ALL' | PaymentStatus) => {
    setPaymentFilter(value)
    setPage(1)
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const { data, isLoading } = useQuery<StudentsResponse>({
    ...defaultQueryOptions,
    queryKey: ['students', debouncedSearch, paymentFilter, page],
    queryFn: () => {
      const params = new URLSearchParams()
      if (debouncedSearch) params.set('search', debouncedSearch)
      if (paymentFilter !== 'ALL') params.set('paymentStatus', paymentFilter)
      params.set('page', page.toString())
      return fetch(`/api/students?${params}`).then((r) => r.json())
    },
  })

  const students = data?.data ?? []
  const pagination = data?.pagination
  const total = pagination?.total ?? 0

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? '…' : `${total} student${total !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          id="open-register-form"
          onClick={openForm}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          Register
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          🔍
        </span>
        <input
          id="student-search"
          type="search"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, phone, or ID…"
          className="w-full h-12 pl-10 pr-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base bg-white"
        />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-5 scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`flex-shrink-0 h-9 px-4 rounded-full text-sm font-medium transition-colors ${
              paymentFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Student list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-16 w-full" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎓</p>
          <p className="font-semibold text-gray-900">No students found</p>
          <p className="text-sm text-gray-500 mt-1">
            {search || paymentFilter !== 'ALL'
              ? 'Try a different search or filter.'
              : 'Register your first student to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((s) => (
            <StudentCard key={s.id} student={s} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            Showing{' '}
            <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>{' '}
            to{' '}
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

      {/* Registration modal */}
      <Modal isOpen={isFormOpen} onClose={closeForm} title="Register Student">
        <StudentRegistrationForm onSuccess={closeForm} onCancel={closeForm} />
      </Modal>
    </div>
  )
}