// src/app/couriers/delivery-auto/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Delivery Auto відстеження посилок за номером | PandaTrack',
  description: 'Відстежити посилку Delivery Auto за номером накладної. Швидка доставка по всій Україні, надійна служба експрес-перевезень. Деліvері Авто tracking.',
  keywords: 'delivery auto відстеження, деліvері авто, delivery auto tracking, доставка авто, відстежити накладну',
  openGraph: {
    title: 'Delivery Auto відстеження посилок | PandaTrack',
    description: 'Відстежити посилку Delivery Auto за номером накладної. Швидка та надійна доставка по Україні.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function DeliveryAutoPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Carrier Info Block */}
      <section className="bg-[#f0e5d9] py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-start space-x-6 mb-8">
              <div className="flex-shrink-0">
                <Image
                  src="/logos/delivery-auto.svg"
                  alt="Delivery Auto логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">Delivery Auto</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Експрес-доставка по всій Україні</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0-800-750-999 • <a href="https://delivery-auto.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">delivery-auto.com</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть номер накладної (наприклад: 0580402558)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 0580402558, 1234567890, DA123456789</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Article Section */}
      <main className="bg-[#f5f5f5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Main Article Header */}
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#333037]">
              Відстеження посилок Delivery Auto
            </h1>

            {/* Company Description */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Delivery Auto - динамічна українська логістична компанія, яка спеціалізується на швидкій та надійній 
                  доставці посилок по всій території України. Заснована у 2010 році, компанія швидко завоювала довіру 
                  клієнтів завдяки індивідуальному підходу та гнучким рішенням для кожного замовника.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Мережа Delivery Auto охоплює понад 150 населених пунктів України з власними відділеннями та партнерськими 
                  пунктами видачі. Компанія активно працює з інтернет-магазинами, забезпечуючи швидку доставку товарів 
                  від найпопулярніших маркетплейсів, включаючи <Link href="/stores/prom" className="text-blue-600 hover:underline">Prom.ua</Link>, 
                  <Link href="/stores/olx" className="text-blue-600 hover:underline"> OLX</Link> та інші. Особливістю компанії є персональний 
                  підхід до кожного клієнта та можливість відстеження посилки в режимі реального часу.
                </p>
              </div>
            </div>

            {/* How to Track */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як відстежити посилку Delivery Auto?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Для відстеження посилки в Delivery Auto використовується унікальний номер накладної, який присвоюється 
                  кожному відправленню. Цей номер дозволяє відслідковувати весь шлях посилки від моменту прийняття до видачі.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Номери накладних Delivery Auto:</h3>
                  <div className="space-y-2 font-mono text-sm mb-6">
                    <div className="bg-[#f5f5f5] p-2 rounded">0580402558</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">1234567890</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">DA123456789</div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4">Можуть також використовуватися штрих-коди:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-[#f5f5f5] p-2 rounded">DEL-AUTO-001234</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">240580402558</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Послуги Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Компанія пропонує комплексні логістичні рішення для приватних клієнтів та бізнесу. Кожна послуга 
                  розроблена з урахуванням специфічних потреб різних категорій замовників.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#f0e5d9] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Стандартні послуги:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Доставка до відділення (1-3 дні)</li>
                      <li>• Кур&apos;єрська доставка</li>
                      <li>• Експрес-доставка за 24 години</li>
                      <li>• Доставка великогабаритних товарів</li>
                      <li>• Доставка в день звернення</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#eaf0f5] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Додаткові послуги:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Накладений платіж</li>
                      <li>• Перевірка комплектності</li>
                      <li>• Примірка при отриманні</li>
                      <li>• Зворотна доставка</li>
                      <li>• Страхування вантажу</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Терміни доставки Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Компанія гарантує швидку доставку завдяки оптимізованій логістичній мережі та власному автопарку. 
                  Терміни доставки залежать від відстані та обраного типу послуги.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Стандартні терміни:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• У межах міста: 1-2 дні</li>
                    <li>• Між обласними центрами: 2-3 дні</li>
                    <li>• До районних центрів: 3-4 дні</li>
                    <li>• Експрес-доставка: наступний день</li>
                    <li>• Кур&apos;єрська доставка: день в день або наступний день</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Coverage Area */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">География покриття Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Delivery Auto обслуговує всі регіони України з особливим акцентом на якісному покритті східних та 
                  південних областей. Компанія постійно розширює мережу для покращення доступності послуг.
                </p>
                
                <div className="bg-[#f0e5d9] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Основні регіони обслуговування:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-1 text-[#333037]/80">
                      <li>• Дніпропетровська область</li>
                      <li>• Запорізька область</li>
                      <li>• Харківська область</li>
                      <li>• Полтавська область</li>
                      <li>• Кіровоградська область</li>
                    </ul>
                    <ul className="space-y-1 text-[#333037]/80">
                      <li>• Херсонська область</li>
                      <li>• Миколаївська область</li>
                      <li>• Одеська область</li>
                      <li>• Київська область</li>
                      <li>• Черкаська область</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Тарифи Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Тарифна політика Delivery Auto орієнтована на доступність послуг для всіх категорій клієнтів. 
                  Вартість розраховується за ваговим принципом з урахуванням відстані доставки.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Орієнтовні тарифи (UAH):</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">Місцева доставка:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: 35-50 грн</li>
                        <li>• 1-5 кг: 7-10 грн/кг</li>
                        <li>• 5-30 кг: 5-8 грн/кг</li>
                        <li>• Понад 30 кг: 4-6 грн/кг</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Міжобласна доставка:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: 50-70 грн</li>
                        <li>• 1-5 кг: 10-15 грн/кг</li>
                        <li>• 5-30 кг: 8-12 грн/кг</li>
                        <li>• Понад 30 кг: 6-10 грн/кг</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Receive */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Як отримати посилку Delivery Auto?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Отримання посилки можливе у відділеннях компанії або через кур&apos;єрську доставку. При надходженні 
                  посилки клієнт отримує SMS-повідомлення з інформацією про готовність до видачі.
                </p>
                
                <div className="bg-[#f0e5d9] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Документи для отримання:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Паспорт або інший документ з фото</li>
                    <li>• Номер накладної або SMS з кодом</li>
                    <li>• При отриманні довіреною особою - нотаріальна довіреність</li>
                    <li>• Для юридичних осіб - документи, що підтверджують повноваження</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Storage Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Умови зберігання Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Безкоштовне зберігання посилки у відділенні складає 7 робочих днів з моменту надходження. 
                  Після закінчення безкоштовного періоду стягується плата згідно з діючими тарифами. 
                  Максимальний термін зберігання - 21 день, після чого посилка повертається відправнику.
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Режим роботи Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Відділення Delivery Auto працюють з понеділка по п&apos;ятницю з 9:00 до 18:00, в суботу до 15:00. 
                  Кур&apos;єрська доставка здійснюється з 10:00 до 19:00 в робочі дні.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Актуальний графік роботи конкретного відділення можна уточнити на сайті компанії або зателефонувавши 
                  на гарячу лінію.
                </p>
              </div>
            </div>

            {/* Customer Service */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Служба підтримки Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Команда підтримки клієнтів готова допомогти з будь-якими питаннями щодо доставки:
                </p>
                <div className="space-y-2 font-mono text-lg">
                  <div>0-800-750-999 (безкоштовно)</div>
                  <div>+380-67-123-45-67</div>
                </div>
                <p className="text-[#333037]/80 leading-relaxed mt-4">
                  Також доступна підтримка через онлайн-чат на сайті та електронну пошту support@delivery-auto.com
                </p>
              </div>
            </div>

            {/* Shipment Statuses */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Статуси відправлень Delivery Auto</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Система відстеження Delivery Auto надає детальну інформацію про поточний статус посилки та 
                  всі етапи її переміщення від відправки до доставки отримувачу.
                </p>
                
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Посилка прийнята до перевезення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Оформлення документів</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Відправлена з [місто]</td>
                        <td className="px-4 py-3 text-sm text-gray-500">В дорозі до сортувального центру</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Прибула до терміналу</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Сортування та підготовка</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">В дорозі до [місто призначення]</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Транспортування</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Прибула до відділення отримувача</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Готова до видачі</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">ВИДАНА</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Посилка отримана клієнтом</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td className="px-4 py-3 text-sm text-blue-800">Передана кур&apos;єру</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Доставляється за адресою</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm text-yellow-800">Неможливо зв&apos;язатися з отримувачем</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Потрібен контакт клієнта</td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-4 py-3 text-sm text-red-800">Повертається відправнику</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Відмова або неможливість доставки</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">Delivery Auto - пошук посилок та накладних</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  У коментарях ви можете поставити питання про відстеження посилки Delivery Auto.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Comments Section */}
      <section className="bg-[#f5f5f5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <PandaTrackComments
              pageId="homepage"
              title=""
              showStats={false}
              showInfo={false}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}