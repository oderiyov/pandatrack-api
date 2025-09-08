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
  title: 'PandaTrack - відстежити посилку з будь-якого перевізника | Україна',
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, USPS, China Post та 50+ інших перевізників. Швидко, точно, безкоштовно.',
  keywords: 'відстежити посилку, tracking, нова пошта, укрпошта, dhl, china post, aliexpress',
  openGraph: {
    title: 'PandaTrack - Відстеження посилок в Україні',
    description: 'Відстежуйте посилки з усіх популярних служб доставки в одному місці. Швидко, точно, безкоштовно.',
    type: 'website',
    locale: 'uk_UA'
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uk">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}