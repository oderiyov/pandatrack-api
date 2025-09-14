// components/artalk-comments.tsx - З правильною типізацією
'use client'

import { useEffect, useRef, useState } from 'react'

interface ArtalkCommentsProps {
  pageKey: string
  pageTitle: string
  showInfoBlock?: boolean
}

// Типізація для глобального Artalk
declare global {
  interface Window {
    Artalk?: {
      init: (config: ArtalkConfig) => void
    }
  }
}

// Основні типи для Artalk конфігурації
interface ArtalkConfig {
  el: HTMLElement
  pageKey: string
  pageTitle: string
  server: string
  site: string
  locale?: string
  placeholder?: string
  noComment?: string
  sendBtn?: string
  darkMode?: 'auto' | boolean
  vote?: boolean
  voteDown?: boolean
  preview?: boolean
  flatMode?: 'auto' | boolean
  heightLimit?: {
    content: number
    children: number
    scrollable: boolean
  }
  pagination?: {
    pageSize: number
    readMore: boolean
    autoLoad: boolean
  }
  reqTimeout?: number
  imgLazyLoad?: 'native' | false
  versionCheck?: boolean
  emoticons?: string
  nestMax?: number
  nestSort?: 'DATE_ASC' | 'DATE_DESC'
  gravatar?: {
    mirror: string
    params: string
  }
}

// Інформаційний блок перед чатом
function CommentsInfoBlock() {
  const [onlineCount, setOnlineCount] = useState(12)
  const [totalComments] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineCount(prev => Math.max(8, prev + Math.floor(Math.random() * 3) - 1))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6 text-sm leading-relaxed">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-blue-900 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Коментарі ({totalComments.toLocaleString()}) • {onlineCount} онлайн
        </h3>
      </div>

      <div className="space-y-3 text-blue-800">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="font-medium mb-2">📞 Контакти служб доставки:</p>
            <ul className="space-y-1">
              <li><strong>Нова Пошта:</strong> 0 800 500 609</li>
              <li><strong>Укрпошта:</strong> 0 800 300 545</li>
              <li><strong>Міст Експрес:</strong> 0 800 240 000</li>
            </ul>
          </div>
          
          <div>
            <p className="font-medium mb-2">💡 Корисні посилання:</p>
            <ul className="space-y-1">
              <li><a href="https://cabinet.customs.gov.ua/post" className="text-blue-600 hover:underline">Митниця України</a></li>
              <li><a href="/guides/delivery-times" className="text-blue-600 hover:underline">Терміни доставки</a></li>
              <li><a href="/guides/tracking-help" className="text-blue-600 hover:underline">Довідка по трекінгу</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-blue-200 pt-3 mt-4">
          <p className="font-medium text-blue-900 mb-2">⚠️ Важливо знати:</p>
          <ul className="space-y-1">
            <li>👥 У коментарях відповідають звичайні користувачі, а не співробітники поштових служб</li>
            <li>🕐 Якщо статус не змінюється тиждень — зверніться до відділення</li>
            <li>📧 Питання адміністрації: <a href="mailto:support@pandatrack.com.ua" className="text-blue-600 hover:underline">support@pandatrack.com.ua</a></li>
            <li>🤖 Telegram бот: <a href="https://t.me/pandatrack_bot" className="text-blue-600 hover:underline">@pandatrack_bot</a></li>
          </ul>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded p-3 mt-4">
          <p className="text-orange-800">
            🎁 <strong>Промокод TEMU:</strong> до 4000 грн знижки для нових користувачів
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ArtalkComments({ pageKey, pageTitle, showInfoBlock = true }: ArtalkCommentsProps) {
  const artalkRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('ArtalkComments useEffect triggered - start')
    
    const initializeArtalk = () => {
      // Перевірити чи Artalk доступний глобально
      if (typeof window !== 'undefined' && window.Artalk && artalkRef.current) {
        console.log('Artalk CDN found, initializing...')
        
        try {
          const config: ArtalkConfig = {
            el: artalkRef.current,
            pageKey: pageKey,
            pageTitle: pageTitle,
            server: 'https://api.pandatrack.com.ua/api/artalk',
            site: 'PandaTrack',
            locale: 'en',
            placeholder: 'Залишити коментар про відстеження...',
            noComment: 'Коментарів поки немає. Будьте першим!',
            sendBtn: 'Відправити',
            darkMode: 'auto',
            vote: true,
            voteDown: false,
            preview: true,
            flatMode: 'auto',
            
            heightLimit: {
              content: 300,
              children: 400,
              scrollable: false
            },
            
            pagination: {
              pageSize: 15,
              readMore: true,
              autoLoad: true
            },
            
            reqTimeout: 15000,
            imgLazyLoad: 'native',
            versionCheck: false,
            
            emoticons: 'https://cdn.jsdelivr.net/gh/ArtalkJS/Emoticons/grps/default.json',
            nestMax: 3,
            nestSort: 'DATE_ASC',
            
            gravatar: {
              mirror: 'https://www.gravatar.com/avatar/',
              params: 'sha256=1&d=mp&s=80'
            }
          }

          window.Artalk.init(config)
          
          console.log('Artalk initialized successfully')
          setLoading(false)
          
        } catch (initError) {
          console.error('Artalk initialization error:', initError)
          setError(`Помилка ініціалізації: ${initError instanceof Error ? initError.message : 'Невідома помилка'}`)
          setLoading(false)
        }
      } else {
        console.log('Artalk CDN not ready yet, checking availability...')
        console.log('window.Artalk:', typeof window?.Artalk)
        console.log('artalkRef.current:', !!artalkRef.current)
        
        // Спробувати знову через 500ms, максимум 10 спроб (5 секунд)
        let attempts = 0
        const checkInterval = setInterval(() => {
          attempts++
          console.log(`Attempt ${attempts} to find Artalk CDN`)
          
          if (window.Artalk && artalkRef.current) {
            console.log('Artalk CDN found on attempt', attempts)
            clearInterval(checkInterval)
            initializeArtalk()
          } else if (attempts >= 10) {
            console.error('Artalk CDN not loaded after 10 attempts')
            clearInterval(checkInterval)
            setError('Не вдалося завантажити систему коментарів')
            setLoading(false)
          }
        }, 500)
      }
    }
    
    // Почати ініціалізацію
    initializeArtalk()
    
  }, [pageKey, pageTitle])

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        {showInfoBlock && <CommentsInfoBlock />}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
          <p className="text-center text-gray-500 mt-4">Завантаження коментарів...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        {showInfoBlock && <CommentsInfoBlock />}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.232 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Коментарі тимчасово недоступні</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Оновити сторінку
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showInfoBlock && <CommentsInfoBlock />}
      
      <div className="bg-white rounded-lg shadow-sm">
        <div ref={artalkRef} className="artalk-container p-6"></div>
      </div>
    </div>
  )
}