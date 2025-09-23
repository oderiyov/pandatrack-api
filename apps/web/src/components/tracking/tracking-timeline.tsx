// components/tracking/tracking-timeline.tsx - В СТИЛЕ КОНКУРЕНТОВ
'use client'

import React from 'react'
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

  // Сортуємо події по даті (новіші зверху як у конкурентів)
  const sortedEvents = [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return dateB - dateA // Newest first
  })

  // ✅ КЛЮЧОВА ЛОГІКА: визначаємо поточне положення посилки
  const getCurrentEventIndex = () => {
    if (isDelivered) {
      // Якщо доставлено - знаходимо перше delivered event
      return sortedEvents.findIndex(e => 
        e.status.toLowerCase().includes('доставлено') ||
        e.status.toLowerCase().includes('отримано') ||
        e.status.toLowerCase().includes('delivered')
      )
    }

    // Для в дорозі - знаходимо останню реальну (не майбутню) подію
    const lastRealEventIndex = sortedEvents.findIndex(e => 
      e.eventStatus !== 'future' && 
      !e.status.toLowerCase().includes('will ') &&
      !e.status.toLowerCase().includes('прибуде') &&
      !e.status.toLowerCase().includes('виїде з') // Виключаємо майбутні
    )
    
    return lastRealEventIndex !== -1 ? lastRealEventIndex : 0
  }

  const currentEventIndex = getCurrentEventIndex()

  // Функція очищення тексту
  const cleanStatusText = (status: string, description: string | string[], location?: string) => {
    const descText = Array.isArray(description) ? description.join(', ') : description
    
    if (status === descText) {
      return {
        mainText: status,
        subText: location || null
      }
    }
    
    return {
      mainText: status,
      subText: location || null
    }
  }

  // ✅ ВИЗНАЧЕННЯ типу події для стилювання
  const getEventType = (event: TrackingEvent, index: number) => {
    const isCurrent = index === currentEventIndex
    const isFuture = event.eventStatus === 'future' || 
                    event.status.toLowerCase().includes('will ') ||
                    event.status.toLowerCase().includes('прибуде')
    const isDeliveredEvent = event.status.toLowerCase().includes('доставлено') ||
                           event.status.toLowerCase().includes('отримано') ||
                           event.status.toLowerCase().includes('delivered')

    if (isCurrent && !isFuture) return 'current'
    if (isDeliveredEvent) return 'delivered'  
    if (isFuture) return 'future'
    return 'past'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-bold mb-6 text-[#333037]">Історія відправлення</h2>
      
      {/* ✅ ПРОСТИЙ СПИСОК як у Vidstezhyty */}
      <div className="space-y-4">
        {sortedEvents.map((event, index) => {
          const { mainText, subText } = cleanStatusText(event.status, event.description, event.location)
          const eventType = getEventType(event, index)

          return (
            <div key={index} className={`relative flex items-start space-x-4 p-4 rounded-lg transition-all ${
              eventType === 'current' ? 'bg-blue-50 border-l-4 border-blue-500' : 
              eventType === 'delivered' ? 'bg-green-50 border-l-4 border-green-500' :
              eventType === 'future' ? 'bg-purple-50 border-l-4 border-purple-300' :
              'hover:bg-gray-50'
            }`}>
              
              {/* ✅ Індикатор статусу */}
              <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${
                eventType === 'current' ? 'bg-blue-500 animate-pulse' :
                eventType === 'delivered' ? 'bg-green-500' :
                eventType === 'future' ? 'bg-purple-300' :
                'bg-gray-400'
              }`} />

              {/* Контент події */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  {/* Статус - ЖИРНИМ як у Nova Poshta для поточного */}
                  <h3 className={`text-base leading-tight text-[#333037] ${
                    eventType === 'current' || eventType === 'future' ? 'font-bold' : 'font-medium'
                  }`}>
                    {/* ✅ Іконки як у конкурентів */}
                    {eventType === 'current' && '🚛 '}
                    {eventType === 'delivered' && '✅ '}
                    {eventType === 'future' && '📅 '}
                    {mainText}
                  </h3>

                  {/* Мітка поточного положення */}
                  {eventType === 'current' && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      Зараз тут
                    </span>
                  )}
                </div>

                {/* Локація якщо є */}
                {subText && (
                  <p className="text-sm text-[#333037]/70 mb-2">{subText}</p>
                )}

                {/* Дата та час */}
                <div className="flex items-center text-sm text-[#333037]/60 space-x-3">
                  <div className="font-medium">
                    {event.displayDate || new Date(event.date).toLocaleDateString('uk-UA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) + ' р.'}
                  </div>
                  {event.time && (
                    <div className="font-medium">{event.time}</div>
                  )}
                  
                  {/* Перевізник тільки для першої події */}
                  {index === 0 && carrier && (
                    <CarrierBadge carrier={carrier} />
                  )}
                </div>

                {/* Додаткова інформація для прогнозних подій */}
                {eventType === 'future' && (
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                      Прогнозована подія
                    </span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ✅ Статистика внизу як у OrderTracker */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-blue-900">Статистика відстеження</h4>
            <span className="text-xs text-blue-600">Оновлено щойно</span>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-bold text-blue-600 text-lg">
                {events.filter(e => e.eventStatus !== 'future').length}
              </div>
              <div className="text-blue-800">Подій пройдено</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600 text-lg">
                {events.filter(e => e.eventStatus === 'future').length}
              </div>
              <div className="text-blue-800">Заплановано</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-blue-600 text-lg">
                {carrier || 'Nova Poshta'}
              </div>
              <div className="text-blue-800">Перевізник</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}