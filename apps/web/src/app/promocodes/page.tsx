// src/app/promocodes/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'

export const metadata: Metadata = {
  title: "Промокоди та знижки від українських інтернет-магазинів | PandaTrack",
  description: "Найкращі промокоди, знижки та акції від популярних інтернет-магазинів України. Економте при покупках в AliExpress, Rozetka, Makeup та інших магазинах.",
  keywords: "промокоди, знижки, акції, інтернет-магазини, україна, aliexpress, rozetka, makeup",
  openGraph: {
    title: "Промокоди та знижки від українських інтернет-магазинів | PandaTrack",
    description: "Найкращі промокоди та знижки від популярних інтернет-магазинів України",
    type: "website",
    locale: "uk_UA",
  }
}

const stores = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    description: 'Міжнародний маркетплейс з величезним асортиментом товарів з Китаю за низькими цінами',
    logo: '/logos/stores/aliexpress.svg',
    url: '/promocodes/aliexpress',
    discount: 'До 70%',
    promoCount: '25+',
    features: ['Безкоштовна доставка', 'Кешбек до 10%', 'Щоденні акції']
  }
]

function StoreCard({ store }: { store: typeof stores[0] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <Image
            src={store.logo}
            alt={`${store.name} логотип`}
            width={48}
            height={48}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-xl font-bold text-[#333037]">{store.name}</h3>
            <div className="text-right">
              <div className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md">
                {store.discount}
              </div>
              <div className="text-xs text-[#333037]/60 mt-1">
                {store.promoCount} промокодів
              </div>
            </div>
          </div>
          
          <p className="text-[#333037]/70 text-sm leading-relaxed mb-4">
            {store.description}
          </p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {store.features.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-[#f0e5d9] text-[#333037] text-xs rounded-md"
              >
                {feature}
              </span>
            ))}
          </div>
          
          <Link
            href={store.url}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Дивитися промокоди
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PromocodesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#f0e5d9] py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#333037]">
              Промокоди та знижки
            </h1>
            <p className="text-lg text-[#333037]/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              Знайти найкращі пропозиції, знижки та акції в інтернет-магазинах України стало 
              набагато простіше завдяки промокодам. Ці унікальні коди дозволяють зекономити 
              гроші та отримати додаткові переваги при покупках онлайн.
            </p>
            
            <TrackingForm 
              placeholder="Введіть трек-номер для відстеження замовлення"
            />
            
            <p className="text-sm mt-4 text-[#333037]/60">
              Відстежте своє замовлення після покупки з промокодом
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Stores with Promocodes */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            Інтернет-магазини з промокодами
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>

        {/* How to Use */}
        <section className="mt-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Як використовувати промокоди?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Оберіть магазин</h3>
                <p className="text-[#333037]/70 text-sm">Знайдіть потрібний інтернет-магазин зі списку</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Скопіюйте код</h3>
                <p className="text-[#333037]/70 text-sm">Натисніть на промокод і скопіюйте його</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Зробіть покупку</h3>
                <p className="text-[#333037]/70 text-sm">Додайте товари в кошик і перейдіть до оплати</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold">4</span>
                </div>
                <h3 className="font-semibold mb-2">Застосуйте код</h3>
                <p className="text-[#333037]/70 text-sm">Вставте промокод у відповідне поле при оформленні</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section className="mt-16">
          <div className="bg-[#f0e5d9] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Поради для економії
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3 text-[#333037]">Слідкуйте за акціями</h3>
                <ul className="space-y-2 text-[#333037]/70 text-sm">
                  <li>• Підписуйтесь на розсилки магазинів</li>
                  <li>• Перевіряйте соціальні мережі брендів</li>
                  <li>• Чекайте на святкові розпродажі</li>
                  <li>• Користуйтесь кешбек-сервісами</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-[#333037]">Корисні лайфхаки</h3>
                <ul className="space-y-2 text-[#333037]/70 text-sm">
                  <li>• Порівнюйте ціни в різних магазинах</li>
                  <li>• Читайте умови використання промокодів</li>
                  <li>• Комбінуйте знижки з розпродажами</li>
                  <li>• Відстежуйте замовлення після покупки</li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}