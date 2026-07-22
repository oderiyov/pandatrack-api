// src/app/layout.tsx - Next 15: viewport окремим export, metadataBase для canonical/OG
import type { Metadata, Viewport } from 'next'
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

// ✅ Next 15: viewport і themeColor — окремий export (прибирає білд-warnings)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#f0e5d9',
}

export const metadata: Metadata = {
  // ✅ Базовий URL — без нього canonical і OG-картинки резолвляться некоректно
  metadataBase: new URL('https://pandatrack.com.ua'),

  title: {
    default: 'PandaTrack — Відстеження посилок по Україні',
    template: '%s | PandaTrack'
  },
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, Meest, AliExpress та інших перевізників в одному місці. Швидко, точно, безкоштовно.',
  keywords: ['відстеження посилок', 'нова пошта', 'укрпошта', 'dhl', 'meest', 'aliexpress', 'трекінг', 'відстежити посилку', 'україна'],
  authors: [{ name: 'PandaTrack' }],
  creator: 'PandaTrack',
  publisher: 'PandaTrack',

  // ✅ Canonical головної (кожна сторінка перевизначить свій)
  alternates: {
    canonical: '/',
  },

  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  manifest: '/manifest.json',

  openGraph: {
    type: 'website',
    locale: 'uk_UA',
    url: 'https://pandatrack.com.ua',
    title: 'PandaTrack — Відстеження посилок по Україні',
    description: 'Відстежуйте посилки з будь-якого перевізника в одному місці',
    siteName: 'PandaTrack',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PandaTrack — Відстеження посилок',
      }
    ]
  },

  twitter: {
    card: 'summary_large_image',
    title: 'PandaTrack — Відстеження посилок',
    description: 'Відстежуйте посилки з будь-якого перевізника',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <link rel="preconnect" href="https://api.pandatrack.com.ua" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//api.pandatrack.com.ua" />

        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="PandaTrack" />
      </head>
      <body className="antialiased bg-[#f5f5f5] text-[#333037]">
        {children}
      </body>
    </html>
  )
}