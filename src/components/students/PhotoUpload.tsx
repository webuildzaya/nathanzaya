'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'

interface Props {
  value: File | null
  onChange: (file: File | null) => void
  currentUrl?: string | null
}

export default function PhotoUpload({ value, onChange, currentUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setError('')

    if (!file) {
      onChange(null)
      return
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, or WebP images are allowed.')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Photo must be smaller than 2MB.')
      return
    }

    const url = URL.createObjectURL(file)
    setPreview(url)
    onChange(file)
  }

  const initials = '📷'

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-900">
        Profile photo <span className="text-gray-400">(optional)</span>
      </label>

      <div className="flex items-center gap-4">
        {/* Preview circle */}
        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {preview ? (
            <Image
              src={preview}
              alt="Preview"
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-2xl">{initials}</span>
          )}
        </div>

        {/* Button */}
        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="h-11 px-4 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
          >
            {value ? 'Change photo' : 'Choose photo'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP · max 2MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={handleChange}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
