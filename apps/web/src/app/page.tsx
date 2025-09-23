// src/app/page.tsx - ВИПРАВЛЕНА ГОЛОВНА СТОРІНКА з об'єднаним контентом
import { Metadata } from 'next'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { PopularCarriers } from '@/components/popular-carriers'
import { PopularStores } from '@/components/popular-stores'
import { Features } from '@/components/features'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

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
        
        {/* ВИПРАВЛЕНО: Об'єднаний інформаційний блок */}
        <section className="mt-16">
          <div className="bg-[#eaf0f5] rounded-[20px] p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Що робити, якщо посилка не відстежується?</h2>
            <p className="text-[#333037]/80 leading-relaxed">
              Відразу після отримання трек-номера, якщо доставляє не експрес-служба, відстежити посилку не вдасться. 
              Особливо це актуально для інтернет-магазинів. Вантаж спочатку реєструється в транспортній компанії, 
              упаковується і відправляється в пункт сортування (на всі підготовчі процедури йде від 2 до 7 днів).
            </p>
          </div>
          
          {/* ВИПРАВЛЕНО: Об'єднаний блок з допомогою - заголовок по центру */}
          <div className="bg-[#f5f5f5] rounded-[20px] p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-[#333037]">
                Допомога з відстеженням посилок
              </h2>
            </div>
            
            <div className="text-center mb-6">
              <p className="text-[#333037]/80 leading-relaxed max-w-3xl mx-auto">
                Маєте питання про відстеження? Не можете знайти свою посилку? Потрібна допомога з трек-номером? 
                Запитайте в коментарях нижче — спільнота користувачів завжди готова допомогти! 
                Досвідчені користувачі діляться секретами швидкого трекінгу та допомагають у визначенні перевізника за номером.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="bg-white/50 rounded-lg p-4 text-center">
                <h4 className="font-semibold mb-2">💡 Поради користувачів</h4>
                <p className="text-[#333037]/70">Секрети швидкого трекінгу та лайфхаки для відстеження</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4 text-center">
                <h4 className="font-semibold mb-2">🔍 Визначення перевізника</h4>
                <p className="text-[#333037]/70">Допомога у розпізнаванні служби доставки за форматом номера</p>
              </div>
              <div className="bg-white/50 rounded-lg p-4 text-center">
                <h4 className="font-semibold mb-2">📞 Контакти служб</h4>
                <p className="text-[#333037]/70">Актуальні телефони та email підтримки перевізників</p>
              </div>
            </div>

            {/* Важлива інформація */}
            <div className="mt-6 pt-6 border-t border-[#333037]/20">
              <div className="bg-white/60 rounded-lg p-4">
                <p className="text-[#333037]/70 text-sm leading-relaxed text-center">
                  <span className="font-medium">⚠️ Важливо:</span> У коментарях відповідають звичайні користувачі, а не працівники поштових служб чи сайту. 
                  Для офіційної підтримки звертайтеся напряму до служби доставки. 
                  <span className="block mt-2">
                    Наші контакти: <a href="mailto:help@pandatrack.com.ua" className="text-blue-600 hover:underline">help@pandatrack.com.ua</a>
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Comments Section - БЕЗ СТАТИСТИКИ ДЛЯ ЧИСТОТИ */}
      <section className="bg-[#f5f5f5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Питання та досвід з відстеження посилок</h2>
            </div>
            <PandaTrackComments
              pageId="homepage"
              title=""
              showStats={false}
              showInfo={false}
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