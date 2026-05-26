'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

const COOLDOWN_SECONDS = 60

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') ?? ''

  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Tick the cooldown every second
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleResend = useCallback(async () => {
    if (cooldown > 0 || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        toast.success('Verification email resent!')
        setCooldown(COOLDOWN_SECONDS)
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to resend. Try again.')
      }
    } catch {
      toast.error('Failed to resend. Try again.')
    } finally {
      setSending(false)
    }
  }, [email, cooldown, sending])

  const resendLabel = sending
    ? 'Sending...'
    : cooldown > 0
    ? `Resend Email (${cooldown}s)`
    : 'Resend Email'

  return (
    <main className="min-h-screen bg-white flex flex-col px-6 py-10">

      {/* Logo */}
      <img src="/logo.svg" alt="Zaya Drives" className="h-8 w-auto mb-2" />

      {/* Top heading — left-aligned */}
      <h1 className="text-base font-bold tracking-widest text-gray-900 uppercase mb-10">
        Email Verification
      </h1>

      {/* Centered body */}
      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 -mt-10">

        {/* Blue mail icon square */}
        <div className="bg-blue-600 rounded-xl p-5 inline-flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </div>

        {/* Primary message */}
        <div className="space-y-2 max-w-xs">
          <p className="text-base font-medium text-gray-900 leading-snug">
            {email ? (
              <>
                We&apos;ve sent a verification link to{' '}
                <span className="font-bold">{email}</span>.
              </>
            ) : (
              'Check your email inbox for a verification link.'
            )}
          </p>

          <p className="text-sm text-gray-500 leading-relaxed">
            Click the link in the email to activate your account and get started.
          </p>

          <p className="text-xs text-gray-400 leading-relaxed pt-1">
            Didn&apos;t receive the email? Check your spam folder or request a new one.
          </p>
        </div>

        {/* Buttons — stacked on mobile, side by side on sm+ */}
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs pt-2">
          {/* Resend — outlined */}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || sending}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border border-gray-900 bg-white text-gray-900 font-medium text-sm transition-all hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
          >
            {sending && (
              <svg
                className="animate-spin h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            )}
            {resendLabel}
          </button>

          {/* Back to Sign In — filled */}
          <Link
            href="/login"
            className="flex-1 flex items-center justify-center py-3 rounded-lg bg-[#0F1B4C] hover:bg-[#1a2b6e] text-white font-medium text-sm transition-all min-h-[48px]"
          >
            Back to Sign In
          </Link>
        </div>

      </div>
    </main>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex gap-2">
          <span className="w-3 h-3 rounded-full bg-blue-200 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-3 h-3 rounded-full bg-blue-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-3 h-3 rounded-full bg-blue-800 animate-bounce" />
        </div>
      </main>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
