// src/app/page.tsx - ОНОВЛЕНА ГОЛОВНА СТОРІНКА
import { Metadata } from 'next'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { PopularCarriers } from '@/components/popular-carriers'
import { PopularStores } from '@/components/popular-stores'
import { Features } from '@/components/features'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import ArtalkComments from '@/components/artalk-comments'

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
            <h3 className="text-xl font-bold mb-4">Допомога з відстеженням посилок</h3>
            <p className="text-[#333037]/80 mb-4">
              Маєте питання про відстеження? Не можете знайти свою посилку? Потрібна допомога з трек-номером? 
              Запитайте в коментарях нижче — спільнота користувачів завжди готова допомогти!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">💡 Поради користувачів</h4>
                <p className="text-[#333037]/70">Досвідчені користувачі діляться секретами швидкого трекінгу</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">🔍 Пошук посилок</h4>
                <p className="text-[#333037]/70">Допомога у визначенні перевізника за номером</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">📞 Контакти служб</h4>
                <p className="text-[#333037]/70">Актуальні телефони підтримки перевізників</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Community Comments Section - ОСНОВНА ФІШКА */}
      <section className="bg-white py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">Спільнота відстеження посилок</h2>
              <p className="text-lg text-[#333037]/70 leading-relaxed">
                Найактивніша спільнота в Україні для обговорення питань доставки. 
                Задавайте питання, діліться досвідом та отримуйте допомогу від тисяч користувачів.
              </p>
            </div>

            {/* Статистика спільноти */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">15K+</div>
                <div className="text-sm text-blue-800">Користувачів</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">89K+</div>
                <div className="text-sm text-green-800">Коментарів</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">2.3K+</div>
                <div className="text-sm text-yellow-800">Питань вирішено</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">24/7</div>
                <div className="text-sm text-purple-800">Підтримка</div>
              </div>
            </div>

            {/* Artalk Comments з інформаційним блоком */}
            <ArtalkComments
              pageKey="homepage-global-chat"
              pageTitle="Загальні питання про відстеження посилок"
              showInfoBlock={true}
            />
          </div>
        </div>
      </section>

      {/* Educational Content */}
      <section className="bg-[#f5f5f5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Довідкова інформація</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-3">Що таке номер відстеження?</h3>
                <p className="text-[#333037]/70 text-sm leading-relaxed mb-4">
                  Трек номер — це унікальний код посилки для відстеження між країнами. 
                  Міжнародні номери виглядають як RO123456789CN, де перші букви — тип відправлення, 
                  останні — код країни відправника.
                </p>
                <Link href="/guides/tracking-numbers" className="text-blue-600 text-sm hover:underline">
                  Детальніше про номери →
                </Link>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-3">Як відстежити посилку?</h3>
                <ol className="text-[#333037]/70 text-sm space-y-1 leading-relaxed mb-4">
                  <li>1. Знайдіть трек-номер в email або на сайті магазину</li>
                  <li>2. Введіть номер у поле пошуку вище</li>
                  <li>3. Отримайте актуальну інформацію про статус доставки</li>
                </ol>
                <Link href="/guides/how-to-track" className="text-blue-600 text-sm hover:underline">
                  Покроковий гід →
                </Link>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-bold mb-3">Проблеми з доставкою?</h3>
                <p className="text-[#333037]/70 text-sm leading-relaxed mb-4">
                  Посилка затримується? Неправильний статус? Проблеми з митницею? 
                  У нашій спільноті ви знайдете відповіді на всі питання про доставку.
                </p>
                <Link href="/guides/delivery-problems" className="text-blue-600 text-sm hover:underline">
                  Вирішення проблем →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}