'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

interface Instructor {
  id: string
  fullName: string
  phone: string | null
  user?: { email: string }
}

interface CreateInstructorPayload {
  fullName: string
  phone?: string
  email?: string
  password?: string
}

export default function InstructorsPage() {
  const qc = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const { data: instructors, isLoading } = useQuery<Instructor[]>({
    ...defaultQueryOptions,
    queryKey: ['instructors'],
    queryFn: () => fetch('/api/instructors').then(r => r.json())
  })

  const createInstructor = useMutation({
    mutationFn: async (payload: CreateInstructorPayload) => {
      const r = await fetch('/api/instructors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) {
        const err = await r.json()
        throw new Error(err.error || 'Failed to create instructor')
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['instructors'] })
      toast.success('Instructor added successfully')
      setIsFormOpen(false)
      setFullName('')
      setPhone('')
      setEmail('')
      setPassword('')
    },
    onError: (e: Error) => toast.error(e.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fullName) return toast.error('Name is required')
    createInstructor.mutate({ fullName, phone, email, password })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Instructors</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Loading...' : `${instructors?.length || 0} active instructors`}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <span className="text-base leading-none">+</span>
          Add Instructor
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : instructors?.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-3xl">
          <p className="text-4xl mb-3">👤</p>
          <p className="font-semibold text-gray-900">No instructors yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your first instructor to start scheduling lessons.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">Phone & Login</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors?.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{i.fullName}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{i.phone || '—'}</div>
                      {i.user?.email && (
                        <div className="text-[10px] font-medium text-blue-600 uppercase tracking-tight">
                          {i.user.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Instructor">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder-gray-300"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder-gray-300"
              placeholder="e.g. 08012345678"
            />
          </div>

          <div className="border-t border-gray-100 pt-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">
              Login Credentials (Optional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder-gray-300"
                  placeholder="instructor@zaya.com"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder-gray-300"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="flex-1 h-12 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createInstructor.isPending}
              className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              {createInstructor.isPending ? 'Saving...' : 'Add Instructor'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}