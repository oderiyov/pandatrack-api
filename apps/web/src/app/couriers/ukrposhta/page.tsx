// src/app/couriers/ukrposhta/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Укрпошта відстеження посилок за трек номером | PandaTrack',
  description: 'Відстежити посилку Укрпошта за номером. Національна поштова служба України для внутрішніх та міжнародних відправлень.',
  keywords: 'укрпошта відстеження, ukrposhta tracking, національна пошта україни',
  openGraph: {
    title: 'Укрпошта відстеження посилок | PandaTrack',
    description: 'Відстежити посилку Укрпошта за трек номером. Актуальна інформація про статус доставки.',
    type: 'website',
    locale: 'uk_UA',
  }
}

export default function UkrposhtaPage() {
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
                  src="/logos/ukrposhta.svg"
                  alt="Укрпошта логотип"
                  width={64}
                  height={64}
                  className="rounded-lg"
                  priority
                />
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-[#333037] mb-2">Укрпошта</h2>
                <p className="text-lg text-[#333037]/70 mb-4">Національна поштова служба України</p>
                <div className="text-sm text-[#333037]/70 space-y-1">
                  <p>Відгуки • 0800-300-545 • <a href="https://ukrposhta.ua" target="_blank" rel="noopener" className="text-blue-600 hover:underline">ukrposhta.ua</a></p>
                </div>
              </div>
            </div>
            
            <TrackingForm 
              placeholder="Введіть трек номер (наприклад: 0501635744099)"
            />
            
            <div className="mt-4 text-sm text-[#333037]/70 text-center">
              <p>Приклади номерів: 0501635744099 (внутрішні), XX051147539UA (міжнародні)</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="bg-[#f5f5f5] py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            <h1 className="text-3xl md:text-4xl font-bold mb-8 text-[#333037]">
              Укрпошта - відстежити посилку
            </h1>

            {/* How to Track */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Для відстеження Укрпошти потрібен трек номер (0501635744099 - для відправлень по Україні, 
                  та XX051147539UA - для міжнародних посилок), знайти його можна в накладній, якщо ви робили 
                  замовлення в інтернет магазині, то шукайте трек номер на сторінці замовлення або на вашій 
                  електронній пошті. Якщо ви не можете знайти інформацію про відстеження Укрпошти, зверніться 
                  до продавця або в інтернет-магазин для отримання додаткової інформації про посилку.
                </p>
              </div>
            </div>

            {/* How to Track Section */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Як відстежити посилку Укрпошти?</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Відстеження Укрпошти дозволяє дізнатися місцезнаходження чи статус будь-якої посилки, яка була 
                  відправлена Україною чи за кордон. Щоб відстежити посилку Укрпошти, вам просто потрібно зайти 
                  на наш сайт, перейти в розділ відстеження, а потім ви побачите поле пошуку, де потрібно ввести 
                  номер відстеження вашої посилки. Введіть 13-значний трек номер та натисніть кнопку «Відстежити». 
                  Через кілька секунд ви побачите на своєму екрані місцезнаходження чи останній статус вашої посилки.
                </p>
              </div>
            </div>

            {/* Delivery Terms */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Терміни доставки Укрпошти</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Терміни доставки Укрпошти в Україні залежать від регіону та від того, живете ви у селі чи місті. 
                  По Україні - 14 днів, по області - 5 днів, а по місту 3-4 дні. За межами України терміни доставки 
                  залежать від місцевої служби доставки, тому що Укрпошта бачить вашу посилку тільки до митниці, 
                  перш ніж передати її місцевій поштовій службі в іншій країні.
                </p>
                
                <div className="bg-[#f5f5f5] rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Середній час доставки з Китаю</h3>
                  <p className="text-[#333037]/80">
                    Середній час доставки посилок з китаю з магазинів 
                    <Link href="/stores/aliexpress" className="text-blue-600 hover:underline mx-1">AliExpress</Link> 
                    та Joom в 2024 - 20-40 днів.
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Terms */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Скільки Укрпошта зберігає посилку?</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Час, протягом якого Укрпошта зберігатиме вашу посилку, залежатиме від типу посилки та кількості 
                  вільного місця у поштовому відділенні для зберігання, тому найкраще зателефонувати до місцевого 
                  поштового відділення Укрпошти для отримання додаткової інформації (зазвичай це 30 днів). Якщо ви 
                  не можете забрати посилку або Укрпошта не може її вам доставити, то потрібно буде заплатити за 
                  відправку посилки назад.
                </p>
              </div>
            </div>

            {/* About Ukrposhta */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Про Укрпошту</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Укрпошта - єдина державна компанія, яка приймає, сортує, перевозить, доставляє, організовує, 
                  аналізує та задовольняє усі потреби української пошти. Вона також відома як головна поштова 
                  служба країни. На даний момент компанія має більше 10 тисяч поштових відділень в Україні, 
                  що дозволяє їй працювати ефективно та безпечно по всій країні.
                </p>
                
                <p className="text-[#333037]/80 leading-relaxed">
                  Понад 70 000 співробітників підготовлені та навчені задовольняти будь-які потреби клієнтів, 
                  з добротою та повагою. Бізнес зосереджений на поштових послугах, логістиці, фінансах і комерції. 
                  Укрпошта надає понад 50 різноманітних послуг для фізичних осіб та підприємств.
                </p>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-6">Контактна інформація</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Основні контакти</h3>
                    <div className="space-y-2 text-[#333037]/80">
                      <p><strong>Сайт:</strong> <a href="https://ukrposhta.ua" target="_blank" rel="noopener" className="text-blue-600 hover:underline">ukrposhta.ua</a></p>
                      <p><strong>Телефон:</strong> 0800-300-545</p>
                      <p><strong>Email:</strong> ukrposhta@ukrposhta.ua</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3">Головний офіс</h3>
                    <p className="text-[#333037]/80">Київ, вул. Хрещатик-22</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Section */}
            <div className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <h2 className="text-2xl font-bold mb-6">УкрПошта - пошук посилок та відправлень</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  В коментарях ви можете запитати про відстеження посилки УкрПошта.
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
              pageId="ukrposhta"
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