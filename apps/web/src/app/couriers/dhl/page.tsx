// src/app/couriers/dhl/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'DHL Express відстеження посилок за трек номером | PandaTrack',
  description: 'Відстежити посилку DHL Express за номером. Швидке міжнародне відстеження експрес-доставки DHL по всьому світу.',
  keywords: 'dhl express відстеження, dhl tracking, дхл експрес, міжнародна доставка',
  openGraph: {
    title: 'DHL Express відстеження посилок | PandaTrack',
    description: 'Відстежити посилку DHL Express за трек номером. Актуальна інформація про статус міжнародної доставки.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function DHLExpressPage() {
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
                  src="/logos/dhl.svg"
                  alt="DHL Express логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">DHL Express</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Міжнародна експрес-доставка</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0800-309-309 • <a href="https://dhl.ua" target="_blank" rel="noopener" className="text-blue-600 hover:underline">dhl.ua</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть трек номер (наприклад: 1234567890)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 1234567890, JD014600012208052040</p>
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
              DHL Express відстеження посилок
            </h1>

            {/* Company Description */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Міжнародна компанія DHL посідає перше місце у світі серед служб експрес-доставки. Своїм клієнтам надає 
                  повний комплекс логістичних послуг. Свою діяльність розпочала 20 вересня 1969 року як кур&apos;єрська служба, 
                  завданням якої була доставка пошти з Сан-Франциско до Гонолулу і назад. Заснували компанію Адріан Делсі, 
                  Ларрі Хіллблом та Роберт Лінн. Початкові літери прізвищ цих людей послужили назвою нової служби.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Служба здійснювала внутрішні доставки по <Link href="/couriers/usps" className="text-blue-600 hover:underline">США</Link>  
                  та постійно відкривала нові представництва у різних країнах. Доставку здійснювали навіть у країни, недружні до США: 
                  СРСР, держави Східної Європи, Китай, КНДР. 1998 року акції DHL почала скуповувати німецька поштова компанія 
                  Deutsche Post. 2001 року німцям перейшов контрольний пакет акцій DHL.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Зараз компанія DHL обслуговує понад 220 країн, зокрема Україну. У всьому світі налічується понад 5000 
                  представництв DHL. Щороку понад 1,5 млрд посилок відправляються саме службою DHL. Це найкращий показник 
                  серед таких компаній.
                </p>
              </div>
            </div>

            {/* Subsidiaries */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Дочірні підприємства:</h2>
                <ul className="space-y-2 text-[#333037]/80">
                  <li>• DHL Global Mail</li>
                  <li>• DHL eCommerce</li>
                </ul>
              </div>
            </div>

            {/* Activities */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Діяльність</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Основна діяльність компанії DHL Express пов'язана з доставкою вантажів різних розмірів та мас. 
                  Доставка підрозділяється на 2 види: посилка та експрес. Перший вид дозволяє пересилати вантажі 
                  масою до 31,5 кг по країні протягом 1-3 робочих днів. Експрес-доставка дозволяє доставити вантаж 
                  масою до 300 кг у будь-який регіон світу наступного робочого дня.
                </p>
                
                <h3 className="text-lg font-semibold mb-4">Інші види діяльності компанії DHL Express:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <ul className="space-y-2">
                    <li>• Експедирування вантажів</li>
                    <li>• Логістичні послуги</li>
                    <li>• Інтеграція технологічних платформ</li>
                    <li>• Підготовка та пакування вантажів</li>
                  </ul>
                  <ul className="space-y-2">
                    <li>• Прийом вантажів у вихідні</li>
                    <li>• Прийом оплати</li>
                    <li>• Митне оформлення</li>
                    <li>• Страхування вантажів</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Tracking */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Відстеження поштових відправлень DHL</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Клієнти компанії DHL Express мають можливість відстежувати посилки. Для цього необхідно зайти до розділу 
                  "Відстеження DHL Express". Тут необхідно вибрати тип вантажу і в спеціальному полі ввести трек-номер 
                  відправлення. Цей номер надається кожній посилці. Складається він із 10 цифр. Клієнти можуть відстежувати 
                  до 10 відправлень одночасно.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Також можна використовувати функції "DHL e Track", "DHL ExspresSMS" та "DHL ExpressWAP" для відстеження 
                  через різні канали зв'язку.
                </p>
              </div>
            </div>

            {/* Statuses */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Статус відстеження замовлення DHL</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Статус відстеження показує поточний етап обробки вашого відправлення від моменту створення до доставки.
                </p>
                
                <div className="bg-[#f5f5f5] rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left text-sm font-semibold">Статус відстеження замовлення</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold">Значення статусу</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-3 text-sm">Shipment information received</td>
                        <td className="px-4 py-3 text-sm">Дані вашої посилки отримані, тепер ви можете відстежити її</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Processed at</td>
                        <td className="px-4 py-3 text-sm">Посилка знаходиться в процесі обробки</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Arrived at DHL Sort Facility</td>
                        <td className="px-4 py-3 text-sm">Ваша посилка знаходиться в сортувальному центрі DHL</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">The shipment has departed from a DHL Sort Facility</td>
                        <td className="px-4 py-3 text-sm">Посилка відправлена з сортувального центру DHL</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Arrived at DHL Delivered Facility</td>
                        <td className="px-4 py-3 text-sm">Посилка прибула на термінал доставки і чекає на повторну обробку</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 text-sm">Customs clearance status updated</td>
                        <td className="px-4 py-3 text-sm">Статус митного оформлення оновлено</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Shipment picked up</td>
                        <td className="px-4 py-3 text-sm">Посилка скоро буде передана кур&apos;єру</td>
                      </tr>
                      <tr className="bg-yellow-50">
                        <td className="px-4 py-3 text-sm text-yellow-800">Shipment is on hold</td>
                        <td className="px-4 py-3 text-sm text-yellow-700">Доставка затримується</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-3 text-sm">Shipment is out with courier for delivery</td>
                        <td className="px-4 py-3 text-sm">Посилка в процесі доставки до місця призначення</td>
                      </tr>
                      <tr className="bg-green-50">
                        <td className="px-4 py-3 text-sm font-semibold text-green-800">Delivered</td>
                        <td className="px-4 py-3 text-sm text-green-700">Доставлено</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">DHL Express - пошук посилок та відправлень</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  В коментарях ви можете запитати про відстеження посилки DHL Express.
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
              pageId="dhl-express"
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