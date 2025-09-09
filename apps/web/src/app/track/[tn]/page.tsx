'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'

interface TrackingEvent {
  date: string
  time: string
  status: string
  description: string
  location?: string
}

interface TrackingData {
  trackingNumber: string
  carrier: string
  status: string
  description: string
  events: TrackingEvent[]
  estimatedDelivery?: string
  sourcesChecked: string[]
  lastUpdated: string
}

interface ApiResponse {
  success: boolean
  data?: TrackingData
  error?: string
  message?: string
}

export default function TrackingPage() {
  const params = useParams()
  const trackingNumber = params.tn as string
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!trackingNumber) return

    const fetchTrackingData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const decodedTN = decodeURIComponent(trackingNumber)
        const response = await fetch(`https://api.pandatrack.com.ua/api/track/${encodeURIComponent(decodedTN)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'PandaTrack-Web/1.0'
          }
        })

        if (!response.ok) {
          throw new Error(`Помилка ${response.status}: ${response.statusText}`)
        }

        const data: ApiResponse = await response.json()
        
        if (!data.success || !data.data) {
          throw new Error(data.error || data.message || 'Не вдалося отримати дані про посилку')
        }

        setTrackingData(data.data)
      } catch (err) {
        console.error('Tracking fetch error:', err)
        setError(err instanceof Error ? err.message : 'Невідома помилка при відстеженні')
      } finally {
        setLoading(false)
      }
    }

    fetchTrackingData()
  }, [trackingNumber])

  const handleRetry = () => {
    if (trackingNumber) {
      setError(null)
      setTrackingData(null)
      setLoading(true)
      // Re-trigger useEffect
      window.location.reload()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#333037]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#333037]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-[#333037] mb-2">
                  Помилка відстеження
                </h2>
                <p className="text-[#333037]/70 mb-6">{error}</p>
                <div className="space-y-4">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center px-4 py-2 bg-[#333037] text-white rounded-lg hover:bg-[#333037]/90 transition-colors"
                  >
                    Спробувати ще раз
                  </button>
                  <div className="text-sm text-[#333037]/60">
                    або введіть новий номер
                  </div>
                  <div className="max-w-md mx-auto">
                    <TrackingForm />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!trackingData) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#333037]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <h2 className="text-xl font-semibold mb-4">Посилку не знайдено</h2>
              <p className="text-[#333037]/70 mb-6">
                Можливо, номер ще не активований або введений неправильно
              </p>
              <TrackingForm />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037]">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Tracking Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold mb-2">
                  Відстеження #{trackingData.trackingNumber}
                </h1>
                <p className="text-[#333037]/70">
                  Перевізник: <span className="font-medium">{trackingData.carrier}</span>
                </p>
              </div>
              <div className="mt-4 md:mt-0">
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  trackingData.status.includes('доставлен') ? 'bg-green-100 text-green-800' :
                  trackingData.status.includes('транзит') ? 'bg-blue-100 text-blue-800' :
                  trackingData.status.includes('очікує') ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {trackingData.status}
                </span>
              </div>
            </div>
            
            <p className="text-[#333037] mb-4">{trackingData.description}</p>
            
            {trackingData.estimatedDelivery && (
              <div className="bg-[#eaf0f5] rounded-lg p-4 mb-4">
                <p className="text-sm font-medium">
                  Очікувана доставка: {trackingData.estimatedDelivery}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm text-[#333037]/60">Перевірено в:</span>
              {trackingData.sourcesChecked.map((source, index) => (
                <span key={index} className="bg-[#f0e5d9] px-2 py-1 rounded text-xs">
                  {source}
                </span>
              ))}
            </div>

            <p className="text-xs text-[#333037]/50">
              Останнє оновлення: {new Date(trackingData.lastUpdated).toLocaleString('uk-UA')}
            </p>
          </div>

          {/* Tracking Events */}
          {trackingData.events && trackingData.events.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-6">Історія відправлення</h2>
              <div className="space-y-4">
                {trackingData.events.map((event, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex-shrink-0 w-3 h-3 bg-[#333037] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-medium mb-1">{event.status}</p>
                          <p className="text-[#333037]/70 text-sm mb-2">{event.description}</p>
                          {event.location && (
                            <p className="text-[#333037]/60 text-sm">📍 {event.location}</p>
                          )}
                        </div>
                        <div className="text-sm text-[#333037]/60 mt-2 md:mt-0">
                          <p>{event.date}</p>
                          <p>{event.time}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Відстежити іншу посилку</h3>
            <TrackingForm />
          </div>

          {/* Help Section */}
          <div className="mt-8 bg-[#f7e2cc] rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-3">Потрібна допомога?</h3>
            <p className="text-[#333037]/80 mb-4">
              Якщо у вас виникли питання щодо відстеження або доставки, перевірте наші довідники:
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/guides/delivery-statuses" className="text-blue-600 hover:underline text-sm">
                Розшифровка статусів
              </Link>
              <Link href="/guides/delivery-times" className="text-blue-600 hover:underline text-sm">
                Терміни доставки
              </Link>
              <Link href="/guides/tracking-not-working" className="text-blue-600 hover:underline text-sm">
                Чому не відстежується
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}