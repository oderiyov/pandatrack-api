// components/tracking/tracking-timeline.tsx - v2.0
'use client'

import { ReactElement } from 'react'
import { CarrierBadge } from '@/components/ui/carrier-badge'

interface TrackingEvent {
  date: string
  time?: string
  status: string
  description: string | string[]
  location?: string
  statusCode?: string
  displayDate?: string
  eventStatus?: 'future' | 'now' | 'passed' // ✅ ДОБАВЛЕНО із API
  eventType?: string
}

interface TrackingTimelineProps {
  events: TrackingEvent[]
  isDelivered: boolean
  carrier?: string
}

interface EventSection {
  title: string
  description: string
  events: TrackingEvent[]
  type: 'current' | 'future' | 'past'
  bgColor: string
  borderColor: string
  textColor: string
  icon: ReactElement
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

  // ✅ КЛЮЧОВЕ НОВОВВЕДЕННЯ: Розділяємо події по eventStatus
  const futureEvents = events.filter(e => e.eventStatus === 'future').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const currentEvents = events.filter(e => e.eventStatus === 'now' || (!e.eventStatus && isCurrentEvent(e)))
  const pastEvents = events.filter(e => e.eventStatus === 'passed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Функція для визначення поточних подій (fallback)
  function isCurrentEvent(event: TrackingEvent): boolean {
    const currentKeywords = ['в дорозі', 'готується', 'обробляється', 'очікує']
    const status = event.status.toLowerCase()
    return currentKeywords.some(keyword => status.includes(keyword))
  }

  // ✅ Функція для очищення тексту від дублювання
  const cleanStatusText = (status: string, description: string | string[], location?: string) => {
    const descText = Array.isArray(description) ? description.join(', ') : description
    
    if (status === descText) {
      return {
        mainText: status,
        subText: location || null
      }
    }
    
    if (descText && descText !== status) {
      const statusLower = status.toLowerCase()
      const descLower = descText.toLowerCase()
      
      if (descLower.includes(statusLower) || statusLower.includes(descLower)) {
        const mainText = descText.length > status.length ? descText : status
        return {
          mainText,
          subText: location || null
        }
      } else {
        return {
          mainText: status,
          subText: location ? `${descText} • ${location}` : descText
        }
      }
    }
    
    return {
      mainText: status,
      subText: location || null
    }
  }

  // ✅ Конфігурація секцій
  const sections: EventSection[] = []

  // Поточне положення (найвища пріорітетність)
  if (currentEvents.length > 0) {
    sections.push({
      title: 'Поточне положення',
      description: 'Де знаходиться ваша посилка зараз',
      events: currentEvents,
      type: 'current',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    })
  }

  // Прогноз маршруту (тільки якщо не доставлено)
  if (!isDelivered && futureEvents.length > 0) {
    sections.push({
      title: 'Прогноз маршруту',
      description: 'Заплановані зупинки та час доставки',
      events: futureEvents.slice(0, 5), // Показуємо максимум 5 майбутніх подій
      type: 'future',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200', 
      textColor: 'text-purple-900',
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    })
  }

  // Історія відправлення
  if (pastEvents.length > 0) {
    sections.push({
      title: 'Історія відправлення',
      description: 'Пройдений шлях вашої посилки',
      events: pastEvents,
      type: 'past',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-900',
      icon: (
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    })
  }

  return (
    <div className="space-y-6">
      {sections.map((section, sectionIndex) => (
        <div key={section.type} className={`${section.bgColor} ${section.borderColor} border rounded-lg p-6`}>
          {/* Заголовок секції */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex-shrink-0">
              {section.icon}
            </div>
            <div>
              <h2 className={`text-xl font-bold ${section.textColor}`}>
                {section.title}
              </h2>
              <p className={`text-sm ${section.textColor}/70`}>
                {section.description}
              </p>
            </div>
          </div>

          {/* Eventi в секції */}
          <div className="relative">
            {section.events.map((event, eventIndex) => {
              const isLastEvent = eventIndex === section.events.length - 1
              const { mainText, subText } = cleanStatusText(event.status, event.description, event.location)

              // ✅ Покращена логіка кольорів based on section type
              const getEventColors = () => {
                switch (section.type) {
                  case 'current':
                    return {
                      dot: 'bg-blue-500 border-blue-500 animate-pulse',
                      line: 'bg-blue-300',
                      highlight: 'ring-4 ring-blue-100'
                    }
                  case 'future':
                    return {
                      dot: 'bg-purple-400 border-purple-400',
                      line: 'bg-purple-300',
                      highlight: ''
                    }
                  case 'past':
                    const isDeliveredEvent = ['доставлено', 'отримано', 'вручено', 'delivered'].some(keyword => 
                      mainText.toLowerCase().includes(keyword)
                    )
                    return {
                      dot: isDeliveredEvent ? 'bg-green-500 border-green-500' : 'bg-gray-400 border-gray-400',
                      line: 'bg-gray-300',
                      highlight: isDeliveredEvent ? 'ring-4 ring-green-100' : ''
                    }
                  default:
                    return {
                      dot: 'bg-gray-400 border-gray-400',
                      line: 'bg-gray-300',
                      highlight: ''
                    }
                }
              }

              const colors = getEventColors()

              return (
                <div key={eventIndex} className={`relative flex ${colors.highlight} rounded-lg p-2 -m-2`}>
                  {/* Timeline візуальний елемент */}
                  <div className="flex flex-col items-center mr-4 pt-1">
                    <div className={`w-4 h-4 rounded-full border-2 ${colors.dot} flex-shrink-0 z-10`} />
                    
                    {!isLastEvent && (
                      <div className={`w-0.5 flex-1 mt-2 ${colors.line} min-h-[60px]`} />
                    )}
                  </div>

                  {/* Event Content */}
                  <div className="flex-1 pb-6">
                    <div className="mb-2">
                      <h3 className={`font-bold text-lg leading-tight ${section.textColor}`}>
                        {/* ✅ Додаємо іконки для різних типів подій */}
                        <span className="inline-flex items-center space-x-2">
                          {section.type === 'future' && (
                            <span className="text-purple-500">📅</span>
                          )}
                          {section.type === 'current' && (
                            <span className="text-blue-500">🚛</span>
                          )}
                          {section.type === 'past' && mainText.toLowerCase().includes('доставлено') && (
                            <span className="text-green-500">✅</span>
                          )}
                          <span>{mainText}</span>
                        </span>
                      </h3>
                      
                      {subText && (
                        <p className={`text-sm mt-1 ${section.textColor}/80`}>
                          {subText}
                        </p>
                      )}
                    </div>

                    {/* Дата и время */}
                    <div className={`flex items-center text-sm mb-2 ${section.textColor}/70`}>
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
                      
                      {/* ✅ Индикатор для будущих событий */}
                      {section.type === 'future' && (
                        <span className="ml-2 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          Прогноз
                        </span>
                      )}
                    </div>

                    {/* Carrier Badge */}
                    {carrier && (
                      <CarrierBadge carrier={carrier} />
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ✅ Додаткова інформація для прогнозу */}
          {section.type === 'future' && (
            <div className="mt-4 p-3 bg-purple-100 rounded-lg">
              <p className="text-xs text-purple-800">
                <strong>Примітка:</strong> Прогнозовані час та дати можуть змінюватися в залежності від 
                завантаженості маршруту та інших факторів.
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Help Section */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Допомога з відстеженням</h4>
          <div className="text-blue-800 text-sm space-y-2">
            <p>
              <strong>🚛 Поточне положення</strong> — показує де знаходиться посилка зараз
            </p>
            <p>
              <strong>📅 Прогноз маршруту</strong> — орієнтовний план доставки від перевізника
            </p>
            <p>
              <strong>⏰ Історія</strong> — весь пройдений шлях з реальними датами
            </p>
            <p className="mt-3 pt-2 border-t border-blue-200">
              Якщо статус не оновлювався більше тижня, рекомендуємо звернутися до служби 
              підтримки перевізника.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}