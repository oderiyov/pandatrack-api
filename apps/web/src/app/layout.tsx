import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'PandaTrack - відстежити посилку з будь-якого перевізника | Україна',
    template: '%s | PandaTrack'
  },
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, USPS, China Post та 50+ інших перевізників. Швидко, точно, безкоштовно.',
  keywords: [
    'відстежити посилку',
    'трекінг посилок',
    'нова пошта відстеження', 
    'укрпошта трекінг',
    'dhl tracking',
    'відстеження замовлень',
    'посилка з китаю',
    'aliexpress tracking',
    'tracking ukraine',
    'пандатрек'
  ],
  authors: [{ name: 'PandaTrack Team' }],
  creator: 'PandaTrack',
  publisher: 'PandaTrack',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  robots: {
    index: false,        // ЗАБОРОНИТИ індексацію
    follow: false,       // ЗАБОРОНИТИ переходи по лінках
    noarchive: true,     // ЗАБОРОНИТИ кешування
    nosnippet: true,     // ЗАБОРОНИТИ сніпети
    googleBot: {
      index: false,
      follow: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://pandatrack.com.ua',
    siteName: 'PandaTrack',
    title: 'PandaTrack - відстежити посилку з будь-якого перевізника',
    description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, USPS, China Post та 50+ інших перевізників. Швидко, точно, безкоштовно.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PandaTrack - відстежити посилку',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PandaTrack - відстежити посилку з будь-якого перевізника',
    description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL та 50+ інших перевізників',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://pandatrack.com.ua',
    languages: {
      'uk-UA': 'https://pandatrack.com.ua',
      'x-default': 'https://pandatrack.com.ua',
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk-UA">
      <head>
        {/* Structured Data - Website Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "PandaTrack",
              "url": "https://pandatrack.com.ua",
              "description": "Відстеження посилок з будь-якого перевізника",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://pandatrack.com.ua/track/{search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "PandaTrack",
                "url": "https://pandatrack.com.ua",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://pandatrack.com.ua/logo.png",
                  "width": 512,
                  "height": 512
                }
              }
            })
          }}
        />
        
        {/* Organization Schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "PandaTrack",
              "url": "https://pandatrack.com.ua",
              "logo": "https://pandatrack.com.ua/logo.png",
              "description": "Український сервіс відстеження посилок з будь-якого перевізника",
              "foundingDate": "2025",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "UA",
                "addressRegion": "Київська область",
                "addressLocality": "Київ"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "customer service",
                "email": "support@pandatrack.com.ua",
                "availableLanguage": ["Ukrainian", "English"]
              }
            })
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}