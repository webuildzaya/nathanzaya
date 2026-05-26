'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import toast from 'react-hot-toast'
import PhotoUpload from './PhotoUpload'
import type { CoursePackage, RegisterStudentInput } from '@/types/student'

interface Props {
  onSuccess: () => void
  onCancel: () => void
}

const PHONE_HINT = 'e.g. 08012345678 or +2348012345678'

export default function StudentRegistrationForm({ onSuccess, onCancel }: Props) {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<RegisterStudentInput>({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    coursePackageId: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Load course packages
  const { data: packagesData } = useQuery<{ data: CoursePackage[] }>({
    ...defaultQueryOptions,
    queryKey: ['course-packages'],
    queryFn: () => fetch('/api/course-packages').then((r) => r.json()),
  })

  const packages = packagesData?.data ?? []

  // Register mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address || undefined,
          coursePackageId: form.coursePackageId || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw json
      return json.data
    },
    onSuccess: async (student) => {
      // Upload photo if selected
      if (photo) {
        const fd = new FormData()
        fd.append('photo', photo)
        await fetch(`/api/students/${student.id}/photo`, {
          method: 'POST',
          body: fd,
        })
      }
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      toast.success(`${student.fullName} registered successfully!`)
      onSuccess()
    },
    onError: (err: { error?: string; issues?: Record<string, string[]> }) => {
      if (err.issues) {
        setErrors(err.issues)
      }
      toast.error(err.error ?? 'Something went wrong. Please try again.')
    },
  })

  function set(field: keyof RegisterStudentInput, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => ({ ...prev, [field]: [] }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    mutation.mutate()
  }

  const loading = mutation.isPending

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Full name */}
      <div>
        <label htmlFor="reg-fullName" className="block text-sm font-medium text-gray-900 mb-1">
          Full name <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-fullName"
          type="text"
          autoComplete="name"
          required
          value={form.fullName}
          onChange={(e) => set('fullName', e.target.value)}
          placeholder="e.g. Amaka Okafor"
          className="w-full h-12 px-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
        />
        {errors.fullName?.length > 0 && (
          <p className="text-sm text-red-600 mt-1">{errors.fullName[0]}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="reg-phone" className="block text-sm font-medium text-gray-900 mb-1">
          Phone number <span className="text-red-500">*</span>
        </label>
        <input
          id="reg-phone"
          type="tel"
          inputMode="numeric"
          required
          value={form.phone}
          onChange={(e) => set('phone', e.target.value)}
          placeholder={PHONE_HINT}
          className="w-full h-12 px-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
        />
        <p className="text-xs text-gray-400 mt-1">{PHONE_HINT}</p>
        {errors.phone?.length > 0 && (
          <p className="text-sm text-red-600 mt-1">{errors.phone[0]}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="reg-email" className="block text-sm font-medium text-gray-900 mb-1">
          Email address <span className="text-gray-400">(optional)</span>
        </label>
        <input
          id="reg-email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="student@email.com"
          className="w-full h-12 px-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base"
        />
        {errors.email?.length > 0 && (
          <p className="text-sm text-red-600 mt-1">{errors.email[0]}</p>
        )}
      </div>

      {/* Address */}
      <div>
        <label htmlFor="reg-address" className="block text-sm font-medium text-gray-900 mb-1">
          Home address <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          id="reg-address"
          rows={2}
          value={form.address}
          onChange={(e) => set('address', e.target.value)}
          placeholder="Street, area, city"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base resize-none"
        />
      </div>

      {/* Course package */}
      <div>
        <label htmlFor="reg-package" className="block text-sm font-medium text-gray-900 mb-1">
          Course package <span className="text-gray-400">(optional)</span>
        </label>
        <select
          id="reg-package"
          value={form.coursePackageId}
          onChange={(e) => set('coursePackageId', e.target.value)}
          className="w-full h-12 px-4 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-base bg-white"
        >
          <option value="">— No package selected —</option>
          {packages.map((pkg) => (
            <option key={pkg.id} value={pkg.id}>
              {pkg.name} · {pkg.totalLessons} lessons · ₦{Number(pkg.price).toLocaleString()}
            </option>
          ))}
        </select>
        {errors.coursePackageId?.length > 0 && (
          <p className="text-sm text-red-600 mt-1">{errors.coursePackageId[0]}</p>
        )}
      </div>

      {/* Photo */}
      <PhotoUpload value={photo} onChange={setPhoto} />

      {/* Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-12 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          id="reg-submit"
          disabled={loading}
          className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            'Register Student'
          )}
        </button>
      </div>
    </form>
  )
}
