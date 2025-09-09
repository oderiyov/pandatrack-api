// app/track/[tn]/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'
import DeliveryEstimation from '@/components/tracking/delivery-estimation'
import TrackingTimeline from '@/components/tracking/tracking-timeline'
import TrackingMetadata from '@/components/tracking/tracking-metadata'
import TrackingActions from '@/components/tracking/tracking-actions'
import RelatedCarriers from '@/components/tracking/related-carriers'
import TrackingFAQ from '@/components/tracking/tracking-faq'

interface TrackingEvent {
  date: string
  time?: string
  status: string
  description: string | string[]
  location?: string
  statusCode?: string
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
  daysInTransit?: number
  originCountry?: string
  destinationCountry?: string
}

interface ApiSource {
  provider: string
  status: string
  message: string
  events?: TrackingEvent[]
  cost?: number
  cached?: boolean
  supportsInternational?: boolean
}

interface ApiResponse {
  success: boolean
  trackingNumber?: string
  consolidatedStatus?: string
  sources?: ApiSource[]
  meta?: {
    responseTime: number
    timestamp: string
  }
  error?: string
  message?: string
}

export default function TrackingPage() {
  const params = useParams()
  const trackingNumber = params.tn as string
  
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Detect browser/device for better error handling
  const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = typeof window !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isAndroid = typeof window !== 'undefined' && /Android/.test(navigator.userAgent)

  // Calculate days in transit
  const calculateDaysInTransit = (events: TrackingEvent[]): number => {
    if (!events || events.length === 0) return 0
    
    const firstEvent = events[events.length - 1] // API returns newest first
    const firstDate = new Date(firstEvent.date)
    const today = new Date()
    
    const diffTime = Math.abs(today.getTime() - firstDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  // Detect countries from tracking data
  const detectCountries = (events: TrackingEvent[], trackingNumber: string) => {
    let originCountry = 'Невідомо'
    const destinationCountry = 'Україна' // Default for Ukrainian service
    
    // Detect from tracking number format
    if (trackingNumber.length >= 13) {
      const countryCode = trackingNumber.slice(-2).toUpperCase()
      const countryCodes: Record<string, string> = {
        'CN': 'Китай',
        'US': 'США', 
        'GB': 'Великобританія',
        'DE': 'Німеччина',
        'UA': 'Україна',
        'EE': 'Естонія'
      }
      if (countryCodes[countryCode]) {
        originCountry = countryCodes[countryCode]
      }
    }
    
    // Detect from events
    events.forEach(event => {
      if (event.location) {
        if (event.location.includes('Китай') || event.location.includes('China')) {
          originCountry = 'Китай'
        } else if (event.location.includes('США') || event.location.includes('USA')) {
          originCountry = 'США'
        }
      }
    })
    
    return { originCountry, destinationCountry }
  }

  // Enhanced fetch with mobile browser compatibility
  const fetchTrackingData = async (attempt = 0) => {
    try {
      const decodedTN = decodeURIComponent(trackingNumber)
      
      // Create abort controller with timeout based on device
      const controller = new AbortController()
      const timeout = isIOS || isSafari ? 15000 : 10000 // Longer timeout for iOS
      const timeoutId = setTimeout(() => controller.abort(), timeout)
      
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
      
      // Add User-Agent only for non-mobile browsers (mobile browsers restrict this)
      if (!isIOS && !isAndroid) {
        headers['User-Agent'] = 'PandaTrack-Web/1.0'
      }

      const response = await fetch(`https://api.pandatrack.com.ua/api/track/${encodeURIComponent(decodedTN)}`, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'omit',
        signal: controller.signal,
        // Add cache busting for mobile browsers
        cache: 'no-cache'
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Помилка ${response.status}: ${response.statusText}`)
      }

      // Verify response content type
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер повернув невірний формат даних')
      }

      const data: ApiResponse = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || data.message || 'Не вдалося отримати дані про посилку')
      }

      const primarySource = data.sources?.[0]
      if (!primarySource) {
        throw new Error('Дані про посилку не знайдено')
      }

      // Process events and format dates
      const processedEvents = (primarySource.events || []).map(event => {
        const eventDate = new Date(event.date)
        const description = Array.isArray(event.description) 
          ? event.description.join(', ') 
          : event.description

        return {
          date: eventDate.toLocaleDateString('uk-UA'),
          time: eventDate.toLocaleTimeString('uk-UA', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: event.status,
          description: description || event.status,
          location: event.location,
          statusCode: event.statusCode
        }
      })

      const daysInTransit = calculateDaysInTransit(processedEvents)
      const { originCountry, destinationCountry } = detectCountries(processedEvents, trackingNumber)

      const adaptedData: TrackingData = {
        trackingNumber: data.trackingNumber || trackingNumber,
        carrier: primarySource.provider,
        status: data.consolidatedStatus || primarySource.status,
        description: primarySource.message || primarySource.status,
        events: processedEvents,
        estimatedDelivery: undefined,
        sourcesChecked: data.sources?.map(s => s.provider) || [],
        lastUpdated: data.meta?.timestamp || new Date().toISOString(),
        daysInTransit,
        originCountry,
        destinationCountry
      }

      setTrackingData(adaptedData)
      setRetryCount(0) // Reset retry count on success
      
    } catch (err) {
      console.error('Tracking fetch error:', err)
      
      // Enhanced error handling for different devices
      let errorMessage = 'Невідома помилка при відстеженні'
      
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          errorMessage = 'Запит перевищив час очікування. Спробуйте ще раз.'
        } else if (err.message.includes('NetworkError') || 
                   err.message.includes('Failed to fetch') ||
                   err.message.includes('ERR_NETWORK')) {
          if (isIOS || isSafari) {
            errorMessage = 'Проблема з мережею. Перевірте з\'єднання та спробуйте ще раз. Можливо, потрібно дозволити cross-site tracking в налаштуваннях Safari.'
          } else if (isAndroid) {
            errorMessage = 'Проблема з мережею. Перевірте з\'єднання та спробуйте ще раз.'
          } else {
            errorMessage = 'Проблема з мережею. Перевірте з\'єднання та спробуйте ще раз.'
          }
        } else if (err.message.includes('CORS')) {
          errorMessage = 'Тимчасова проблема з безпекою. Спробуйте ще раз через хвилину.'
        } else {
          errorMessage = err.message
        }
      }
      
      // Auto-retry logic for network errors (max 3 attempts)
      if (attempt < 2 && 
          (errorMessage.includes('мережею') || errorMessage.includes('очікування'))) {
        console.log(`Retrying... attempt ${attempt + 1}`)
        setTimeout(() => {
          setRetryCount(attempt + 1)
          fetchTrackingData(attempt + 1)
        }, 2000 * (attempt + 1)) // Exponential backoff
        return
      }
      
      setError(errorMessage)
    }
  }

  useEffect(() => {
    if (!trackingNumber) return

    const initFetch = async () => {
      setLoading(true)
      setError(null)
      await fetchTrackingData()
      setLoading(false)
    }

    initFetch()
  }, [trackingNumber])

  const handleRetry = () => {
    if (trackingNumber) {
      setError(null)
      setTrackingData(null)
      setLoading(true)
      setRetryCount(0)
      // Use location.reload only as last resort for mobile
      if (isIOS || isSafari) {
        window.location.reload()
      } else {
        fetchTrackingData().finally(() => setLoading(false))
      }
    }
  }

  // Check if delivered
  const isDelivered = Boolean(
    trackingData?.status?.toLowerCase().includes('delivered') || 
    trackingData?.status?.toLowerCase().includes('вручено') ||
    trackingData?.status?.toLowerCase().includes('отримано')
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] text-[#333037]">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-32 bg-gray-200 rounded"></div>
                </div>
              </div>
              {retryCount > 0 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-blue-600">
                    Спроба {retryCount + 1} з 3...
                  </p>
                </div>
              )}
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
          <div className="max-w-6xl mx-auto">
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
                
                {/* Device-specific help */}
                {(isIOS || isSafari) && error.includes('мережею') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                    <h3 className="font-semibold text-blue-900 mb-2">Для Safari iOS:</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Перевірте налаштування Safari → Конфіденційність</li>
                      <li>• Вимкніть "Запобігти міжсайтовому відстеженню"</li>
                      <li>• Або спробуйте в приватному режимі</li>
                    </ul>
                  </div>
                )}
                
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
          <div className="max-w-6xl mx-auto">
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
      {/* SEO structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TrackAction",
            "object": {
              "@type": "Product",
              "identifier": trackingData.trackingNumber
            },
            "result": {
              "@type": "DeliveryEvent", 
              "deliveryStatus": trackingData.status,
              "hasDeliveryMethod": trackingData.sourcesChecked
            }
          })
        }}
      />

      <Header />
      
      {/* Hero Section with Search */}
      <section className="bg-[#f0e5d9] py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-[#333037] mb-4">
              Відстеження посилки: {trackingData.trackingNumber}
            </h1>
            <p className="text-[#333037]/70 mb-6">
              Український сервіс відстеження посилок Нової Пошти, Укрпошти, DHL та інших перевізників
            </p>
            
            {/* Quick search form */}
            <div className="max-w-md">
              <TrackingForm defaultValue="" placeholder="Введіть новий трек-номер..." />
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column - Timeline */}
            <div className="lg:col-span-2 space-y-6">
              {/* Delivery Estimation */}
              <DeliveryEstimation 
                trackingData={trackingData}
                isDelivered={isDelivered}
              />
              
              {/* Tracking Timeline */}
              <TrackingTimeline 
                events={trackingData.events}
                isDelivered={isDelivered}
              />
            </div>

            {/* Right Column - Metadata & Actions */}
            <div className="space-y-6">
              {/* Package Metadata */}
              <TrackingMetadata trackingData={trackingData} />
              
              {/* Action Buttons */}
              <TrackingActions 
                trackingNumber={trackingData.trackingNumber}
                trackingUrl={`https://pandatrack.com.ua/track/${trackingData.trackingNumber}`}
              />
            </div>
          </div>

          {/* FAQ Section */}
          <TrackingFAQ 
            carriers={trackingData.sourcesChecked}
            status={trackingData.status}
          />

          {/* Related Carriers */}
          <RelatedCarriers 
            currentCarriers={trackingData.sourcesChecked}
          />

          {/* Community Section - Future Artalk Integration */}
          <section className="bg-white rounded-lg shadow-sm p-6 mt-8">
            <h2 className="text-xl font-bold mb-4">Питання про відстеження</h2>
            <p className="text-[#333037]/70 mb-6">
              В коментарях ви можете запитати про своє відправлення або поділитися досвідом
            </p>
            
            {/* Placeholder for Artalk - will be implemented separately */}
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <p className="text-[#333037]/60">
                Система коментарів буде доступна незабаром
              </p>
            </div>
          </section>

          {/* Educational Content */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-3">Що таке номер відстеження?</h3>
              <p className="text-[#333037]/70 text-sm leading-relaxed">
                Трек номер — це унікальний код посилки для відстеження між країнами. 
                Міжнародні номери виглядають як RO123456789CN, де перші букви — тип відправлення, 
                останні — код країни відправника.
              </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-bold mb-3">Як відстежити посилку?</h3>
              <ol className="text-[#333037]/70 text-sm space-y-1 leading-relaxed">
                <li>1. Знайдіть трек-номер в email або на сайті магазину</li>
                <li>2. Введіть номер у поле пошуку вище</li>
                <li>3. Отримайте актуальну інформацію про статус доставки</li>
              </ol>
            </div>
          </section>
        </div>
      </main>
      
      <Footer />
    </div>
  )
}