// src/app/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { PopularCarriers } from '@/components/popular-carriers'
import { PopularStores } from '@/components/popular-stores'
import { Features } from '@/components/features'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'PandaTrack - відстежити посилку з будь-якого перевізника | Україна',
  description: 'Відстежуйте посилки з Нової Пошти, Укрпошти, DHL, USPS, China Post та 50+ інших перевізників. Швидко, точно, безкоштовно.',
  keywords: 'відстежити посилку, tracking, нова пошта, укрпошта, dhl, china post, aliexpress',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#f0e5d9] py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold mb-8 text-[#333037]">
              Відстеження посилок і замовлень онлайн за трек-номером
            </h1>
            
            <TrackingForm />
            
            <p className="text-sm mt-6 text-[#333037]/70 max-w-4xl mx-auto leading-relaxed">
              Найпростіший спосіб відстежити будь-яку посилку з цим глобальним сервісом відстеження, який дозволяє стежити за посилками з будь-якої пошти. Потужна універсальна система відстеження посилок надасть вам інформацію про відправлення за номером відстеження від поштового перевізника, такого як <Link href="/couriers/nova-poshta" className="text-blue-600 hover:underline">Нова Пошта</Link>, <Link href="/couriers/ukrposhta" className="text-blue-600 hover:underline">Укрпошта</Link>, <Link href="/couriers/dhl" className="text-blue-600 hover:underline">DHL</Link>, <Link href="/couriers/meest" className="text-blue-600 hover:underline">Міст Експрес</Link>, <Link href="/couriers/sat" className="text-blue-600 hover:underline">САТ</Link>, <Link href="/couriers/delivery-auto" className="text-blue-600 hover:underline">Делівері</Link> та багато інших!
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <PopularCarriers />
        <PopularStores />
        <Features />
        
        {/* Info Section */}
        <section className="mt-16">
          <div className="bg-[#eaf0f5] rounded-[20px] p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Що робити, якщо посилка не відстежується?</h2>
            <p className="text-[#333037]/80 leading-relaxed">
              Відразу після отримання трек-номера, якщо доставляє не експрес-служба, відстежити посилку не вдасться. 
              Особливо це актуально для інтернет-магазинів. Вантаж спочатку реєструється в транспортній компанії, 
              упаковується і відправляється в пункт сортування (на всі підготовчі процедури йде від 2 до 7 днів).
            </p>
          </div>
          
          <div className="bg-[#f7e2cc] rounded-[20px] p-8">
            <h3 className="text-xl font-bold mb-4">Пошук поштових відправлень</h3>
            <p className="text-[#333037]/80">
              В коментарях ти можеш запитати де посилка, написати про відстеження поштових відправлень або помилки при пошуку посилки.
            </p>
          </div>
        </section>
      </main>

      {/* Comments System - тимчасово відключено */}
      <section className="bg-[#f5f5f5] py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6 text-center">Знайти свою посилку</h2>
          <p className="text-center text-[#333037]/70 mb-8">
            Якщо маєш труднощі з трекінгом чи хочеш уточнити статус відправлення, напиши про це в коментарях — ми допоможемо розібратися  .
          </p>
          <div className="bg-white rounded-lg p-6 border border-gray-200 text-center">
            <p className="text-gray-500">Система коментарів незабаром буде доступна</p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}