// components/tracking/tracking-timeline.tsx - ОПТИМІЗОВАНА ВЕРСІЯ
'use client'

interface TrackingEvent {
  date: string
  time?: string
  status: string
  description: string | string[]
  location?: string
  statusCode?: string
  displayDate?: string
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
  isDelivered: boolean
}

export default function TrackingTimeline({ events, isDelivered }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-[#333037]">Історія відправлення</h2>
        <p className="text-[#333037]/70">Дані про історію відправлення поки недоступні</p>
      </div>
    )
  }

  // Sort events by date (newest first for display)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA // Newest first
  })

  // Функція для очищення тексту від дублювання
  const cleanStatusText = (status: string, description: string | string[], location?: string) => {
    const descText = Array.isArray(description) ? description.join(', ') : description
    
    // Якщо status і description ідентичні, показуємо тільки один раз
    if (status === descText) {
      return {
        mainText: status,
        subText: location || null
      }
    }
    
    // Якщо description містить додаткову інформацію
    if (descText && descText !== status) {
      // Перевіряємо чи description не просто повторює status
      const statusLower = status.toLowerCase()
      const descLower = descText.toLowerCase()
      
      if (descLower.includes(statusLower) || statusLower.includes(descLower)) {
        // Якщо один містить інший, беремо довший
        const mainText = descText.length > status.length ? descText : status
        return {
          mainText,
          subText: location || null
        }
      } else {
        // Якщо різні, показуємо статус як заголовок, опис як підтекст
        return {
          mainText: status,
          subText: location ? `${descText} • ${location}` : descText
        }
      }
    }
    
    // За замовчуванням
    return {
      mainText: status,
      subText: location || null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-[#333037]">Історія відправлення</h2>
      
      <div className="relative">
        {sortedEvents.map((event, index) => {
          const isLastEvent = index === sortedEvents.length - 1
          const isFirstEvent = index === 0
          const { mainText, subText } = cleanStatusText(event.status, event.description, event.location)

          // Determine status color
          const getStatusColor = () => {
            if (isFirstEvent && isDelivered) {
              return {
                dot: 'bg-green-500',
                ring: 'ring-green-500 ring-opacity-30',
                line: 'bg-gray-300'
              }
            } else if (index < 3) {
              return {
                dot: 'bg-blue-500',
                ring: 'ring-blue-500 ring-opacity-30',
                line: 'bg-gray-300'
              }
            } else {
              return {
                dot: 'bg-gray-400',
                ring: 'ring-gray-400 ring-opacity-30',
                line: 'bg-gray-300'
              }
            }
          }

          const colors = getStatusColor()

          return (
            <div key={index} className="relative">
              <div className="flex items-start">
                {/* Timeline візуальний елемент */}
                <div className="flex flex-col items-center">
                  {/* Dot/Circle з кільцем */}
                  <div className={`relative w-3 h-3 ${colors.dot} rounded-full ${colors.ring} ring-4`}>
                  </div>
                  
                  {/* Vertical Line - показується тільки якщо не останній елемент */}
                  {!isLastEvent && (
                    <div className={`w-0.5 h-16 mt-2 ${colors.line}`}></div>
                  )}
                </div>

                {/* Event Content */}
                <div className="ml-6 flex-1 min-w-0">
                  {/* Основний текст статусу */}
                  <h3 className="font-semibold text-[#333037] text-base leading-snug">
                    {mainText}
                  </h3>
                  
                  {/* Додаткова інформація */}
                  {subText && (
                    <p className="text-[#333037]/70 text-sm mt-1 leading-relaxed">
                      {subText}
                    </p>
                  )}

                  {/* Date and Time */}
                  <div className="flex items-center mt-2 text-sm">
                    <span className="font-medium text-[#333037]">
                      {event.displayDate || new Date(event.date).toLocaleDateString('uk-UA', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) + ' р.'}
                    </span>
                    {event.time && (
                      <span className="text-[#333037]/60 ml-2">
                        {event.time}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Spacing between events */}
              {!isLastEvent && <div className="h-4"></div>}
            </div>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Допомога з відстеженням</h4>
          <p className="text-blue-800 text-sm">
            Якщо статус не оновлювався більше тижня, рекомендуємо звернутися до служби 
            підтримки перевізника. Деякі міжнародні відправлення можуть мати затримки 
            через митні процедури.
          </p>
        </div>
      </div>
    </div>
  )
}