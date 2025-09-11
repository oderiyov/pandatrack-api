// components/tracking/tracking-timeline.tsx - ВИПРАВЛЕНА ВЕРСІЯ
'use client'

interface TrackingEvent {
  date: string
  time?: string
  status: string
  description: string | string[]
  location?: string
  statusCode?: string
  displayDate?: string // Додаємо для нового формату
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
  isDelivered: boolean
}

export default function TrackingTimeline({ events, isDelivered }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6 text-[#333037]">Історія відправлення</h2>
        <div className="text-center py-8">
          <p className="text-[#333037]/60">Інформація про статуси поки недоступна</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (event: TrackingEvent, index: number) => {
    const status = event.status.toLowerCase()
    
    // Delivered status
    if (status.includes('отримано') || 
        status.includes('доставлен') || 
        status.includes('вручено') ||
        status.includes('delivered')) {
      return 'bg-green-500'
    }
    
    // Error/Failed status
    if (status.includes('неуспішна') || 
        status.includes('помилка') || 
        status.includes('повернуто') ||
        status.includes('failed')) {
      return 'bg-red-500'
    }
    
    // First event (latest) - active
    if (index === 0 && !isDelivered) {
      return 'bg-blue-500 animate-pulse'
    }
    
    // In transit
    if (status.includes('транзит') || 
        status.includes('дорозі') || 
        status.includes('transit') ||
        status.includes('shipped')) {
      return 'bg-blue-500'
    }
    
    // Processing/Waiting
    if (status.includes('очікує') || 
        status.includes('обробляється') ||
        status.includes('processing')) {
      return 'bg-yellow-500'
    }
    
    // Default
    return 'bg-[#333037]'
  }

  const formatDescription = (description: string | string[]) => {
    if (Array.isArray(description)) {
      return description.join(', ')
    }
    return description
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-[#333037]">Історія відправлення</h2>
      
      <div className="relative">
        {/* ВИПРАВЛЕНА Timeline line - додаємо додатковий відступ зверху */}
        <div className="absolute left-[14px] top-6 bottom-0 w-0.5 bg-gray-200 -ml-px"></div>
        
        <div className="space-y-0">
          {events.map((event, index) => (
            <div key={index} className="relative flex items-start">
              {/* ВИПРАВЛЕНИЙ Timeline dot - центрування відносно тексту */}
              <div className="relative z-10 flex-shrink-0 mr-4 pt-1.5">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(event, index)}`}>
                  {index === 0 && !isDelivered && (
                    <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75"></div>
                  )}
                </div>
              </div>
              
              {/* ВИПРАВЛЕНИЙ Event content - без додаткових відступів що розбивають лінію */}
              <div className="flex-1 min-w-0 pb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#333037] mb-1 leading-tight">
                      {event.status}
                    </h3>
                    <p className="text-[#333037]/70 text-sm mb-2 leading-relaxed">
                      {formatDescription(event.description)}
                    </p>
                    {event.location && (
                      <p className="text-[#333037]/60 text-sm flex items-center leading-tight">
                        <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {event.location}
                      </p>
                    )}
                  </div>
                  
                  {/* ВИПРАВЛЕНА дата та час - використовуємо новий формат */}
                  <div className="text-sm text-[#333037]/60 mt-2 sm:mt-0 sm:text-right sm:ml-4 flex-shrink-0">
                    <p className="font-medium">
                      {event.displayDate || event.date}
                    </p>
                    {event.time && <p className="leading-tight">{event.time}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Help text for timeline */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-[#f0e5d9] rounded-lg p-4">
          <h4 className="font-semibold text-[#333037] mb-2">Допомога з відстеженням</h4>
          <p className="text-[#333037]/70 text-sm">
            Якщо статус не оновлювався більше тижня, рекомендуємо звернутися до служби підтримки перевізника. 
            Деякі міжнародні відправлення можуть мати затримки через митні процедури.
          </p>
        </div>
      </div>
    </div>
  )
}