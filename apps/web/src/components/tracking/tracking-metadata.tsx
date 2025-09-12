// components/tracking/tracking-metadata.tsx
'use client'

interface TrackingData {
  trackingNumber: string
  carrier: string
  status: string
  sourcesChecked: string[]
  daysInTransit?: number
  originCountry?: string
  destinationCountry?: string
  lastUpdated: string
}

interface TrackingMetadataProps {
  trackingData: TrackingData
}

export default function TrackingMetadata({ trackingData }: TrackingMetadataProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString('uk-UA', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return 'Невідомо'
    }
  }

  const getCarrierOfficialLinks = (carrier: string, trackingNumber: string) => {
    const carrierData: Record<string, { name: string; url: string; logo?: string }> = {
      'ukrposhta': {
        name: 'Укрпошта',
        url: `https://www.ukrposhta.ua/`,
        logo: '🏣'
      },
      'novaposhta': {
        name: 'Нова Пошта',
        url: `https://tracking.novaposhta.ua/#/uk`,
        logo: '📦'
      },
      'dhl': {
        name: 'DHL',
        url: `https://www.dhl.com/ua-en/home/tracking.html`,
        logo: '✈️'
      },
      'cainiao': {
        name: 'Cainiao',
        url: `https://global.cainiao.com/`,
        logo: '🐧'
      }
    }

    const carrierKey = carrier.toLowerCase().replace(/\s+/g, '')
    const key = carrierKey.includes('nova') ? 'novaposhta' :
               carrierKey.includes('ukr') ? 'ukrposhta' :
               carrierKey.includes('dhl') ? 'dhl' :
               carrierKey.includes('cainiao') ? 'cainiao' : null

    return key ? carrierData[key] : null
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="text-lg font-bold mb-4 text-[#333037]">Деталі посилки</h3>
      
      <div className="space-y-4">
        {/* Tracking Number */}
        <div className="flex justify-between items-start">
          <span className="text-[#333037]/60 text-sm">Трек-номер</span>
          <span className="font-mono text-sm font-medium text-[#333037] break-all">
            {trackingData.trackingNumber}
          </span>
        </div>

        {/* Origin */}
        {trackingData.originCountry && (
          <div className="flex justify-between items-start">
            <span className="text-[#333037]/60 text-sm">Країна відправлення</span>
            <span className="text-sm text-[#333037]">{trackingData.originCountry}</span>
          </div>
        )}

        {/* Destination */}
        {trackingData.destinationCountry && (
          <div className="flex justify-between items-start">
            <span className="text-[#333037]/60 text-sm">Країна отримання</span>
            <span className="text-sm text-[#333037]">{trackingData.destinationCountry}</span>
          </div>
        )}

        {/* Days in transit */}
        {trackingData.daysInTransit !== undefined && (
          <div className="flex justify-between items-start">
            <span className="text-[#333037]/60 text-sm">Днів в дорозі</span>
            <span className="text-sm font-medium text-[#333037]">
              {trackingData.daysInTransit}
            </span>
          </div>
        )}

        {/* Delivery Company */}
        <div className="flex justify-between items-start">
          <span className="text-[#333037]/60 text-sm">Перевізник</span>
          <span className="text-sm text-[#333037]">{trackingData.carrier}</span>
        </div>

        {/* Sources Checked */}
        <div>
          <span className="text-[#333037]/60 text-sm block mb-2">Перевірено в</span>
          <div className="flex flex-wrap gap-2">
            {trackingData.sourcesChecked.map((source, index) => (
              <span 
                key={index} 
                className="bg-[#f0e5d9] px-3 py-1 rounded-full text-xs font-medium text-[#333037]"
              >
                {source}
              </span>
            ))}
          </div>
        </div>

        {/* Last Updated */}
        <div className="flex justify-between items-start">
          <span className="text-[#333037]/60 text-sm">Останнє оновлення</span>
          <span className="text-xs text-[#333037]/70 text-right">
            {formatDate(trackingData.lastUpdated)}
          </span>
        </div>
      </div>

      {/* Official Carrier Links */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-[#333037] mb-3">Перевірити на офіційних сайтах</h4>
        <div className="space-y-2">
          {trackingData.sourcesChecked.map((carrier, index) => {
            const carrierInfo = getCarrierOfficialLinks(carrier, trackingData.trackingNumber)
            if (!carrierInfo) return null

            return (
              <a
                key={index}
                href={carrierInfo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <span className="text-lg">{carrierInfo.logo}</span>
                <span className="font-medium text-[#333037] group-hover:text-blue-600">
                  {carrierInfo.name}
                </span>
                <svg 
                  className="w-4 h-4 text-[#333037]/40 group-hover:text-blue-600 ml-auto" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )
          })}
        </div>
      </div>
    </div>
  )
}