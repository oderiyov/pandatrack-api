// components/tracking/tracking-actions.tsx - ФІНАЛЬНЕ ВИПРАВЛЕННЯ
'use client'

import { useState } from 'react'

interface TrackingActionsProps {
  trackingNumber: string
  trackingUrl: string
}

export default function TrackingActions({ trackingNumber, trackingUrl }: TrackingActionsProps) {
  const [copiedNumber, setCopiedNumber] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)

  const copyToClipboard = async (text: string, type: 'number' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      if (type === 'number') {
        setCopiedNumber(true)
        setTimeout(() => setCopiedNumber(false), 2000)
      } else {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      }
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (type === 'number') {
        setCopiedNumber(true)
        setTimeout(() => setCopiedNumber(false), 2000)
      } else {
        setCopiedUrl(true)
        setTimeout(() => setCopiedUrl(false), 2000)
      }
    }
  }

  const shareUrls = {
    telegram: `https://t.me/share/url?url=${encodeURIComponent(trackingUrl)}&text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber}`)}`,
    viber: `viber://forward?text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber} ${trackingUrl}`)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber} ${trackingUrl}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4 text-[#333037]">Дії</h3>
      
      <div className="space-y-4">
        {/* Copy Actions */}
        <div className="space-y-3">
          <button
            onClick={() => copyToClipboard(trackingNumber, 'number')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <span className="font-medium text-[#333037]">
              {copiedNumber ? 'Скопійовано!' : 'Копіювати номер'}
            </span>
            <svg 
              className="w-5 h-5 text-[#333037]/60 group-hover:text-[#333037]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
          </button>
          
          <button
            onClick={() => copyToClipboard(trackingUrl, 'url')}
            className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
          >
            <span className="font-medium text-[#333037]">
              {copiedUrl ? 'Скопійовано!' : 'Копіювати посилання'}
            </span>
            <svg 
              className="w-5 h-5 text-[#333037]/60 group-hover:text-[#333037]" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" 
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}