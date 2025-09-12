// components/tracking/tracking-actions.tsx
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

        {/* Share Section - ПОВЕРНЕНО ОРИГІНАЛЬНИЙ ФОРМАТ */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="font-semibold text-[#333037] mb-3">Поділитися</h4>
          <div className="flex space-x-3">
            {/* Telegram */}
            <a
              href={shareUrls.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-8 h-8 text-[#0088cc] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span className="text-xs text-[#333037] group-hover:text-[#0088cc] transition-colors">Telegram</span>
            </a>

            {/* Viber - ВИПРАВЛЕНИЙ ЛОГОТИП */}
            <a
              href={shareUrls.viber}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-8 h-8 text-[#665CAC] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 2.079.549 4.03 1.506 5.709L0 24l6.304-1.536c1.68.957 3.631 1.507 5.713 1.507 6.619 0 11.986-5.367 11.986-11.984C23.003 5.367 17.636.001 12.017.001zm5.539 7.87c-.1-.682-.735-1.24-1.365-1.24-.192 0-.373.034-.528.094a6.806 6.806 0 00-.362.016c-.735-.019-1.488.097-2.087.616-.538.466-.717 1.22-.717 1.22s.18.754.717 1.22c.599.519 1.352.635 2.087.616.12.016.242.016.362.016.155.06.336.094.528.094.63 0 1.265-.558 1.365-1.24.066-.451-.001-.948-.001-1.412zm-5.539 4.653a1.2 1.2 0 01-1.678 0 1.2 1.2 0 010-1.678 1.2 1.2 0 011.678 0 1.2 1.2 0 010 1.678zm0-3.653a1.2 1.2 0 01-1.678 0 1.2 1.2 0 010-1.678 1.2 1.2 0 011.678 0 1.2 1.2 0 010 1.678z"/>
              </svg>
              <span className="text-xs text-[#333037] group-hover:text-[#665CAC] transition-colors">Viber</span>
            </a>

            {/* WhatsApp */}
            <a
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-8 h-8 text-[#25D366] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.484 3.488"/>
              </svg>
              <span className="text-xs text-[#333037] group-hover:text-[#25D366] transition-colors">WhatsApp</span>
            </a>

            {/* Facebook */}
            <a
              href={shareUrls.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center p-3 rounded-lg hover:bg-gray-50 transition-colors group"
            >
              <svg className="w-8 h-8 text-[#1877F2] mb-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="text-xs text-[#333037] group-hover:text-[#1877F2] transition-colors">Facebook</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}