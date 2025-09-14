// components/artalk-comments.tsx - ОСТАТОЧНО ВИПРАВЛЕНО
'use client'

import { useEffect, useRef, useState } from 'react'

interface ArtalkCommentsProps {
  pageKey: string
  pageTitle: string
  showInfoBlock?: boolean
}

// Інформаційний блок перед чатом
function CommentsInfoBlock() {
  const [onlineCount, setOnlineCount] = useState(12)
  const [totalComments] = useState(0) // ВИПРАВЛЕНО: видалено setTotalComments

  // Симуляція лічильників
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
    if (typeof window !== 'undefined' && artalkRef.current) {
      setLoading(true)
      setError(null)

      // Динамічний імпорт Artalk з кращою обробкою помилок
      import('artalk').then(({ default: Artalk }) => {
        try {
          Artalk.init({
            el: artalkRef.current!,
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
            
            // ВИПРАВЛЕНО: додано scrollable параметр
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
          })
          
          setLoading(false)
        } catch (initError) {
          console.error('Artalk initialization error:', initError)
          setError('Помилка ініціалізації коментарів')
          setLoading(false)
        }
      }).catch((importError) => {
        console.error('Failed to load Artalk:', importError)
        setError('Не вдалося завантажити систему коментарів')
        setLoading(false)
      })
    }
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
      
      {/* Кастомні стилі для українського контенту */}
      <style jsx global>{`
        .artalk-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
        }
        
        .atk-comment-wrap {
          font-family: inherit;
        }
        
        .atk-main-editor .atk-textarea {
          font-size: 14px;
          line-height: 1.5;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          padding: 12px;
          resize: vertical;
          min-height: 80px;
        }
        
        .atk-main-editor .atk-textarea:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        
        .atk-btn {
          background-color: #3b82f6;
          border-color: #3b82f6;
          border-radius: 6px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .atk-btn:hover {
          background-color: #2563eb;
          border-color: #2563eb;
          transform: translateY(-1px);
        }
        
        .atk-item {
          border-radius: 8px;
          margin-bottom: 16px;
          padding: 16px;
          background: #fafafa;
          border: 1px solid #f0f0f0;
        }
        
        .atk-item:hover {
          background: #f8f9fa;
          border-color: #e9ecef;
        }
        
        .atk-avatar img {
          border-radius: 50%;
          width: 40px;
          height: 40px;
        }
        
        @media (max-width: 768px) {
          .atk-main-editor .atk-textarea {
            font-size: 16px;
          }
          
          .atk-item {
            padding: 12px;
            margin-bottom: 12px;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .atk-item {
            background: #1f2937;
            border-color: #374151;
            color: #f9fafb;
          }
          
          .atk-main-editor .atk-textarea {
            background: #374151;
            border-color: #4b5563;
            color: #f9fafb;
          }
        }
        
        .atk-vote-btn {
          transition: all 0.2s ease;
        }
        
        .atk-vote-btn:hover {
          transform: scale(1.1);
        }
        
        .atk-content {
          line-height: 1.7;
          word-wrap: break-word;
        }
        
        .atk-content blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 16px;
          margin: 16px 0;
          font-style: italic;
          color: #6b7280;
        }
        
        .atk-content code {
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.9em;
        }
        
        .atk-content a {
          color: #3b82f6;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }
        
        .atk-content a:hover {
          border-bottom-color: #3b82f6;
        }
      `}</style>
    </div>
  )
}