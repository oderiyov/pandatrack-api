// src/app/stores/aliexpress/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: "AliExpress відстеження посилок з Китаю в Україну | PandaTrack",
  description: "Відстежуйте замовлення з AliExpress за трек-номером. Докладна інструкція з відстеження посилок з Китаю, терміни доставки та статуси відправлень.",
  keywords: "aliexpress відстеження, аліекспрес трекінг, посилки з китаю, china post, відстежити замовлення",
  openGraph: {
    title: "AliExpress відстеження посилок | PandaTrack",
    description: "Відстежуйте замовлення з AliExpress швидко та зручно",
    type: "website",
    locale: "uk_UA",
  }
}

export default function AliExpressStorePage() {
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
                  AliExpress (Аліекспрес)
                </h1>
                <p className="text-lg text-[#333037]/70 mb-4">
                  Відстеження посилок з найбільшого китайського маркетплейсу
                </p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Безкоштовна доставка • Захист покупця • <a href="https://aliexpress.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">aliexpress.com</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть трек-номер замовлення з AliExpress"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Відстежте своє замовлення після покупки на AliExpress</p>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Main Info */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Відстеження посилок з AliExpress
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Після оплати замовлення на торговому майданчику AliExpress продавець готує ваші покупки для відправки 
              та передає їх поштовій службі. Залежно від обраного способу доставки, це може бути China Post, 
              AliExpress Standard Shipping, або інші логістичні компанії.
            </p>
            <p className="text-[#333037]/80 leading-relaxed">
              Коли посилка передається поштовій службі, їй присвоюється унікальний трек-номер для відстеження. 
              За цим номером ви можете слідкувати за переміщенням посилки від Китаю до України через наш сервіс.
            </p>
          </div>
        </section>

        {/* How to Track by Order Number */}
        <section className="mb-16">
          <div className="bg-[#eaf0f5] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Як відстежити посилку з AliExpress за номером замовлення?
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Номер замовлення присвоюється всередині платформи AliExpress і не пов&apos;язаний з поштовим 
              відправленням. Тому відстежити за номером замовлення неможливо, але це не проблема.
            </p>
            <p className="text-[#333037]/80 leading-relaxed">
              Коли продавець готує замовлення до відправки, служба доставки видає унікальний трек-номер. 
              Використовуючи цей номер, ви легко зможете відстежити замовлення через форму вище.
            </p>
          </div>
        </section>

        {/* How to Track by Tracking Number */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Як відстежити посилку з AliExpress за трек-номером?
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Після зміни статусу замовлення на &quot;Надіслано&quot; в деталях замовлення з&apos;явиться трек-номер 
              вашої посилки. За цим номером ви зможете відстежити своє замовлення.
            </p>
            
            <div className="bg-[#f0e5d9] rounded-lg p-6 mb-6">
              <h3 className="font-semibold mb-4">Покрокова інструкція:</h3>
              <ol className="space-y-3">
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                  <span>Увійдіть в особистий кабінет AliExpress</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                  <span>Перейдіть в розділ &quot;Мої замовлення&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                  <span>Знайдіть потрібне замовлення і натисніть &quot;Деталі&quot;</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                  <span>Скопіюйте трек-номер та введіть його в форму на нашому сайті</span>
                </li>
              </ol>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">Важливо знати:</h4>
              <p className="text-yellow-700 text-sm">
                Номер замовлення (наприклад: 502270169095420) і номер відстеження (наприклад: YW622444007800NPI) 
                - це різні номери. Для відстеження потрібен саме трек-номер!
              </p>
            </div>
          </div>
        </section>

        {/* Trackable vs Non-trackable */}
        <section className="mb-16">
          <div className="bg-[#eaf0f5] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Відстежувані та невідстежувані посилки
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Поштові відправлення з AliExpress поділяються на відстежувані та невідстежувані. 
              Дешеві товари часто відправляються невідстежуваними посилками для економії на доставці.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-green-600 mb-3">Відстежувані посилки</h3>
                <ul className="space-y-2 text-[#333037]/80 text-sm">
                  <li>• Повна історія переміщення</li>
                  <li>• Відстеження від Китаю до України</li>
                  <li>• Точні статуси на кожному етапі</li>
                  <li>• Можливість передбачити дату доставки</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-orange-600 mb-3">Невідстежувані посилки</h3>
                <ul className="space-y-2 text-[#333037]/80 text-sm">
                  <li>• Відстеження тільки в Китаї</li>
                  <li>• Припинення трекінгу на експорті</li>
                  <li>• Доставка без повідомлень</li>
                  <li>• Нижча вартість доставки</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Delivery Times */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Скільки йде посилка з AliExpress в Україну?
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Терміни доставки залежать від обраного способу доставки та ваги посилки. 
              Ось середні терміни для популярних служб:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-600 mb-2">China Post</h4>
                <div className="text-2xl font-bold text-[#333037] mb-1">20-45 днів</div>
                <p className="text-xs text-[#333037]/60">80% всіх відправлень</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-600 mb-2">AliExpress Standard</h4>
                <div className="text-2xl font-bold text-[#333037] mb-1">15-25 днів</div>
                <p className="text-xs text-[#333037]/60">Популярний вибір</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-600 mb-2">ePacket</h4>
                <div className="text-2xl font-bold text-[#333037] mb-1">10-20 днів</div>
                <p className="text-xs text-[#333037]/60">Швидша доставка</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-600 mb-2">DHL/FedEx</h4>
                <div className="text-2xl font-bold text-[#333037] mb-1">3-7 днів</div>
                <p className="text-xs text-[#333037]/60">Експрес (платно)</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Поради:</strong> Для дешевих товарів орієнтуйтесь на 30-45 днів. 
                Дорогі товари часто доставляються швидше завдяки кращим способам доставки.
              </p>
            </div>
          </div>
        </section>

        {/* Delivery in Ukraine */}
        <section className="mb-16">
          <div className="bg-[#eaf0f5] rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Доставка AliExpress в Україні
            </h2>
            <p className="text-[#333037]/80 leading-relaxed mb-6">
              Після прибуття в Україну посилки з AliExpress доставляються місцевими службами. 
              Дізнатися, яка служба доставлятиме, можна за статусами відстеження:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">
                  <Link href="/couriers/ukrposhta" className="text-blue-600 hover:underline">Укрпошта</Link>
                </h3>
                <p className="text-[#333037]/70 text-sm mb-3">
                  Якщо бачите статуси від China Post, Singapore Post, Posti Finland
                </p>
                <ul className="text-xs text-[#333037]/60 space-y-1">
                  <li>• Безкоштовне зберігання 30 днів</li>
                  <li>• Доставка в усі населені пункти</li>
                  <li>• Найдешевший варіант</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">
                  <Link href="/couriers/nova-poshta" className="text-blue-600 hover:underline">Нова Пошта</Link>
                </h3>
                <p className="text-[#333037]/70 text-sm mb-3">
                  Прискорена доставка через партнерство з AliExpress
                </p>
                <ul className="text-xs text-[#333037]/60 space-y-1">
                  <li>• Швидка доставка до відділень</li>
                  <li>• SMS повідомлення</li>
                  <li>• Зберігання 5 днів безкоштовно</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold mb-3">
                  <Link href="/couriers/meest-express" className="text-blue-600 hover:underline">Meest Express</Link>
                </h3>
                <p className="text-[#333037]/70 text-sm mb-3">
                  Для великих посилок та експрес-доставки
                </p>
                <ul className="text-xs text-[#333037]/60 space-y-1">
                  <li>• Доставка великогабаритних товарів</li>
                  <li>• Кур&apos;єрська доставка</li>
                  <li>• Зберігання 10 днів</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Shipping Statuses */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold mb-6 text-[#333037]">
              Статуси доставки AliExpress та їх значення
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-3 text-[#333037]">Етапи в Китаї:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Packed for picking-up</span>
                      <span className="text-sm text-gray-600">Підготовлено до відправки</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Received by line-haul</span>
                      <span className="text-sm text-gray-600">Прийнято магістральним перевізником</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Hand over to airline</span>
                      <span className="text-sm text-gray-600">Передано авіакомпанії</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium">Airline departure</span>
                      <span className="text-sm text-gray-600">Літак вилетів з Китаю</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3 text-[#333037]">Етапи в Україні:</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Arrived in destination country</span>
                      <span className="text-sm text-gray-600">Прибув до України</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Customs clearance</span>
                      <span className="text-sm text-gray-600">Митне оформлення</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="font-medium">Arrived at sorting center</span>
                      <span className="text-sm text-gray-600">Прибув до сортувального центру</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="font-medium text-green-600">Delivered</span>
                      <span className="text-sm text-green-600">Доставлено отримувачу</span>
                    </div>
                  </div>
                </div>
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
                <h3 className="font-semibold mb-2 text-[#333037]">Як знайти невідстежувану посилку з AliExpress?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Знайти невідстежувану посилку практично неможливо. Можна спробувати звернутися до поштового 
                  відділення з проханням пошукати посилку на ваше ім&apos;я. Якщо минуло понад 60 днів, відкривайте 
                  спір на AliExpress для повернення коштів.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Скільки зберігається посилка на пошті?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Терміни зберігання залежать від служби доставки. Укрпошта зберігає 30 днів, Нова Пошта - 5 днів, 
                  Meest Express - 10 днів. Після закінчення терміну посилки повертаються відправнику.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Що означає статус &quot;Прибув до країни призначення&quot;?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Цей статус означає, що посилка прибула в Україну і проходить митне оформлення. 
                  Зазвичай після цього слідують статуси про передачу місцевій службі доставки.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Чому посилка довго не оновлюється?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Затримки в оновленні можуть бути через: митне оформлення (1-7 днів), святкові дні, 
                  високе навантаження на пошту, або технічні проблеми з системою відстеження. 
                  Зазвичай це нормально для міжнародних відправлень.
                </p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2 text-[#333037]">Як відстежити безтрекову посилку?</h3>
                <p className="text-[#333037]/80 text-sm">
                  Безтрекові посилки не мають міжнародного номера відстеження. Вони можуть відстежуватися 
                  тільки в Китаї до експорту. В Україні такі посилки можуть отримати внутрішній номер, 
                  але про це не повідомляють. Просто чекайте доставки або повідомлення від пошти.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Search Section */}
        <section className="mb-16">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold mb-6">AliExpress - пошук посилок та відправлень</h2>
            <p className="text-[#333037]/80 leading-relaxed">
              У коментарях ви можете поставити питання про відстеження посилки AliExpress.
            </p>
          </div>
        </section>
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