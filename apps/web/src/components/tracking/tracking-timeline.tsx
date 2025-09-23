// components/tracking/tracking-timeline.tsx - v 3.0
'use client'

import { CarrierBadge } from '@/components/ui/carrier-badge'

interface TrackingEvent {
  date: string
  time?: string
  status: string
  description: string | string[]
  location?: string
  statusCode?: string
  displayDate?: string
  eventStatus?: 'future' | 'now' | 'passed'
  eventType?: string
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
  isDelivered: boolean
  carrier?: string
}

export default function TrackingTimeline({ events, isDelivered, carrier }: TrackingTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4 text-[#333037]">Історія відправлення</h2>
        <p className="text-[#333037]/70">Дані про історію відправлення поки недоступні</p>
      </div>
    )
  }

  //  СТРАТЕГSЯ КОНКУРЕНТSВ: Фильтруем future події
  const realEvents = events.filter(event => {
    // Прибираем події с eventStatus = 'future'
    if (event.eventStatus === 'future') return false
    
    // Прибираем події які починаються з "Will" або "Прибуде"
    if (event.status.toLowerCase().includes('will ')) return false
    if (event.status.toLowerCase().includes('прибуде')) return false
    if (event.status.toLowerCase().includes('виїде з') && 
        event.status.toLowerCase().includes('прибуде')) return false
    
    return true
  })

  // Sort events by date (newest first for display)
  const sortedEvents = [...realEvents].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA // Newest first
  })

  // Fix: Визначаемо ТІЛЬКИ ОДИН текущій статус
  const getCurrentEventIndex = () => {
    if (isDelivered) {
      // Якщо доставлено - знайти доставленну подію
      return sortedEvents.findIndex(event => {
        const status = event.status.toLowerCase()
        return status.includes('доставлено') || 
               status.includes('отримано') || 
               status.includes('delivered') ||
               status.includes('вручено')
      })
    }
    
    // Якщо в дорозі - перша подія (саме нове по даті)
    return 0
  }

  const currentEventIndex = getCurrentEventIndex()

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
          const isCurrent = index === currentEventIndex
          const { mainText, subText } = cleanStatusText(event.status, event.description, event.location)

          // ✅ ИСПРАВЛЕНО: Простая логика цветов
          const getStatusColor = () => {
            // Проверяем является ли это доставленным событием
            const isDeliveredEvent = ['доставлено', 'отримано', 'вручено', 'delivered'].some(keyword => 
              mainText.toLowerCase().includes(keyword)
            )
            
            if (isDeliveredEvent) {
              return {
                dot: 'bg-green-500 border-green-500',
                line: 'bg-gray-300',
                textWeight: 'font-bold',
                bgHighlight: isCurrent ? 'bg-green-50 border-l-4 border-green-500 pl-4 -ml-6 py-2' : ''
              }
            }
            
            // ТОЛЬКО текущее событие синим (если не доставлено)
            if (isCurrent && !isDeliveredEvent) {
              return {
                dot: 'bg-blue-500 border-blue-500 animate-pulse',
                line: 'bg-gray-300',
                textWeight: 'font-bold',
                bgHighlight: 'bg-blue-50 border-l-4 border-blue-500 pl-4 -ml-6 py-2'
              }
            }
            
            // ВСЕ остальные события серые
            return {
              dot: 'bg-gray-400 border-gray-400',
              line: 'bg-gray-300',
              textWeight: 'font-medium',
              bgHighlight: ''
            }
          }

          const colors = getStatusColor()

          return (
            <div key={index} className={`relative flex ${colors.bgHighlight} rounded-lg`}>
              {/* Timeline візуальний елемент */}
              <div className="flex flex-col items-center mr-4 pt-1">
                {/* Dot/Circle - вирівняний з H3 */}
                <div className={`w-3 h-3 rounded-full border-2 ${colors.dot} flex-shrink-0`}>
                </div>
                
                {/* Vertical Line - показується тільки якщо не останній елемент */}
                {!isLastEvent && (
                  <div className={`w-0.5 flex-1 mt-2 ${colors.line} min-h-[80px]`}></div>
                )}
              </div>

              {/* Event Content */}
              <div className="flex-1 pb-8">
                {/* Status Header */}
                <div className="mb-2">
                  <h3 className={`text-lg leading-tight text-[#333037] ${colors.textWeight}`}>
                    {/* Иконка для текущего статуса */}
                    {isCurrent && !mainText.toLowerCase().includes('доставлено') && (
                      <span className="text-blue-500 mr-2">🚛</span>
                    )}
                    {mainText.toLowerCase().includes('доставлено') && (
                      <span className="text-green-500 mr-2">✅</span>
                    )}
                    {mainText}
                  </h3>
                  
                  {/* Додаткова інформація - показуємо тільки якщо є */}
                  {subText && (
                    <p className="text-[#333037]/80 text-sm mt-1">
                      {subText}
                    </p>
                  )}
                </div>

                {/* Date and Time на одному рядку */}
                <div className="flex items-center text-sm text-[#333037]/70 mb-2">
                  <div className="font-semibold mr-2">
                    {event.displayDate || new Date(event.date).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) + ' р.'}
                  </div>
                  {event.time && (
                    <div className="font-semibold">
                      {event.time}
                    </div>
                  )}
                  
                  {/* Метка "Зараз тут" только для текущего события */}
                  {isCurrent && !mainText.toLowerCase().includes('доставлено') && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      Зараз тут
                    </span>
                  )}
                </div>

                {/* Carrier Badge */}
                {carrier && index === 0 && (
                  <CarrierBadge carrier={carrier} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Help Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Допомога з відстеженням</h4>
          <p className="text-blue-800 text-sm">
            🚛 <strong>"Зараз тут"</strong> показує поточне місцезнаходження посилки. 
            Якщо статус не оновлювався більше тижня, рекомендуємо звернутися до служби 
            підтримки перевізника.
          </p>
        </div>
      </div>
    </div>
  )
}