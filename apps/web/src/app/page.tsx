// Замінити файл: apps/web/src/app/page.tsx

'use client'

import { useState } from 'react'
import { Search, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react'

interface TrackingResult {
  tracking_number: string
  carrier: string
  status: string
  events: Array<{
    status: string
    description: string
    location?: string
    timestamp: string
  }>
}

export default function HomePage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TrackingResult | null>(null)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tracking_number: trackingNumber.trim() })
      })

      if (!response.ok) {
        throw new Error('Помилка при відстеженні посилки')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Невідома помилка')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_transit': return <Truck className="w-5 h-5 text-blue-500" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-500" />
      case 'exception': return <AlertCircle className="w-5 h-5 text-red-500" />
      default: return <Package className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      'pending': 'Очікує відправки',
      'in_transit': 'В дорозі',
      'delivered': 'Доставлено',
      'exception': 'Проблема з доставкою'
    }
    return statusMap[status.toLowerCase()] || status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🐼 <span className="text-indigo-600">PandaTrack</span>
            </h1>
            <div className="text-sm text-gray-500">
              Відстеження посилок в Україні
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tracking Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Відстежити посилку
          </h2>
          
          <form onSubmit={handleTrack} className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Введіть номер для відстеження..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !trackingNumber.trim()}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                Відстежити
              </button>
            </div>
          </form>

          {/* Supported Carriers */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Підтримувані служби доставки:</p>
            <div className="flex flex-wrap gap-2">
              {['Нова Пошта', 'Укрпошта', 'Meest Express', 'DHL', 'FedEx'].map((carrier) => (
                <span key={carrier} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {carrier}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tracking Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Результати відстеження
            </h3>
            
            <div className="border-b border-gray-200 pb-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Номер відстеження</span>
                <span className="font-mono text-sm">{result.tracking_number}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Служба доставки</span>
                <span className="text-sm font-medium">{result.carrier}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Статус</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(result.status)}
                  <span className="text-sm font-medium">
                    {getStatusText(result.status)}
                  </span>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Історія відстеження</h4>
              {result.events.map((event, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(event.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {event.description}
                    </p>
                    {event.location && (
                      <p className="text-sm text-gray-500">{event.location}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(event.timestamp).toLocaleString('uk-UA')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6">
            <Package className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Багато служб</h3>
            <p className="text-gray-600 text-sm">
              Відстежуємо посилки з усіх популярних служб доставки в Україні
            </p>
          </div>
          <div className="text-center p-6">
            <Search className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Легко користуватись</h3>
            <p className="text-gray-600 text-sm">
              Просто введіть номер відстеження і отримайте актуальну інформацію
            </p>
          </div>
          <div className="text-center p-6">
            <Clock className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
            <h3 className="font-semibold text-gray-900 mb-2">Швидко і точно</h3>
            <p className="text-gray-600 text-sm">
              Отримуйте оновлення статусу посилки в реальному часі
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2025 PandaTrack. Сервіс відстеження посилок в Україні.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}