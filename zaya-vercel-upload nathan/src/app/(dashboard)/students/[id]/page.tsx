'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import StudentStatusBadge from '@/components/students/StudentStatusBadge'
import ProgressBar from '@/components/students/ProgressBar'
import Modal from '@/components/ui/Modal'
import StudentPaymentSummary from '@/components/payments/StudentPaymentSummary'
import ReceiptPreviewModal from '@/components/payments/ReceiptPreviewModal'
import type { StudentDetail } from '@/types/student'
import type { StudentPaymentInfo } from '@/types/payment'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const isSuperAdmin = (session?.user as { role?: string })?.role === 'SUPER_ADMIN'

  const [showLinkModal, setShowLinkModal] = useState(false)
  const [magicLink, setMagicLink] = useState('')
  const [copied, setCopied] = useState(false)

  const { data, isLoading, isError } = useQuery<{ data: StudentDetail }>({
    ...defaultQueryOptions,
    queryKey: ['student', id],
    queryFn: () => fetch(`/api/students/${id}`).then((r) => r.json()),
  })

  const resetToken = useMutation({
    mutationFn: () =>
      fetch(`/api/students/${id}/reset-token`, { method: 'POST' }).then((r) => r.json()),
    onSuccess: (json: { magicLink?: string; error?: string }) => {
      if (json.magicLink) {
        setMagicLink(json.magicLink)
        setShowLinkModal(true)
        queryClient.invalidateQueries({ queryKey: ['student', id] })
      } else {
        toast.error(json.error ?? 'Failed to regenerate link')
      }
    },
    onError: () => toast.error('Could not regenerate link'),
  })

  function copyLink() {
    navigator.clipboard.writeText(magicLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />
        <div className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (isError || !data?.data) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500">Student not found.</p>
        <button onClick={() => router.push('/students')} className="mt-4 text-blue-600 text-sm">
          ← Back to Students
        </button>
      </div>
    )
  }

  const s = data.data
  const initials = s.fullName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="max-w-xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push('/students')}
        className="text-sm text-gray-500 flex items-center gap-1 hover:text-gray-900"
      >
        ← Students
      </button>

      {/* Profile header card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {s.photoUrl ? (
              <Image
                src={s.photoUrl}
                alt={s.fullName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-blue-600 font-bold text-xl">{initials}</span>
            )}
          </div>

          {/* Name + code */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">{s.fullName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">{s.studentCode}</p>
            <p className="text-xs text-gray-400 mt-0.5">Enrolled {formatDate(s.createdAt)}</p>
          </div>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2 mt-4">
          <StudentStatusBadge status={s.paymentStatus} type="payment" size="md" />
          <StudentStatusBadge status={s.progressStatus} type="progress" size="md" />
        </div>
      </div>

      {/* Progress */}
      {s.coursePackage && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-gray-900">Course Progress</h2>
          <p className="text-sm text-gray-600">{s.coursePackage.name}</p>
          <ProgressBar completed={s.lessonsCompleted} total={s.coursePackage.totalLessons} />
        </div>
      )}

      {/* Payments section — full summary + history */}
      <ReceiptPreviewModal />
      <StudentPaymentSummary
        studentId={s.id}
        studentName={s.fullName}
        info={{
          coursePackage: s.coursePackage
            ? {
                name: s.coursePackage.name,
                price: s.coursePackage.price,
                totalLessons: s.coursePackage.totalLessons,
              }
            : null,
          totalPaid: s.totalPaid,
          outstanding: s.outstanding,
          paymentStatus: s.paymentStatus,
          payments: (s.payments ?? []).map((p) => ({
            id: p.id,
            amount: p.amount,
            method: p.method as 'CASH' | 'BANK_TRANSFER' | 'POS',
            paymentDate: p.paymentDate,
            receiptUrl: p.receiptUrl,
            notes: p.notes,
            voided: p.voided,
            voidedAt: p.voidedAt,
            voidedBy: p.voidedBy,
            createdAt: p.paymentDate,
          })),
        } satisfies StudentPaymentInfo}
      />

      {/* Contact details */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 className="font-semibold text-gray-900 mb-3">Contact Details</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="text-gray-500 w-16 flex-shrink-0">Phone</dt>
            <dd className="text-gray-900 font-medium">{s.phone}</dd>
          </div>
          {s.email && (
            <div className="flex gap-2">
              <dt className="text-gray-500 w-16 flex-shrink-0">Email</dt>
              <dd className="text-gray-900 truncate">{s.email}</dd>
            </div>
          )}
          {s.address && (
            <div className="flex gap-2">
              <dt className="text-gray-500 w-16 flex-shrink-0">Address</dt>
              <dd className="text-gray-900">{s.address}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Regenerate login link — SUPER_ADMIN only */}
      {isSuperAdmin && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 className="font-semibold text-gray-900 mb-1">Student Portal Access</h2>
          <p className="text-xs text-gray-500 mb-3">
            Share this link with the student so they can access their portal. If they lose access,
            regenerate a new link below.
          </p>
          <button
            id="regenerate-token-btn"
            onClick={() => {
              if (confirm(`Regenerate login link for ${s.fullName}? The old link will stop working.`)) {
                resetToken.mutate()
              }
            }}
            disabled={resetToken.isPending}
            className="h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {resetToken.isPending ? (
              <>
                <span className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                Regenerating…
              </>
            ) : (
              '🔗 Regenerate Login Link'
            )}
          </button>
        </div>
      )}

      {/* Magic link modal */}
      <Modal isOpen={showLinkModal} onClose={() => setShowLinkModal(false)} title="New Login Link">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            A new login link has been generated. Share it with the student. The previous link is now
            invalid.
          </p>
          <div className="flex gap-2">
            <input
              id="magic-link-input"
              readOnly
              value={magicLink}
              className="flex-1 h-11 px-3 border border-gray-200 rounded-xl text-xs text-gray-700 bg-gray-50 focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
