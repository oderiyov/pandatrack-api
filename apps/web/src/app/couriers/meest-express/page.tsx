// src/app/couriers/meest-express/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Meest Express відстеження посилок за номером | PandaTrack',
  description: 'Відстежити посилку Meest Express за трек-номером. Міжнародна доставка з США, Канади, Польщі в Україну. Швидке відстеження вантажів та посилок.',
  keywords: 'meest express відстеження, міст експрес, meest tracking, посилки з сша, доставка з канади, відстежити міст',
  openGraph: {
    title: 'Meest Express відстеження посилок | PandaTrack',
    description: 'Відстежити посилку Meest Express за номером. Міжнародна доставка з США, Канади та Європи.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function MeestExpressPage() {
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
                  src="/logos/meest.svg"
                  alt="Meest Express логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">Meest Express</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Міжнародна служба доставки</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0-800-500-211 • <a href="https://ua.meest.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">ua.meest.com</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть номер (наприклад: 2508205FM9K077RC)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 2508205FM9K077RC, CV559459988UA, MEEST12345678901</p>
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
              Відстеження посилок Meest Express
            </h1>

            {/* Company Description */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Meest Express - міжнародна логістична компанія, яка спеціалізується на доставці посилок та вантажів 
                  між Україною, США, Канадою та країнами Європи. Заснована у 1989 році в Канаді українськими 
                  іммігрантами, сьогодні компанія має розгалужену мережу відділень по всьому світу. В Україні 
                  функціонує понад 1500 відділень та поштоматів у містах та селах.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Основні напрямки доставки: США-Україна, Канада-Україна, Польща-Україна, Німеччина-Україна. 
                  Компанія відома надійністю міжнародних перевезень та конкурентними цінами. Особливо популярна 
                  серед українців за кордоном для відправки посилок рідним та друзям. Також активно співпрацює 
                  з інтернет-магазинами <Link href="/stores/amazon" className="text-blue-600 hover:underline">Amazon</Link>, 
                  <Link href="/stores/ebay" className="text-blue-600 hover:underline"> eBay</Link> та іншими для доставки товарів в Україну.
                </p>
              </div>
            </div>

            {/* How to Track */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як відстежити посилку Meest Express?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Для відстеження посилки Міст Експрес потрібен трек-номер, який видається при оформленні відправлення. 
                  Номер можна знайти в квитанції або отримати від відправника. Наш сервіс дозволяє швидко перевірити 
                  статус доставки та переглянути детальну історію переміщення вантажу.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Трек-номери Meest Express мають різні формати:</h3>
                  <div className="space-y-2 font-mono text-sm mb-6">
                    <div className="bg-[#f5f5f5] p-2 rounded">2508205FM9K077RC</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">CV559459988UA</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">MEEST12345678901</div>
                  </div>
                  
                  <h3 className="text-lg font-semibold mb-4">Внутрішні номери для доставки по Україні:</h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="bg-[#f5f5f5] p-2 rounded">UA123456789012</div>
                    <div className="bg-[#f5f5f5] p-2 rounded">ME000123456789</div>
                  </div>
                </div>
              </div>
            </div>

            {/* International Delivery */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Міжнародна доставка Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Міст Експрес спеціалізується на міжнародних перевезеннях між Україною та провідними країнами світу. 
                  Компанія пропонує різні варіанти доставки залежно від терміновості та типу вантажу.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-[#f0e5d9] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Основні напрямки:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• США → Україна (10-15 днів)</li>
                      <li>• Канада → Україна (12-18 днів)</li>
                      <li>• Польща → Україна (5-7 днів)</li>
                      <li>• Німеччина → Україна (7-10 днів)</li>
                      <li>• Україна → США/Канада (7-12 днів)</li>
                    </ul>
                  </div>
                  
                  <div className="bg-[#eaf0f5] rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">Типи доставки:</h3>
                    <ul className="space-y-2 text-[#333037]/80">
                      <li>• Стандартна доставка</li>
                      <li>• Експрес доставка</li>
                      <li>• Доставка документів</li>
                      <li>• Великогабаритні вантажі</li>
                      <li>• Кур&apos;єрська доставка</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Терміни доставки Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Терміни доставки залежать від країни відправлення, типу послуги та поточної ситуації з транспортом. 
                  Стандартна доставка з США в Україну займає 10-15 робочих днів, з Канади - 12-18 днів.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Фактори, що впливають на терміни:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Митне оформлення (1-3 дні)</li>
                    <li>• Святкові дні в країнах відправлення/призначення</li>
                    <li>• Погодні умови та транспортні затримки</li>
                    <li>• Тип вантажу (документи доставляються швидше)</li>
                    <li>• Обрана послуга (стандартна/експрес)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Customs and Restrictions */}
            <div className="mb-12">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6 text-yellow-800">
                  Митне оформлення та обмеження
                </h2>
                <p className="text-yellow-700 leading-relaxed mb-6">
                  При відправці міжнародних посилок через Meest Express важливо врахувати митні правила та обмеження. 
                  Деякі товари заборонені до перевезення, інші потребують спеціального оформлення.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">Заборонені до пересилання:</h3>
                  <ul className="space-y-1 text-gray-700 text-sm">
                    <li>• Легкозаймисті та вибухонебезпечні речовини</li>
                    <li>• Наркотичні та психотропні речовини</li>
                    <li>• Зброя та боєприпаси</li>
                    <li>• Живі тварини та рослини</li>
                    <li>• Швидкопсувні продукти харчування</li>
                    <li>• Готівка та цінні папери</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Вартість доставки Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Вартість доставки розраховується індивідуально залежно від ваги, розмірів посилки, країни відправлення 
                  та обраного типу послуги. Компанія пропонує конкурентні тарифи для регулярних клієнтів.
                </p>
                
                <div className="bg-[#f0e5d9] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Приблизні тарифи (USD):</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">США → Україна:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: $12-15</li>
                        <li>• 1-5 кг: $8-12 за кг</li>
                        <li>• Понад 5 кг: $6-10 за кг</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Європа → Україна:</h4>
                      <ul className="space-y-1 text-sm text-[#333037]/80">
                        <li>• До 1 кг: $8-12</li>
                        <li>• 1-5 кг: $6-9 за кг</li>
                        <li>• Понад 5 кг: $4-7 за кг</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* How to Receive */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як отримати посилку Meest Express?</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Отримання посилки можливе у відділеннях Міст Експрес по всій Україні або через кур&apos;єрську доставку. 
                  При надходженні посилки отримувач отримує SMS-повідомлення.
                </p>
                
                <div className="bg-white rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Необхідні документи для отримання:</h3>
                  <ul className="space-y-2 text-[#333037]/80">
                    <li>• Паспорт громадянина України або інший документ, що посвідчує особу</li>
                    <li>• Трек-номер посилки або квитанція</li>
                    <li>• При отриманні третьою особою - довіреність</li>
                    <li>• Для комерційних посилок - додаткові документи</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Storage Terms */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Зберігання посилок у Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Безкоштовне зберігання посилки у відділенні Міст Експрес складає 10 днів з моменту надходження. 
                  Після закінчення цього терміну стягується плата за зберігання. Якщо посилку не забрали протягом 
                  30 днів, вона може бути повернена відправнику або утилізована згідно з правилами компанії.
                </p>
              </div>
            </div>

            {/* Working Hours */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Режим роботи Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Більшість відділень Міст Експрес працюють з понеділка по п'ятницю з 9:00 до 18:00, в суботу до 16:00. 
                  Неділя - вихідний день. Деякі великі відділення можуть мати розширений графік роботи.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Точний графік роботи конкретного відділення можна перевірити на сайті 
                  <a href="https://ua.meest.com/offices" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">
                    ua.meest.com/offices
                  </a> або зателефонувавши на гарячу лінію.
                </p>
              </div>
            </div>

            {/* Customer Service */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Служба підтримки Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  При виникненні питань або проблем з доставкою можна звернутися до служби підтримки Міст Експрес:
                </p>
                <div className="space-y-2 font-mono text-lg">
                  <div>0-800-500-211 (безкоштовно по Україні)</div>
                  <div>+380-44-390-71-11 (з мобільних)</div>
                </div>
                <p className="text-[#333037]/80 leading-relaxed mt-4">
                  Також доступна онлайн-підтримка через сайт та мобільний додаток Meest Express.
                </p>
              </div>
            </div>

            {/* Shipment Statuses */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Статуси відправлень Meest Express</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Кожна посилка проходить декілька етапів доставки, кожен з яких відображається у статусі відстеження. 
                  Це дозволяє точно знати, де зараз знаходиться ваша посилка.
                </p>
                
                <div className="bg-white rounded-lg overflow-hidden">
                  <table className="w-full">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Посилка прийнята до перевезення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Початковий етап обробки</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Відправлено з країни відправлення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Посилка у дорозі</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Прибула до країни призначення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Проходить митне оформлення</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Пройшла митне оформлення</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Готова до внутрішньої доставки</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Передана на доставку</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Прямує до відділення отримувача</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Прибула до відділення отримувача</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Можна забирати</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">Видана отримувачу</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Доставка завершена</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm text-yellow-800">Затримка на митниці</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Потрібні додаткові документи</td>
                      </tr>
                      <tr className="bg-red-50">
                        <td className="px-4 py-3 text-sm text-red-800">Повертається відправнику</td>
                        <td className="px-4 py-3 text-sm text-gray-500">Неможливо доставити</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>



            {/* Search Section */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">Meest Express - пошук посилок та відправлень</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  У коментарях ви можете поставити питання про відстеження посилки Міст Експрес.
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
              pageId="meest-express"
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