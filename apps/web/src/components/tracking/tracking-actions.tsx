// components/tracking/tracking-actions.tsx - ВИПРАВЛЕНО ESLint
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
    } catch (_err) { // ВИПРАВЛЕНО: err → _err
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

  // ВИПРАВЛЕНО: видалено unused shareUrls variable, використовуємо inline
  const handleShare = (platform: string) => {
    const urls: Record<string, string> = {
      telegram: `https://t.me/share/url?url=${encodeURIComponent(trackingUrl)}&text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber}`)}`,
      viber: `viber://forward?text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber} ${trackingUrl}`)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`Відстеження посилки: ${trackingNumber} ${trackingUrl}`)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackingUrl)}`
    }

    const url = urls[platform]
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
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

        {/* Social Share Actions */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-[#333037] mb-3">Поділитися</h4>
          <div className="grid grid-cols-2 gap-2">
            
            {/* Telegram */}
            <button
              onClick={() => handleShare('telegram')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
              </svg>
              <span className="text-sm font-medium text-blue-600">Telegram</span>
            </button>

            {/* Viber */}
            <button
              onClick={() => handleShare('viber')}
              className="flex items-center justify-center space-x-2 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.398.002C9.473.028 5.331.344 3.014 2.467 1.294 4.177.693 6.698.623 9.82c-.06 3.11-.13 8.95 5.5 10.541v2.42s-.038.97.602.584c.64-.388 2.91-1.77 4.298-2.94 5.95.122 10.51-.18 11.089-.23.789-.067 5.262-.437 5.873-5.46.63-5.177-.36-8.484-1.377-9.84-1.716-2.293-5.04-2.843-6.505-2.985C18.104.501 15.016.002 11.398.002z"/>
              </svg>
              <span className="text-sm font-medium text-purple-600">Viber</span>
            </button>

            {/* WhatsApp */}
            <button
              onClick={() => handleShare('whatsapp')}
              className="flex items-center justify-center space-x-2 p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.473 3.707"/>
              </svg>
              <span className="text-sm font-medium text-green-600">WhatsApp</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleShare('facebook')}
              className="flex items-center justify-center space-x-2 p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group"
            >
              <svg className="w-5 h-5 text-blue-700" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-sm font-medium text-blue-700">Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}