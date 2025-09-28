// src/app/couriers/nova-poshta/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Нова Пошта відстеження посилок за ТТН номером | PandaTrack',
  description: 'Відстежити посилку Нова Пошта за номером накладної. Швидке та точне відстеження ТТН внутрішніх та міжнародних відправлень Nova Poshta Global.',
  keywords: 'нова пошта відстеження, ттн номер, nova poshta tracking, новая почта, відстежити посилку нп',
  openGraph: {
    title: 'Нова Пошта відстеження посилок | PandaTrack',
    description: 'Відстежити посилку Нова Пошта за ТТН номером. Актуальна інформація про статус доставки.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function NovaPoshtaPage() {
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
                  src="/logos/nova-poshta.svg"
                  alt="Нова Пошта логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">Нова Пошта</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Українська кур&apos;єрська компанія</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0-800-500-609 • <a href="https://novaposhta.ua" target="_blank" rel="noopener" className="text-blue-600 hover:underline">novaposhta.ua</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть ТТН номер (наприклад: 20 6000 1360 4653)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 20 6000 1360 4653, 59 0005 0122 1243, YW000116922NPG</p>
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
              Відстеження посилок Нової Пошти
            </h1>

            {/* Company Description */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Нова Пошта - провідна транспортна компанія України, заснована у 2001 році. У 2015 році організація 
                  розширила свою діяльність на міжнародний ринок доставки вантажів і посилок. Сьогодні мережа служби 
                  доставки включає понад 9 тисяч відділень, з яких 7000 розташовані в селах та невеликих містах, 
                  а також більше 11000 поштоматів по всій країні. З 2021 року Нова Пошта запровадила встановлення 
                  примірочних у відділеннях та розпочала партнерство з <Link href="/stores/olx" className="text-blue-600 hover:underline">OLX</Link>.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  До послуг Нової Пошти належать: експрес доставка, відстеження вантажів за трек номером, доставка до дверей 
                  та на поверх, все це за доступними цінами без переплат. Мінімальна вартість доставки по Україні - 60 грн 
                  до відділення та 50 грн до поштомату, якщо в межах міста то 40 грн. Кур&apos;єрська доставка +30 грн до вартості 
                  доставки. Детальнішу інформацію про вартість та тарифи можна переглянути на сайті НП 
                  <a href="https://novaposhta.ua/basic_tariffs" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">
                    https://novaposhta.ua/basic_tariffs
                  </a>.
                </p>
              </div>
            </div>

            {/* How to Track */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як відстежити посилку Нова Пошта?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Для відстеження Нової Пошти можна скористатися нашим сервісом відстеження посилок та вантажів. 
                  Для цього потрібно отримати ТТН або трек номер посилки чи вантажу. Знайти номер можна в накладній, 
                  або якщо ви постійний користувач, то номер з&apos;явиться в додатку Нової Пошти.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Внутрішній ТТН (трек код) Нової Пошти має вигляд:</h3>
                  <div className="space-y-2 font-mono text-sm mb-6">
                    <div className="bg-[#f5f5f5] p-2 rounded">20 6000 1360 4653</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">59 0005 0122 1243</div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4">А міжнародні трек-номери Нова Пошта Глобал виглядають так:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-[#f5f5f5] p-2 rounded">YW000116922NPG</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">IHORD0000292447NPI</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">AENM0003038112</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">JM0000000021349</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">UA023456789US</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Can't Track Without Number */}
            <div className="mb-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-yellow-800">
                  Чи можливе відстеження посилки Нової Пошти без трек-коду?
                </h2>
                <p className="text-yellow-700 leading-relaxed">
                  Без трек-коду відстежити посилку Нової Пошти неможливо. Щоб отримати посилку, потрібно звернутися до 
                  продавця, щоб він надав вам номер ТТН, або звернутися до Нової Пошти, і співробітники допоможуть знайти 
                  вашу посилку. Якщо посилка з Китаю (<Link href="/stores/aliexpress" className="text-blue-600 hover:underline">AliExpress</Link>, Joom), 
                  то залишається тільки чекати, але зазвичай при відстеженні посилки з Аліекспрес їй відразу присвоюється 
                  внутрішній трек номер НП.
                </p>
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Нова Пошта термін доставки</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Терміни доставки Нової Пошти в Україні залежать від відстані між населеними пунктами та можливими святами, 
                  зазвичай це 1-2 дні. Для міжнародних відправлень Nova Poshta Global середні терміни доставки становлять 15 днів.
                </p>
              </div>
            </div>

            {/* Storage Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Скільки зберігається посилка на Новій Пошті?</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Термін безкоштовного зберігання посилки у відділенні Нової Пошти - 5 днів, у поштоматі - 3 дні. 
                  Якщо посилку не отримано протягом 5 днів, то далі посилка зберігатиметься на складі Нової Пошти 
                  ПЛАТНО протягом 25 днів з моменту надходження у відділення отримувача. Міжнародні відправлення 
                  зберігаються безкоштовно протягом 24 днів, після відправляються на склад НП для платного зберігання 
                  на 30 днів, якщо посилку не отримано, то вона буде утилізована.
                </p>
              </div>
            </div>

            {/* How to Receive */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Як отримати посилку від НП?</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Отримати посилку можна за ТТН або номером телефону у відділенні Нової Пошти, в поштоматі чи за адресою 
                  отримувача. Для отримання у відділенні потрібно взяти паспорт громадянина, або якщо ви зареєстровані в 
                  додатку Нової Пошти, то можна отримати без паспорта. Щоб забрати замовлення з поштомату, потрібно увімкнути 
                  блютуз, відкрити додаток та в відправленні натиснути на &quot;Відкрити комірку&quot;.
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Нова Пошта графік роботи</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Кожне відділення НП працює за індивідуальним графіком, зазвичай з 9 до 20 години. Детальніший графік 
                  роботи Нової Пошти можна переглянути на сайті: 
                  <a href="https://novaposhta.ua/timetable" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">
                    https://novaposhta.ua/timetable
                  </a>
                </p>
              </div>
            </div>

            {/* How to Return */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Як повернути посилку?</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Для повернення посилки потрібно заповнити заяву у відділенні НП або електронну заяву через додаток 
                  Нової Пошти. Повернення посилки платне.
                </p>
              </div>
            </div>

            {/* Additional Services */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Додаткові послуги</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Виклик машини</li>
                    <li>• Грошовий переказ та контроль оплати</li>
                    <li>• Зберігання</li>
                    <li>• Зворотна доставка документів та товару</li>
                  </ul>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Кур&apos;єрські послуги</li>
                    <li>• Пакування</li>
                    <li>• Логістичне обслуговування</li>
                    <li>• Накладений платіж</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Hotline */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Як зв&apos;язатися з гарячою лінією Нової Пошти?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Якщо виникли питання, ви завжди можете зв&apos;язатися з гарячою лінією Нової Пошти за телефонами:
                </p>
                <div className="space-y-2 font-mono text-lg">
                  <div>0-800-500-609</div>
                  <div>098-4-500-609</div>
                  <div>050-4-500-609</div>
                </div>
              </div>
            </div>

            {/* Shipment Statuses */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Статуси відправлень Нової Пошти</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Статус посилки - це етап, на якому перебуває ваше відправлення. Статуси змінюються від відправки 
                  замовлення до отримання його вами. Якщо виникне якась проблема з посилкою, то вона відобразиться 
                  в поточному статусі.
                </p>
                
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Відправник самостійно створив цю накладну, але ще не надав до відправки</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Посилка зареєстрована онлайн, але не відправлена</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Посилка прийнята у м. Київ, Відділення №346</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Посилка виїхала з м. Київ, Відділення №346</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Посилка прибула до Київський інноваційний термінал</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Посилка прибула до ЛЕО</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Посилка прибула до м. Львів, депо</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Посилка прибула до м. Львів, Відділення №46</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">Посилка видана в м. Львів, Відділення №46</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Відправлення отримано</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm text-yellow-800">Змінено адресу</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-4 py-3 text-sm text-red-800">Відмова від отримання</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Видано кур&apos;єру</td>
                        <td className="px-4 py-3 text-sm text-gray-500"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">Нова Пошта - пошук посилок та відправлень</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  В коментарях ви можете запитати про відстеження посилки Нова Пошта.
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
              pageId="nova-poshta"
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