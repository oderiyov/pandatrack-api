// components/tracking/tracking-actions.tsx
'use client'

import { useState } from 'react'

interface TrackingActionsProps {
  trackingNumber: string
  trackingUrl: string
}

export default function TrackingActions({ trackingNumber, trackingUrl }: TrackingActionsProps) {
  const [copied, setCopied] = useState<'number' | 'url' | null>(null)

  const copyToClipboard = async (text: string, type: 'number' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      setTimeout(() => setCopied(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareToSocial = (platform: 'telegram' | 'viber' | 'whatsapp' | 'facebook' | 'twitter') => {
    const text = `Відстежую посилку ${trackingNumber} на PandaTrack`
    const url = trackingUrl

    const shareUrls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      viber: `viber://forward?text=${encodeURIComponent(`${text} ${url}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    }

    const shareUrl = shareUrls[platform]
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4 text-[#333037]">Дії</h3>
      
      {/* Copy Actions */}
      <div className="space-y-3 mb-6">
        <button
          onClick={() => copyToClipboard(trackingNumber, 'number')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-[#333037]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span className="font-medium text-[#333037]">
              {copied === 'number' ? 'Скопійовано!' : 'Копіювати номер'}
            </span>
          </div>
          {copied === 'number' && (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <button
          onClick={() => copyToClipboard(trackingUrl, 'url')}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-[#333037]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="font-medium text-[#333037]">
              {copied === 'url' ? 'Скопійовано!' : 'Копіювати посилання'}
            </span>
          </div>
          {copied === 'url' && (
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
      </div>

      {/* Social Sharing */}
      <div className="border-t border-gray-200 pt-6">
        <h4 className="font-semibold text-[#333037] mb-3">Поділитися</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => shareToSocial('telegram')}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 8.16c-.168 1.71-.896 5.728-1.264 7.604-.156.794-.464 1.06-.76 1.086-.646.06-1.136-.426-1.762-.836l-3.716-2.42c-.624-.426-.22-.676.136-1.068.096-.104 1.756-1.592 1.796-1.728.006-.02.006-.094-.038-.132-.044-.04-.11-.026-.156-.016-.066.014-1.11.704-3.136 2.072-.296.2-.566.3-.806.296-.266-.006-.78-.15-1.162-.274-.466-.15-.836-.23-.804-.486.016-.134.176-.27.48-.41 1.996-.87 3.328-1.444 3.996-1.72 1.906-.788 2.302-.926 2.556-.926.056 0 .184.012.266.072.068.05.086.116.094.162.006.036.014.12-.006.186z"/>
            </svg>
            <span className="text-sm font-medium text-blue-600">Telegram</span>
          </button>

          <button
            onClick={() => shareToSocial('viber')}
            className="flex items-center justify-center space-x-2 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 0C7.5 0 3.5 4 3.5 9c0 1.7.5 3.3 1.3 4.7L3 24l7.5-2.5c1.3.3 2.7.5 4.1.5 5 0 9-4 9-9S17.5 0 12.5 0zm0 16.5c-1.3 0-2.5-.3-3.6-.8l-2.6.9.9-2.6c-.6-1.1-.9-2.3-.9-3.6 0-4.1 3.4-7.5 7.5-7.5s7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z"/>
            </svg>
            <span className="text-sm font-medium text-purple-600">Viber</span>
          </button>

          <button
            onClick={() => shareToSocial('whatsapp')}
            className="flex items-center justify-center space-x-2 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm.01 1.67c4.62 0 8.24 3.62 8.24 8.24 0 4.62-3.62 8.24-8.24 8.24-1.37 0-2.72-.35-3.91-1.01l-.84-.52-3.01.79.85-3.05-.53-.84c-.72-1.21-1.1-2.6-1.1-4.01 0-4.62 3.62-8.24 8.24-8.24z"/>
            </svg>
            <span className="text-sm font-medium text-green-600">WhatsApp</span>
          </button>

          <button
            onClick={() => shareToSocial('facebook')}
            className="flex items-center justify-center space-x-2 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="text-sm font-medium text-blue-600">Facebook</span>
          </button>
        </div>
      </div>
    </div>
  )
}