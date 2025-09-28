// src/app/couriers/sat/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'SAT відстеження вантажів за номером накладної | PandaTrack',
  description: 'Відстежити вантаж SAT за номером накладної. Швидка доставка по Україні від транспортної компанії САТ. SAT tracking онлайн.',
  keywords: 'sat відстеження, сат накладна, доставка вантажів, відстежити сат, транспортна компанія sat',
  openGraph: {
    title: 'SAT відстеження вантажів | PandaTrack',
    description: 'Відстежити вантаж SAT за номером накладної. Швидка доставка по Україні.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function SATPage() {
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
                  src="/logos/sat.svg"
                  alt="SAT Satellite Express логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">SAT</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Транспортна компанія САТ</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0-800-500-755 • <a href="https://sat.ua" target="_blank" rel="noopener" className="text-blue-600 hover:underline">sat.ua</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть номер накладної (наприклад: 029000710)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 029000710, 001000288, SAT123456789</p>
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
              Відстеження вантажів SAT
            </h1>

            {/* Company Description */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  SAT - українська транспортно-логістична компанія з понад 19-річним досвідом роботи, яка спеціалізується на 
                  вантажоперевезеннях по всій території України. Компанія обслуговує понад 150 міст України з розгалуженою 
                  мережею відділень у всіх великих містах: Київ, Харків, Запоріжжя, Львів, Одеса, Дніпро та інші.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Щодня послугами САТ користується понад 5000 приватних осіб і підприємств. Компанія має власний автопарк 
                  з різноманітними транспортними засобами: тенти, ізотерми, самоскиди, рефрижератори, цистерни, тягачі 
                  з платформами для контейнерів і негабаритних вантажів. Всі автомобілі оснащені GPS-навігацією для 
                  відстеження вантажу в режимі реального часу. Особливо популярна серед інтернет-магазинів завдяки 
                  швидкості доставки та низьким цінам від 45 грн за посилку до 30 кг.
                </p>
              </div>
            </div>

            {/* How to Track */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як відстежити вантаж SAT?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Для відстеження вантажу в SAT Satellite Express потрібен номер накладної, який видається при 
                  оформленні відправлення. Цей номер дозволяє в режимі реального часу слідкувати за переміщенням 
                  вашого вантажу від відправки до доставки.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Номери накладних SAT мають формат:</h3>
                  <div className="space-y-2 font-mono text-sm mb-6">
                    <div className="bg-[#f5f5f5] p-2 rounded">029000710</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">001000288</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">SAT123456789</div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4">Міжнародні відправлення можуть мати інший формат:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-[#f5f5f5] p-2 rounded">SATU0000123456</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">SE202500001234</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Послуги SAT Satellite Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Компанія пропонує широкий спектр логістичних послуг для різних типів клієнтів - від приватних 
                  осіб до великих корпорацій. Кожна послуга адаптована під специфічні потреби замовника.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#f0e5d9] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Внутрішні перевезення:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Експрес-доставка за 24 години</li>
                      <li>• Стандартна доставка (1-3 дні)</li>
                      <li>• Доставка до відділення</li>
                      <li>• Кур&apos;єрська доставка</li>
                      <li>• Доставка в день звернення</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#eaf0f5] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Міжнародні послуги:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Доставка з Європи (5-10 днів)</li>
                      <li>• Митне оформлення</li>
                      <li>• Консолідація вантажів</li>
                      <li>• Складські послуги</li>
                      <li>• Страхування вантажу</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Терміни доставки SAT</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  SAT гарантує швидку доставку завдяки власному автопарку та оптимізованим маршрутам. Терміни 
                  залежать від відстані між населеними пунктами та обраного типу послуги.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Стандартні терміни по Україні:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• У межах міста: до 24 годин</li>
                    <li>• Між обласними центрами: 1-2 дні</li>
                    <li>• До районних центрів: 2-3 дні</li>
                    <li>• До сіл та селищ: 3-5 днів</li>
                    <li>• Експрес-доставка: гарантовано за 24 години</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Тарифи SAT Satellite Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Вартість доставки розраховується за ваговим або об'ємним принципом - береться більший показник. 
                  Компанія пропонує гнучку тарифну політику з знижками для постійних клієнтів.
                </p>
                
                <div className="bg-[#f0e5d9] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Базові тарифи (UAH):</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">У межах області:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: 45-60 грн</li>
                        <li>• 1-5 кг: 8-12 грн/кг</li>
                        <li>• 5-30 кг: 6-10 грн/кг</li>
                        <li>• Понад 30 кг: 4-8 грн/кг</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Між областями:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: 65-85 грн</li>
                        <li>• 1-5 кг: 12-18 грн/кг</li>
                        <li>• 5-30 кг: 10-15 грн/кг</li>
                        <li>• Понад 30 кг: 6-12 грн/кг</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Services */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Додаткові послуги</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  SAT пропонує комплекс додаткових послуг для забезпечення максимального комфорту клієнтів та 
                  безпеки вантажів під час транспортування.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Фінансові послуги:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Накладений платіж</li>
                      <li>• Контроль оплати</li>
                      <li>• Часткова оплата</li>
                      <li>• Післяплата</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Сервісні послуги:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Пакування вантажу</li>
                      <li>• Страхування</li>
                      <li>• Примірка при отриманні</li>
                      <li>• Зворотна доставка</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Terms */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Зберігання вантажів у SAT</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Безкоштовне зберігання вантажу у відділенні SAT становить 5 робочих днів з моменту надходження. 
                  Після закінчення цього терміну стягується плата за зберігання згідно з тарифами компанії. 
                  Максимальний термін зберігання - 30 днів, після чого вантаж може бути повернений відправнику.
                </p>
              </div>
            </div>

            {/* How to Receive */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як отримати вантаж SAT?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Отримання вантажу можливе у відділеннях SAT по всій Україні або через кур&apos;єрську доставку за адресою. 
                  При надходженні вантажу отримувач отримає SMS-повідомлення або дзвінок.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Для отримання потрібно:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Паспорт або інший документ, що посвідчує особу</li>
                    <li>• Номер накладної або SMS-повідомлення</li>
                    <li>• При отриманні третьою особою - довіреність та копія паспорта отримувача</li>
                    <li>• Для оплати накладеним платежем - готівка або картка</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Working Hours */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Режим роботи SAT</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Більшість відділень SAT працюють з понеділка по п'ятницю з 9:00 до 18:00, в суботу до 16:00. 
                  Деякі великі відділення можуть працювати до 20:00 та у вихідні дні.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Точний графік роботи конкретного відділення можна уточнити на сайті 
                  <a href="https://sat.ua/offices" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">
                    sat.ua/offices
                  </a> або зателефонувавши до відділення.
                </p>
              </div>
            </div>

            {/* Customer Service */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Контакт-центр SAT</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Служба підтримки клієнтів працює в робочі дні та готова допомогти з будь-якими питаннями:
                </p>
                <div className="space-y-2 font-mono text-lg">
                  <div>0-800-305-404 (безкоштовно)</div>
                </div>
                <p className="text-[#333037]/80 leading-relaxed mt-4">
                  Також можна залишити заявку через форму зворотного зв'язку на офіційному сайті компанії sat.ua
                </p>
              </div>
            </div>

            {/* Shipment Statuses */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Статуси відправлень SAT</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Система відстеження SAT показує детальну інформацію про поточний стан вантажу та історію його 
                  переміщення від моменту прийняття до видачі отримувачу.
                </p>
                
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Вантаж прийнято до перевезення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Початкова обробка</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Вантаж відправлено з [місто відправлення]</td>
                        <td className="px-4 py-3 text-sm text-gray-500">У дорозі</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Прибув до сортувального терміналу</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Обробка та сортування</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Відправлено до [місто призначення]</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Прямує до отримувача</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Прибув до відділення отримувача</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Готовий до видачі</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">Вантаж видано отримувачу</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Доставка завершена</td>
                      </tr>
                      <tr className="bg-blue-50">
                        <td className="px-4 py-3 text-sm text-blue-800">Передано кур&apos;єру для доставки</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Доставляється за адресою</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm text-yellow-800">Неможливо доставити</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Зв'яжіться з отримувачем</td>
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
                <h2 className="text-2xl font-bold mb-6">SAT - пошук вантажів та накладних</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  У коментарях ви можете поставити питання про відстеження вантажу SAT.
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
              pageId="sat"
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