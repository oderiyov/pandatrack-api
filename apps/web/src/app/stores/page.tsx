// src/app/stores/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'

export const metadata: Metadata = {
  title: "Відстеження посилок з інтернет-магазинів | PandaTrack",
  description: "Відстежуйте замовлення з популярних інтернет-магазинів світу. AliExpress, Amazon, eBay та інші - швидке відстеження за трек-номером.",
  keywords: "відстеження посилок, інтернет магазини, aliexpress відстеження, amazon tracking, ebay",
  openGraph: {
    title: "Відстеження посилок з інтернет-магазинів | PandaTrack",
    description: "Відстежуйте замовлення з популярних інтернет-магазинів світу",
    type: "website",
    locale: "uk_UA",
  }
}

const stores = [
  {
    id: 'aliexpress',
    name: 'AliExpress',
    subtitle: '(Аліекспрес)',
    description: 'Міжнародний маркетплейс з мільйонами товарів з Китаю за низькими цінами',
    logo: '/logos/stores/aliexpress.svg',
    url: '/stores/aliexpress',
    features: ['Безкоштовна доставка', 'Захист покупця', 'Великий асортимент'],
    popularity: 'Найпопулярніший'
  }
]

function StoreCard({ store }: { store: typeof stores[0] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
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
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-bold text-[#333037]">
                {store.name} {store.subtitle}
              </h3>
              {store.popularity && (
                <span className="inline-block bg-orange-100 text-orange-600 px-2 py-1 rounded-md text-xs font-medium mt-1">
                  {store.popularity}
                </span>
              )}
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
          
          <div className="flex space-x-3">
            <Link
              href={store.url}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
            >
              Відстеження
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#f0e5d9] py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#333037]">
              Відстеження посилок з магазинів
            </h1>
            <p className="text-lg text-[#333037]/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              Відстежуйте замовлення з популярних інтернет-магазинів світу. 
              Введіть трек-номер та отримайте актуальну інформацію про статус доставки.
            </p>
            
            <TrackingForm 
              placeholder="Введіть трек-номер замовлення з магазину"
            />
            
            <p className="text-sm mt-4 text-[#333037]/60">
              Підтримуємо відстеження з усіх популярних інтернет-магазинів
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Popular Stores */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            Популярні інтернет-магазини
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard key={store.id} store={store} />
            ))}
          </div>
        </section>

        {/* Shopping Tips */}
        <section className="mb-16">
          <div className="bg-[#eaf0f5] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Поради для безпечного онлайн-шопінгу
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Перед покупкою:</h3>
                <ul className="space-y-2 text-[#333037]/80">
                  <li>• Перевіряйте рейтинг продавця та відгуки покупців</li>
                  <li>• Читайте опис товару та технічні характеристики</li>
                  <li>• Порівнюйте ціни в різних магазинах</li>
                  <li>• Уточнюйте умови доставки та повернення</li>
                  <li>• Використовуйте промокоди для економії</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Після замовлення:</h3>
                <ul className="space-y-2 text-[#333037]/80">
                  <li>• Збережіть трек-номер для відстеження</li>
                  <li>• Регулярно перевіряйте статус доставки</li>
                  <li>• Підготуйте документи для отримання</li>
                  <li>• Перевірте товар при отриманні</li>
                  <li>• Залиште відгук про покупку</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Why Track Orders */}
        <section>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Чому важливо відстежувати замовлення?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📦</span>
                </div>
                <h3 className="font-semibold mb-2">Контроль доставки</h3>
                <p className="text-[#333037]/70 text-sm">
                  Знайте точно, де знаходиться ваша посилка в будь-який момент
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⏰</span>
                </div>
                <h3 className="font-semibold mb-2">Планування часу</h3>
                <p className="text-[#333037]/70 text-sm">
                  Плануйте свій час для отримання посилки заздалегідь
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🛡️</span>
                </div>
                <h3 className="font-semibold mb-2">Безпека покупки</h3>
                <p className="text-[#333037]/70 text-sm">
                  Швидко виявляйте проблеми з доставкою та вирішуйте їх
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}