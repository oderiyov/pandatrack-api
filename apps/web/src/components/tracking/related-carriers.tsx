// components/tracking/related-carriers.tsx
'use client'

import Link from 'next/link'

interface RelatedCarriersProps {
  currentCarriers: string[]
}

export default function RelatedCarriers({ currentCarriers }: RelatedCarriersProps) {
  // Define all available carriers with metadata
  const allCarriers = [
    {
      slug: 'nova-poshta',
      name: 'Нова Пошта',
      description: 'Швидка доставка по Україні',
      logo: '📦',
      category: 'ukrainian'
    },
    {
      slug: 'ukrposhta',
      name: 'Укрпошта',
      description: 'Національний поштовий оператор',
      logo: '🏣',
      category: 'ukrainian'
    },
    {
      slug: 'dhl',
      name: 'DHL Express',
      description: 'Міжнародна експрес доставка',
      logo: '✈️',
      category: 'international'
    },
    {
      slug: 'usps',
      name: 'USPS',
      description: 'Пошта США',
      logo: '🇺🇸',
      category: 'international'
    },
    {
      slug: 'china-post',
      name: 'China Post',
      description: 'Пошта Китаю',
      logo: '🇨🇳',
      category: 'international'
    },
    {
      slug: 'royal-mail',
      name: 'Royal Mail',
      description: 'Пошта Великобританії',
      logo: '🇬🇧',
      category: 'international'
    },
    {
      slug: 'meest',
      name: 'Міст Експрес',
      description: 'Міжнародні посилки та перекази',
      logo: '🌍',
      category: 'ukrainian'
    },
    {
      slug: 'sat',
      name: 'САТ',
      description: 'Швидка доставка по Україні',
      logo: '🚚',
      category: 'ukrainian'
    }
  ]

  // Filter out current carriers and select related ones
  const getRelatedCarriers = () => {
    type CarrierSlug = 'nova-poshta' | 'ukrposhta' | 'dhl' | 'china-post' | 'usps' | 'royal-mail' | 'meest' | 'sat'
    
    const currentCarrierSlugs: CarrierSlug[] = currentCarriers.map(carrier => {
      const normalized = carrier.toLowerCase().replace(/\s+/g, '')
      if (normalized.includes('nova')) return 'nova-poshta'
      if (normalized.includes('ukr')) return 'ukrposhta'
      if (normalized.includes('dhl')) return 'dhl'
      if (normalized.includes('china')) return 'china-post'
      if (normalized.includes('usps')) return 'usps'
      if (normalized.includes('royal')) return 'royal-mail'
      if (normalized.includes('meest')) return 'meest'
      if (normalized.includes('sat')) return 'sat'
      return null
    }).filter((slug): slug is CarrierSlug => slug !== null)

    // Get carriers not currently used
    const available = allCarriers.filter(carrier => 
      !currentCarrierSlugs.includes(carrier.slug as CarrierSlug)
    )

    // Prioritize same category carriers
    const currentCategories = allCarriers
      .filter(carrier => currentCarrierSlugs.includes(carrier.slug as CarrierSlug))
      .map(carrier => carrier.category)

    const sameCategory = available.filter(carrier => 
      currentCategories.includes(carrier.category)
    )

    const otherCategory = available.filter(carrier => 
      !currentCategories.includes(carrier.category)
    )

    // Return up to 6 carriers: same category first, then others
    return [...sameCategory, ...otherCategory].slice(0, 6)
  }

  const relatedCarriers = getRelatedCarriers()

  if (relatedCarriers.length === 0) {
    return null
  }

  return (
    <section className="bg-gray-50 rounded-lg p-6 mt-8">
      <h2 className="text-xl font-bold mb-6 text-[#333037]">Інші популярні перевізники</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {relatedCarriers.map((carrier) => (
          <Link
            key={carrier.slug}
            href={`/couriers/${carrier.slug}`}
            className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-start space-x-3">
              <span className="text-2xl">{carrier.logo}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#333037] group-hover:text-blue-600 transition-colors">
                  {carrier.name}
                </h3>
                <p className="text-sm text-[#333037]/70 mt-1">
                  {carrier.description}
                </p>
                <div className="mt-2">
                  <span className="text-xs text-blue-600 group-hover:underline">
                    Дізнатися більше →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* View all carriers link */}
      <div className="mt-6 text-center">
        <Link 
          href="/couriers" 
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
        >
          <span>Переглянути всіх перевізників</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  )
}