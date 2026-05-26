'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Step1Data {
  schoolName: string
  schoolAddress: string
  schoolPhone: string
  schoolEmail: string
}

interface Step2Data {
  numInstructors: string
  numVehicles: string
  referralSource: string
}

type FieldErrors = Record<string, string>

// ── Step indicator ─────────────────────────────────────────────────────────────
function StepIndicator({
  step,
  activeStep,
}: {
  step: 1 | 2
  activeStep: number
}) {
  const done = activeStep > step
  const active = activeStep === step

  return (
    <div className="flex items-start gap-3">
      {/* Circle */}
      <div
        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          done
            ? 'bg-blue-600 border-blue-600'
            : active
            ? 'bg-blue-600 border-blue-600'
            : 'bg-white border-gray-300'
        }`}
      >
        {done ? (
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : active ? (
          <div className="w-2 h-2 rounded-full bg-white" />
        ) : null}
      </div>

      {/* Labels */}
      <div>
        <p className={`text-sm font-semibold leading-tight ${active || done ? 'text-gray-900' : 'text-gray-400'}`}>
          {step === 1 ? 'Basic info' : 'Additional details'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {step === 1 ? 'Provide your school details' : 'Provide your basic details'}
        </p>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<1 | 2>(1)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})

  const [step1, setStep1] = useState<Step1Data>({
    schoolName: '',
    schoolAddress: '',
    schoolPhone: '',
    schoolEmail: '',
  })

  const [step2, setStep2] = useState<Step2Data>({
    numInstructors: '1',
    numVehicles: '1',
    referralSource: '',
  })

  // ── Validation ───────────────────────────────────────────────────────────────
  function validateStep1(): boolean {
    const errs: FieldErrors = {}
    if (!step1.schoolName.trim()) errs.schoolName = 'School name is required'
    if (!step1.schoolAddress.trim()) errs.schoolAddress = 'Address is required'
    if (!step1.schoolPhone.trim()) {
      errs.schoolPhone = 'Phone number is required'
    } else if (!/^(\+234|0)[789][0-9]\d{8}$/.test(step1.schoolPhone)) {
      errs.schoolPhone = 'Enter a valid Nigerian phone number'
    }
    if (step1.schoolEmail && !/\S+@\S+\.\S+/.test(step1.schoolEmail)) {
      errs.schoolEmail = 'Enter a valid email address'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2(): boolean {
    const errs: FieldErrors = {}
    const ni = parseInt(step2.numInstructors)
    const nv = parseInt(step2.numVehicles)
    if (!step2.numInstructors || isNaN(ni) || ni < 1) errs.numInstructors = 'At least 1 instructor required'
    if (!step2.numVehicles || isNaN(nv) || nv < 1) errs.numVehicles = 'At least 1 vehicle required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (validateStep1()) {
      setErrors({})
      setActiveStep(2)
    }
  }

  async function handleSubmit() {
    if (!validateStep2()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: step1.schoolName,
          schoolAddress: step1.schoolAddress,
          schoolPhone: step1.schoolPhone,
          schoolEmail: step1.schoolEmail,
          numInstructors: step2.numInstructors,
          numVehicles: step2.numVehicles,
          referralSource: step2.referralSource,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.issues) {
          const nextErrors: FieldErrors = {}
          for (const [field, messages] of Object.entries(data.issues)) {
            if (Array.isArray(messages) && messages[0]) {
              nextErrors[field] = String(messages[0])
            }
          }
          setErrors(nextErrors)
        }

        throw new Error(data.error ?? 'Setup failed')
      }

      toast.success('School details saved. Welcome to your dashboard!')
      router.refresh()
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  // ── Field helpers ────────────────────────────────────────────────────────────
  const inputClass = (field: string) =>
    `w-full px-4 py-3 rounded-lg border text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-gray-200'
    }`

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          REG {activeStep}/2
        </span>
        <img src="/logo.svg" alt="Zaya Drives" className="h-7 w-auto" />
        <div className="w-16" /> {/* spacer */}
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col sm:flex-row">

            {/* ── LEFT PANEL — Step navigator ── */}
            <div className="sm:w-52 flex-shrink-0 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 px-5 py-6 space-y-5">
              <h2 className="text-sm font-bold text-gray-900 leading-snug">
                New Account Registration
              </h2>
              <div className="space-y-4">
                <StepIndicator step={1} activeStep={activeStep} />
                <StepIndicator step={2} activeStep={activeStep} />
              </div>
            </div>

            {/* ── RIGHT PANEL — Form content ── */}
            <div className="flex-1 px-6 py-6">

              {/* Step header */}
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">
                  {activeStep === 1 ? 'Basic info' : 'Additional details'}
                </h3>
              </div>
              <p className="text-xs text-gray-400 mb-5">
                {activeStep === 1
                  ? 'Provide your school details'
                  : 'A few more details to finish setup'}
              </p>

              {/* ── STEP 1 FIELDS ── */}
              {activeStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      School name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your school name"
                      value={step1.schoolName}
                      onChange={(e) => setStep1({ ...step1, schoolName: e.target.value })}
                      className={inputClass('schoolName')}
                    />
                    {errors.schoolName && <p className="text-xs text-red-500 mt-1">{errors.schoolName}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      School address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your school address"
                      value={step1.schoolAddress}
                      onChange={(e) => setStep1({ ...step1, schoolAddress: e.target.value })}
                      className={inputClass('schoolAddress')}
                    />
                    {errors.schoolAddress && <p className="text-xs text-red-500 mt-1">{errors.schoolAddress}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      School phone number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 08012345678"
                      value={step1.schoolPhone}
                      onChange={(e) => setStep1({ ...step1, schoolPhone: e.target.value })}
                      className={inputClass('schoolPhone')}
                    />
                    {errors.schoolPhone && <p className="text-xs text-red-500 mt-1">{errors.schoolPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      School email <span className="text-gray-400">(optional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="school@email.com"
                      value={step1.schoolEmail}
                      onChange={(e) => setStep1({ ...step1, schoolEmail: e.target.value })}
                      className={inputClass('schoolEmail')}
                    />
                    {errors.schoolEmail && <p className="text-xs text-red-500 mt-1">{errors.schoolEmail}</p>}
                  </div>

                  {/* Next button */}
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full sm:w-auto px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors min-h-[44px]"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 2 FIELDS ── */}
              {activeStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Number of instructors <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 3"
                      value={step2.numInstructors}
                      onChange={(e) => setStep2({ ...step2, numInstructors: e.target.value })}
                      className={inputClass('numInstructors')}
                    />
                    {errors.numInstructors && <p className="text-xs text-red-500 mt-1">{errors.numInstructors}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Number of vehicles <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="e.g. 2"
                      value={step2.numVehicles}
                      onChange={(e) => setStep2({ ...step2, numVehicles: e.target.value })}
                      className={inputClass('numVehicles')}
                    />
                    {errors.numVehicles && <p className="text-xs text-red-500 mt-1">{errors.numVehicles}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      How did you hear about Zaya?
                    </label>
                    <select
                      value={step2.referralSource}
                      onChange={(e) => setStep2({ ...step2, referralSource: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all bg-white"
                    >
                      <option value="">Select an option</option>
                      <option value="Google">Google</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Referral">Referral</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Back + Complete */}
                  <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => { setErrors({}); setActiveStep(1) }}
                      className="w-full sm:w-auto px-6 py-2.5 border border-gray-900 text-gray-900 bg-white hover:bg-gray-50 text-sm font-semibold rounded-lg transition-colors min-h-[44px]"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors min-h-[44px]"
                    >
                      {submitting && (
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      )}
                      {submitting ? 'Setting up...' : 'Complete Setup'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
