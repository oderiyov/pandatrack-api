// lib/tracking-seo.ts
interface TrackingData {
  trackingNumber: string
  status: string
  sourcesChecked: string[]
  carrier: string
}

export function generateTrackingMetadata(trackingData: TrackingData | null) {
  if (!trackingData) {
    return {
      title: 'Посилка не знайдена | PandaTrack',
      description: 'Трек-номер не знайдено в жодній системі відстеження',
      robots: 'noindex, nofollow'
    }
  }

  const { trackingNumber, status, sourcesChecked, carrier } = trackingData
  const carriersText = sourcesChecked.length > 0 ? sourcesChecked.join(', ') : carrier

  // Create SEO-friendly status
  const seoStatus = status.includes('доставлен') || status.includes('вручено') 
    ? 'доставлено' 
    : status.includes('дорозі') || status.includes('транзит')
    ? 'в дорозі'
    : 'відстежується'

  return {
    title: `${trackingNumber} - ${seoStatus} | PandaTrack`,
    description: `Відстеження посилки ${trackingNumber}. Статус: ${status}. Перевірено в: ${carriersText}. Актуальна інформація про доставку в Україну.`,
    robots: 'noindex, follow', // Allow link following but don't index results
    openGraph: {
      title: `Посилка ${trackingNumber} - ${seoStatus}`,
      description: `Статус відстеження: ${status}. Перевізники: ${carriersText}`,
      url: `https://pandatrack.com.ua/track/${trackingNumber}`,
      type: 'website',
      images: [
        {
          url: 'https://pandatrack.com.ua/og-tracking.png', // Create this image
          width: 1200,
          height: 630,
          alt: `Відстеження посилки ${trackingNumber}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: `Посилка ${trackingNumber} - ${seoStatus}`,
      description: `${status} через ${carriersText}`,
      images: ['https://pandatrack.com.ua/og-tracking.png']
    },
    alternates: {
      canonical: `https://pandatrack.com.ua/track/${trackingNumber}`
    }
  }
}