'use client'

import type { PaymentSummary } from '@/types/payment'

interface BalanceSummaryCardProps {
  summary: PaymentSummary
  isLoading?: boolean
}

function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${accent ?? 'text-gray-900'} tabular-nums`}>{value}</p>
    </div>
  )
}

export default function BalanceSummaryCard({ summary, isLoading }: BalanceSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Main stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Today's Collections" value={formatNaira(summary.todayTotal)} accent="text-blue-600" />
        <StatBox label="This Week" value={formatNaira(summary.weekTotal)} />
        <StatBox label="This Month" value={formatNaira(summary.monthTotal)} />
        <StatBox
          label="Total Outstanding"
          value={formatNaira(summary.totalOutstanding)}
          accent={summary.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}
        />
      </div>

      {/* Breakdown by method */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          All-Time by Payment Method
        </p>
        <div className="space-y-2">
          {(
            [
              { key: 'CASH', label: 'Cash', color: 'bg-green-500' },
              { key: 'BANK_TRANSFER', label: 'Bank Transfer', color: 'bg-blue-500' },
              { key: 'POS', label: 'POS', color: 'bg-purple-500' },
            ] as const
          ).map(({ key, label, color }) => {
            const val = summary.byMethod[key]
            const total =
              summary.byMethod.CASH + summary.byMethod.BANK_TRANSFER + summary.byMethod.POS
            const pct = total > 0 ? Math.round((val / total) * 100) : 0
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{label}</span>
                  <span className="font-medium tabular-nums">{formatNaira(val)}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${color} rounded-full transition-all duration-500`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
