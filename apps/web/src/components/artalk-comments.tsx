// components/artalk-comments.tsx - ПРАЦЮЮЧИЙ КОМПОНЕНТ
'use client'

import { useEffect, useRef } from 'react'

interface ArtalkCommentsProps {
  pageKey: string
  pageTitle: string
}

export default function ArtalkComments({ pageKey, pageTitle }: ArtalkCommentsProps) {
  const artalkRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && artalkRef.current) {
      // Динамічний імпорт Artalk
      import('artalk').then(({ default: Artalk }) => {
        Artalk.init({
          el: artalkRef.current!,
          pageKey: pageKey,
          pageTitle: pageTitle,
          server: 'https://api.pandatrack.com.ua/api/artalk',
          site: 'PandaTrack',
          locale: 'en', // Змінено на 'en' бо 'uk' не підтримується
          placeholder: 'Залишити коментар про відстеження...',
          noComment: 'Коментарів поки немає',
          sendBtn: 'Відправити',
          darkMode: 'auto',
          vote: true,
          voteDown: false,
          preview: true,
          flatMode: 'auto',
          // Налаштування для українського контенту
          heightLimit: {
            content: 300,
            children: 400
          },
          pagination: {
            pageSize: 10,
            readMore: true,
            autoLoad: true
          },
          // Кешування та performance
          reqTimeout: 15000,
          imgLazyLoad: 'native'
        })
      }).catch((error) => {
        console.error('Failed to load Artalk:', error)
        // Fallback повідомлення
        if (artalkRef.current) {
          artalkRef.current.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666; border: 1px solid #ddd; border-radius: 8px;">
              <p>Коментарі тимчасово недоступні</p>
              <small>Спробуйте оновити сторінку</small>
            </div>
          `
        }
      })
    }
  }, [pageKey, pageTitle])

  return (
    <div>
      <div ref={artalkRef} className="artalk-container"></div>
      
      {/* CSS стилі для українського контенту */}
      <style jsx global>{`
        .artalk-container {
          font-family: inherit;
        }
        
        /* Кастомні стилі для української мови */
        .atk-comment-wrap {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .atk-main-editor .atk-textarea {
          font-size: 14px;
          line-height: 1.5;
        }
        
        .atk-btn {
          background-color: #0074D9;
          border-color: #0074D9;
        }
        
        .atk-btn:hover {
          background-color: #0056b3;
          border-color: #0056b3;
        }
      `}</style>
    </div>
  )
}