import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'PandaTrack - Відстеження посилок в Україні',
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, Meest Express та інших служб доставки',
  keywords: 'відстеження посилок, нова пошта, укрпошта, meest, dhl, україна',
  openGraph: {
    title: 'PandaTrack - Відстеження посилок в Україні',
    description: 'Відстежуйте посилки з усіх популярних служб доставки в одному місці',
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
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}