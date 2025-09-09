// components/tracking/delivery-estimation.tsx
'use client'

interface TrackingData {
  status: string
  events: Array<{
    date: string
    status: string
    location?: string
  }>
  sourcesChecked: string[]
  daysInTransit?: number
  originCountry?: string
  destinationCountry?: string
}

interface DeliveryEstimationProps {
  trackingData: TrackingData
  isDelivered: boolean
}

export default function DeliveryEstimation({ trackingData, isDelivered }: DeliveryEstimationProps) {
  // Calculate delivery estimation based on carrier and route
  const getDeliveryEstimation = () => {
    const { daysInTransit = 0, sourcesChecked, originCountry, destinationCountry } = trackingData
    
    // Base estimation logic
    const estimations = {
      'novaposhta': { min: 1, max: 3, confidence: 95 },
      'ukrposhta': { 
        domestic: { min: 3, max: 7, confidence: 90 },
        international: { min: 7, max: 21, confidence: 85 }
      },
      'dhl': { min: 2, max: 5, confidence: 98 },
      'china-post': { min: 14, max: 45, confidence: 75 },
      'cainiao': { min: 10, max: 30, confidence: 80 },
      'usps': { min: 7, max: 14, confidence: 88 }
    }

    // Determine primary carrier
    const primaryCarrier = sourcesChecked?.[0]?.toLowerCase().replace(/\s+/g, '')
    
    // International vs domestic logic
    const isInternational = originCountry && destinationCountry && 
                           originCountry !== destinationCountry

    let estimation = { min: 7, max: 21, confidence: 80 } // default

    if (primaryCarrier) {
      const carrierKey = primaryCarrier.includes('nova') ? 'novaposhta' :
                        primaryCarrier.includes('ukr') ? 'ukrposhta' :
                        primaryCarrier.includes('dhl') ? 'dhl' :
                        primaryCarrier.includes('china') ? 'china-post' :
                        primaryCarrier.includes('cainiao') ? 'cainiao' :
                        primaryCarrier.includes('usps') ? 'usps' : null

      if (carrierKey && estimations[carrierKey]) {
        if (carrierKey === 'ukrposhta' && isInternational) {
          estimation = estimations[carrierKey].international
        } else if (carrierKey === 'ukrposhta') {
          estimation = estimations[carrierKey].domestic
        } else {
          estimation = estimations[carrierKey]
        }
      }
    }

    return { ...estimation, isInternational }
  }

  const estimation = getDeliveryEstimation()
  const currentDate = new Date()
  const estimatedDelivery = new Date(currentDate)
  estimatedDelivery.setDate(currentDate.getDate() + estimation.max - (trackingData.daysInTransit || 0))

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('uk-UA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (isDelivered) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              Посилка доставлена за {trackingData.daysInTransit} днів
            </h3>
            <p className="text-green-700">
              Доставлено {trackingData.events[0]?.date}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // In transit estimation
  const isDelayed = (trackingData.daysInTransit || 0) > estimation.max

  return (
    <div className={`border rounded-lg p-6 ${
      isDelayed 
        ? 'bg-yellow-50 border-yellow-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start space-x-3">
        <div className={`w-3 h-3 rounded-full mt-2 ${
          isDelayed ? 'bg-yellow-500' : 'bg-blue-500'
        } animate-pulse`}></div>
        
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${
            isDelayed ? 'text-yellow-900' : 'text-blue-900'
          }`}>
            {isDelayed 
              ? `Посилка в дорозі вже ${trackingData.daysInTransit} днів`
              : `Посилка в дорозі ${trackingData.daysInTransit} днів`
            }
          </h3>
          
          <div className="mt-2 space-y-2">
            {isDelayed ? (
              <p className="text-yellow-700">
                Доставка затримується. Очікуваний термін був {estimation.min}-{estimation.max} днів.
              </p>
            ) : (
              <p className="text-blue-700">
                Очікувана доставка: {estimation.min}-{estimation.max} днів
              </p>
            )}
            
            {!isDelayed && estimatedDelivery > currentDate && (
              <p className="text-blue-600 font-medium">
                Очікувана дата: {formatDate(estimatedDelivery)}
              </p>
            )}
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Прогноз на основі {estimation.confidence}% точності ({estimation.confidence > 90 ? 'висока' : estimation.confidence > 80 ? 'середня' : 'базова'} надійність)
              </span>
            </div>
            
            {estimation.isInternational && (
              <p className="text-xs text-gray-500">
                Міжнародне відправлення з {trackingData.originCountry} до {trackingData.destinationCountry}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}