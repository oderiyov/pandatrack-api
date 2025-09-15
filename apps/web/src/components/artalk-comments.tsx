// src/components/artalk-comments.tsx - ФІНАЛЬНА РОБОЧА ВЕРСІЯ
'use client'

import { useEffect, useRef, useState } from 'react'
import 'artalk/dist/Artalk.css'

interface ArtalkCommentsProps {
  pageKey: string
  pageTitle: string
  showInfoBlock?: boolean
}

export default function ArtalkComments({ 
  pageKey, 
  pageTitle, 
  showInfoBlock = false 
}: ArtalkCommentsProps) {
  const artalkRef = useRef<HTMLDivElement>(null)
  const artalkInstance = useRef<unknown>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    const initArtalk = async () => {
      try {
        const ArtalkModule = await import('artalk')
        const Artalk = ArtalkModule.default
        
        if (!mounted || !artalkRef.current) return

        if (artalkInstance.current && typeof artalkInstance.current === 'object' && artalkInstance.current !== null) {
          const instance = artalkInstance.current as { destroy?: () => void }
          if (instance.destroy) {
            instance.destroy()
          }
          artalkInstance.current = null
        }

        artalkInstance.current = Artalk.init({
          el: artalkRef.current,
          server: 'https://api.pandatrack.com.ua/api/artalk/',
          site: 'PandaTrack',
          pageKey: pageKey,
          pageTitle: pageTitle,
          locale: 'uk',
          placeholder: 'Написати коментар...',
          noComment: 'Поки що немає коментарів',
          sendBtn: 'Опублікувати',
          vote: true,
          voteDown: true,
          preview: true,
          nestMax: 3,
          pagination: {
            pageSize: 20,
            readMore: true,
            autoLoad: true
          },
          reqTimeout: 10000
        })

        console.log('Artalk initialized successfully')
        setIsLoaded(true)
        setError(null)
        
      } catch (err) {
        console.error('Failed to load Artalk:', err)
        if (mounted) {
          setError('Не вдалося завантажити систему коментарів')
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    initArtalk()

    return () => {
      mounted = false
      if (artalkInstance.current && typeof artalkInstance.current === 'object' && artalkInstance.current !== null) {
        const instance = artalkInstance.current as { destroy?: () => void }
        if (instance.destroy) {
          instance.destroy()
        }
        artalkInstance.current = null
      }
    }
  }, [pageKey, pageTitle])

  const handleRetry = () => {
    setError(null)
    setIsLoading(true)
    setIsLoaded(false)
    window.location.reload()
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="text-center">
          <div className="text-red-600 font-medium mb-2">
            Коментарі тимчасово недоступні
          </div>
          <p className="text-red-700 text-sm mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
          >
            Оновити сторінку
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {showInfoBlock && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Важлива інформація
              </h4>
              <ul className="text-blue-800 space-y-2">
                <li>У коментарях відповідають звичайні користувачі</li>
                <li>Не працівники поштових служб чи адміністрації сайту</li>
                <li>Будьте ввічливими та дотримуйтесь правил спілкування</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Контакти підтримки
              </h4>
              <div className="text-blue-800 space-y-1">
                <div><strong>Нова Пошта:</strong> 0 800 500 609</div>
                <div><strong>Укрпошта:</strong> 0 800 300 545</div>
                <div><strong>DHL:</strong> 0 800 345 345</div>
                <div><strong>Адміністрація:</strong> pandatrack@gmail.com</div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="flex items-center justify-between text-xs text-blue-700">
              <span>У коментарях працює модерація контенту</span>
              <span>Підтримуються емодзі</span>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8">
          <div className="text-center">
            <div className="inline-flex items-center">
              <svg className="animate-spin h-5 w-5 text-gray-500 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-gray-600">Завантаження коментарів...</span>
            </div>
          </div>
        </div>
      )}

      <div 
        ref={artalkRef}
        className={`artalk-container ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        style={{ minHeight: isLoaded ? 'auto' : '200px' }}
      />
      
      {isLoaded && (
        <div className="text-center text-xs text-gray-500 border-t pt-4">
          <p>Ваші дані захищені та не передаються третім особам</p>
        </div>
      )}
    </div>
  )
}