// src/app/layout.tsx - БЕЗ CDN, використовуємо npm пакет
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: 'PandaTrack - Відстеження посилок по Україні',
    template: '%s | PandaTrack'
  },
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, AliExpress, Amazon та інших перевізників. Швидко, точно, безкоштовно.',
  keywords: 'відстеження посилок, нова пошта, укрпошта, dhl, aliexpress, tracking, україна',
  authors: [{ name: 'PandaTrack Team' }],
  creator: 'PandaTrack',
  publisher: 'PandaTrack',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  
  // Mobile-specific metadata
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover',
  
  // Theme colors
  themeColor: '#f0e5d9',
  
  // PWA manifest
  manifest: '/manifest.json',
  
  // Open Graph for social sharing
  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://pandatrack.com.ua',
    title: 'PandaTrack - Відстеження посилок по Україні',
    description: 'Відстежуйте посилки з будь-якого перевізника в одному місці',
    siteName: 'PandaTrack',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PandaTrack - Відстеження посилок',
      }
    ]
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'PandaTrack - Відстеження посилок',
    description: 'Відстежуйте посилки з будь-якого перевізника',
    images: ['/og-image.png'],
  },
  
  // Robots and indexing
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://api.pandatrack.com.ua" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch */}
        <link rel="dns-prefetch" href="//api.pandatrack.com.ua" />
        
        {/* Favicon and app icons */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        
        {/* iOS-specific meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PandaTrack" />
        
        {/* Disable automatic link detection */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        
        {/* ВИДАЛЕНО CDN залежності - використовуємо npm пакет artalk */}
      </head>
      <body className="antialiased bg-[#f5f5f5] text-[#333037]">
        {children}
        
        {/* ВИДАЛЕНО Artalk CDN скрипт - використовуємо динамічний імпорт */}
      </body>
    </html>
  )
}