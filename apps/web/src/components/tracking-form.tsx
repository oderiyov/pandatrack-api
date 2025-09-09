// src/components/tracking-form.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function TrackingForm() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return
    
    setIsLoading(true)
    // Redirect to tracking page
    router.push(`/track/${encodeURIComponent(trackingNumber.trim())}`)
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto mb-8">
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="text"
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Введіть номер для відстеження..."
          className="flex-1 px-6 py-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg bg-white"
          style={{ maxWidth: '1080px' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !trackingNumber.trim()}
          className="bg-[#333037] text-white px-8 py-4 rounded-lg hover:bg-[#333037]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-medium whitespace-nowrap"
        >
          {isLoading ? 'Пошук...' : 'Відстежити'}
        </button>
      </div>
    </form>
  )
}