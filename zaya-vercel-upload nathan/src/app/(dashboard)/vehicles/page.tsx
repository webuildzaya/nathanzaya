'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { defaultQueryOptions } from '@/lib/queryConfig'
import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import toast from 'react-hot-toast'

export default function VehiclesPage() {
  const qc = useQueryClient()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState('')

  const { data: vehicles, isLoading } = useQuery({
    ...defaultQueryOptions,
    queryKey: ['vehicles'],
    queryFn: () => fetch('/api/vehicles').then(r => r.json())
  })

  const createVehicle = useMutation({
    mutationFn: async (payload: { name: string; type?: string }) => {
      const r = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!r.ok) {
        const err = await r.json()
        throw new Error(err.error || 'Failed to create vehicle')
      }
      return r.json()
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vehicles'] })
      toast.success('Vehicle added successfully')
      setIsFormOpen(false)
      setName('')
      setType('')
    },
    onError: (e: any) => toast.error(e.message)
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return toast.error('Name is required')
    createVehicle.mutate({ name, type })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Vehicles</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isLoading ? 'Loading...' : `${vehicles?.length || 0} active vehicles`}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="h-11 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
        >
          <span className="text-base leading-none text-xl translate-y-[-1px]">+</span>
          Add Vehicle
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : vehicles?.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-3xl">
          <p className="text-4xl mb-3">🚗</p>
          <p className="font-semibold text-gray-900">No vehicles yet</p>
          <p className="text-sm text-gray-500 mt-1">Add your training vehicles to start scheduling lessons.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Vehicle Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-gray-900">{v.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{v.type || 'Manual/Auto'}</td>
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

      <Modal isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} title="Add Vehicle">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Vehicle Name / ID</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white placeholder-gray-300"
              placeholder="e.g. Toyota Corolla (ZYA-01)"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Transmission Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full h-12 px-4 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
            >
              <option value="">Manual / Auto</option>
              <option value="Manual">Manual</option>
              <option value="Automatic">Automatic</option>
            </select>
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
              disabled={createVehicle.isPending}
              className="flex-1 h-12 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all"
            >
              {createVehicle.isPending ? 'Saving...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
