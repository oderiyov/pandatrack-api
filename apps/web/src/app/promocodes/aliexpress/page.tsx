// src/app/promocodes/aliexpress/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'

export const metadata: Metadata = {
  title: "Промокоди AliExpress Україна 2025 - знижки до 90% | PandaTrack",
  description: "Актуальні промокоди AliExpress для України. Зекономте до 90% на покупках з Китаю. Безкоштовна доставка, купони на першу покупку та щоденні акції.",
  keywords: "промокоди aliexpress, знижки аліекспрес, купони aliexpress україна, безкоштовна доставка",
  openGraph: {
    title: "Промокоди AliExpress - знижки до 90% | PandaTrack",
    description: "Найкращі промокоди та знижки AliExpress для покупців з України",
    type: "website",
    locale: "uk_UA",
  }
}

const promoCodes = [
  {
    id: 1,
    title: "Знижка $3 від $25",
    code: "SAVE3NOW",
    description: "Знижка $3 при мінімальному замовленні від $25",
    discount: "$3",
    minOrder: "$25",
    validUntil: "31.12.2025",
    isActive: true
  },
  {
    id: 2,
    title: "Знижка $7 від $50", 
    code: "MEGA7OFF",
    description: "Отримайте знижку $7 при покупці на суму від $50",
    discount: "$7",
    minOrder: "$50", 
    validUntil: "31.12.2025",
    isActive: true
  },
  {
    id: 3,
    title: "Знижка $15 від $100",
    code: "SUPER15",
    description: "Максимальна знижка $15 для замовлень від $100",
    discount: "$15",
    minOrder: "$100",
    validUntil: "31.12.2025", 
    isActive: true
  },
  {
    id: 4,
    title: "Знижка $30 від $200",
    code: "ULTRA30",
    description: "Ексклюзивна знижка $30 для великих замовлень від $200",
    discount: "$30",
    minOrder: "$200",
    validUntil: "31.12.2025",
    isActive: true
  }
]

const popularProducts = [
  {
    id: 1,
    name: "Бездротові навушники TWS",
    price: "425",
    oldPrice: "850",
    image: "/products/headphones.jpg",
    discount: "50%",
    url: "https://aliexpress.com"
  },
  {
    id: 2, 
    name: "Power Bank 20000mAh",
    price: "650",
    oldPrice: "1200", 
    image: "/products/powerbank.jpg",
    discount: "46%",
    url: "https://aliexpress.com"
  },
  {
    id: 3,
    name: "Смарт-годинник T500+",
    price: "890",
    oldPrice: "1780",
    image: "/products/smartwatch.jpg", 
    discount: "50%",
    url: "https://aliexpress.com"
  },
  {
    id: 4,
    name: "LED підсвітка RGB 5м",
    price: "320",
    oldPrice: "640",
    image: "/products/ledstrip.jpg",
    discount: "50%", 
    url: "https://aliexpress.com"
  }
]

// Server Component without interactivity
function PromoCodeCard({ promo }: { promo: typeof promoCodes[0] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#333037] mb-2">{promo.title}</h3>
          <p className="text-[#333037]/70 text-sm mb-3">{promo.description}</p>
          <div className="flex space-x-4 text-sm">
            <span className="text-green-600 font-semibold">Знижка: {promo.discount}</span>
            <span className="text-blue-600">Мін. сума: {promo.minOrder}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="bg-red-50 text-red-600 px-3 py-1 rounded-md text-sm font-semibold mb-2">
            {promo.discount}
          </div>
          {promo.isActive && (
            <span className="text-green-500 text-xs">Активний</span>
          )}
        </div>
      </div>
      
      <div className="bg-[#f0e5d9] rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <code className="font-mono text-lg font-bold text-[#333037]">{promo.code}</code>
          <div className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm">
            Код: {promo.code}
          </div>
        </div>
        <div className="text-xs text-[#333037]/60 mt-2">
          Скопіюйте код вручну для використання
        </div>
      </div>
      
      <div className="text-[#333037]/60 text-xs">
        Діє до: {promo.validUntil}
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: typeof popularProducts[0] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="relative mb-4">
        <div className="bg-gray-200 rounded-lg h-48 flex items-center justify-center">
          <span className="text-gray-500">Зображення товару</span>
        </div>
        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-xs font-bold">
          -{product.discount}
        </div>
      </div>
      
      <h3 className="font-semibold text-[#333037] mb-2 text-sm">{product.name}</h3>
      
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg font-bold text-[#333037]">{product.price} грн</span>
        <span className="text-sm text-gray-500 line-through">{product.oldPrice} грн</span>
      </div>
      
      <Link
        href={product.url}
        target="_blank"
        className="block w-full bg-orange-500 text-white text-center py-2 rounded-md text-sm font-semibold hover:bg-orange-600 transition-colors"
      >
        Купити на AliExpress
      </Link>
    </div>
  )
}

export default function AliExpressPromocodesPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#f0e5d9] py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-6 mb-8">
              <div className="flex-shrink-0">
                <Image
                  src="/logos/stores/aliexpress.svg"
                  alt="AliExpress логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl md:text-4xl font-bold text-[#333037] mb-2">
                  Промокоди AliExpress
                </h1>
                <p className="text-lg text-[#333037]/70 mb-4">
                  Актуальні промокоди та знижки для покупок на AliExpress
                </p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Знижки до 90% • Безкоштовна доставка • <a href="https://aliexpress.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">aliexpress.com</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть трек-номер замовлення з AliExpress"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Відстежте замовлення після покупки з промокодом</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* About AliExpress */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Актуальні промокоди AliExpress
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              AliExpress — це міжнародний онлайн-маркетплейс, де представлено понад 100 мільйонів товарів 
              від китайських та міжнародних продавців. Платформа пропонує широкий асортимент продукції: 
              від електроніки та одягу до товарів для дому та автомобільних аксесуарів за найнижчими цінами.
            </p>
            <p className="text-[#333037]/80 leading-relaxed">
              Магазин регулярно проводить масштабні розпродажі зі знижками до 90%, а використання промокодів 
              дозволяє отримати додаткову економію. Особливо вигідні пропозиції під час святкових акцій: 
              11.11, Чорна П&apos;ятниця, Новий рік та річниця AliExpress.
            </p>
          </div>
        </section>

        {/* Promo Codes */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            Діючі промокоди AliExpress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promoCodes.map((promo) => (
              <PromoCodeCard key={promo.id} promo={promo} />
            ))}
          </div>
        </section>

        {/* Popular Products */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            Топ товарів з AliExpress
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* How to Use */}
        <section className="mb-16">
          <div className="bg-[#eaf0f5] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Як використовувати промокод на AliExpress?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Покрокова інструкція:</h3>
                <ol className="space-y-3 text-[#333037]/80">
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span>Скопіюйте промокод з нашого сайту</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span>Перейдіть на AliExpress та додайте потрібні товари до кошика</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span>В кошику знайдіть поле &quot;Store coupons & AliExpress coupons&quot;</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                    <span>Вставте промокод та натисніть &quot;Apply&quot; для застосування знижки</span>
                  </li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Важливі поради:</h3>
                <ul className="space-y-2 text-[#333037]/80">
                  <li>• Перевіряйте мінімальну суму замовлення для промокоду</li>
                  <li>• Один промокод можна використати тільки один раз</li>
                  <li>• Промокоди не поєднуються з іншими знижками магазину</li>
                  <li>• Термін дії промокодів обмежений</li>
                  <li>• Деякі товари можуть бути виключені з акції</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Sales and Discounts */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Розпродажі та акції AliExpress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6">
                <h3 className="font-bold text-red-700 mb-3">11.11 - День холостяків</h3>
                <p className="text-red-600 text-sm mb-4">Найбільший розпродаж року зі знижками до 90%</p>
                <div className="text-2xl font-bold text-red-700">11 листопада</div>
              </div>
              
              <div className="bg-gradient-to-br from-black to-gray-800 text-white rounded-lg p-6">
                <h3 className="font-bold mb-3">Black Friday</h3>
                <p className="text-gray-300 text-sm mb-4">Чорна п&apos;ятниця з ексклюзивними пропозиціями</p>
                <div className="text-2xl font-bold">29 листопада</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
                <h3 className="font-bold text-blue-700 mb-3">Річниця AliExpress</h3>
                <p className="text-blue-600 text-sm mb-4">Святкування дня народження платформи</p>
                <div className="text-2xl font-bold text-blue-700">28 березня</div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <div className="bg-[#f0e5d9] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Часті питання про AliExpress
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Скільки можна зекономити на акціях AliExpress?</h3>
                <p className="text-[#333037]/80 text-sm">
                  На великих розпродажах можна зекономити до 90% від початкової ціни. Використовуючи промокоди 
                  додатково, загальна економія може сягати 95% на окремі товари.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Чи є безкоштовна доставка на AliExpress?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Так, багато продавців пропонують безкоштовну доставку в Україну. Інформація про доставку 
                  вказується на сторінці товару. Термін доставки зазвичай становить 15-45 днів.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Як відстежити замовлення з AliExpress?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Після оформлення замовлення ви отримаєте трек-номер. Введіть його в форму на нашому сайті 
                  для відстеження. Також можна відстежувати через особистий кабінет AliExpress або 
                  сайти служб доставки <Link href="/couriers/nova-poshta" className="text-blue-600 hover:underline">Нова Пошта</Link>, 
                  <Link href="/couriers/ukrposhta" className="text-blue-600 hover:underline"> Укрпошта</Link>.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Чи можна повернути товар на AliExpress?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Так, AliExpress має програму захисту покупців. Якщо товар не відповідає опису або не прибув, 
                  ви можете відкрити спір і повернути гроші протягом 60-90 днів після замовлення.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Info */}
        <section>
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Доставка AliExpress в Україну
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Способи доставки:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <div className="font-medium">AliExpress Standard Shipping</div>
                      <div className="text-sm text-[#333037]/70">15-25 днів, безкоштовно для більшості товарів</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <div className="font-medium">AliExpress Premium Shipping</div>
                      <div className="text-sm text-[#333037]/70">7-15 днів, прискорена доставка</div>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <div>
                      <div className="font-medium">Cainiao Super Economy</div>
                      <div className="text-sm text-[#333037]/70">20-39 днів, найдешевший варіант</div>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-4 text-[#333037]">Отримання в Україні:</h3>
                <ul className="space-y-2 text-[#333037]/80">
                  <li>• Нова Пошта - найпопулярніший варіант</li>
                  <li>• Укрпошта - державна служба доставки</li>
                  <li>• Meest Express - для великих посилок</li>
                  <li>• Самовивіз з поштових відділень</li>
                  <li>• Доставка кур&apos;єром додому</li>
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