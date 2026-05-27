'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import PaymentForm from '@/components/payments/PaymentForm'
import PaymentHistoryList from '@/components/payments/PaymentHistoryList'
import BalanceSummaryCard from '@/components/payments/BalanceSummaryCard'
import ReceiptPreviewModal from '@/components/payments/ReceiptPreviewModal'
import type { PaymentSummary } from '@/types/payment'

type Tab = 'record' | 'history'

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('record')

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery<{
    data: PaymentSummary
  }>({
    queryKey: ['payment-summary'],
    queryFn: () => fetch('/api/payments/summary').then((r) => r.json()),
    ...defaultQueryOptions,
    refetchInterval: 60_000,
  })

  return (
    <>
      <ReceiptPreviewModal />

      <div className="max-w-xl mx-auto space-y-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5">Record and track student payments</p>
        </div>

        {isSummaryLoading ? (
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        ) : summaryData?.data ? (
          <BalanceSummaryCard summary={summaryData.data} />
        ) : null}

        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            id="tab-record-payment"
            onClick={() => setActiveTab('record')}
            className={`flex-1 h-10 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'record'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Record Payment
          </button>
          <button
            id="tab-payment-history"
            onClick={() => setActiveTab('history')}
            className={`flex-1 h-10 text-sm font-medium rounded-lg transition-colors ${
              activeTab === 'history'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Payment History
          </button>
        </div>

        {activeTab === 'record' ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <PaymentForm />
          </div>
        ) : (
          <PaymentHistoryList />
        )}
      </div>
    </>
  )
}