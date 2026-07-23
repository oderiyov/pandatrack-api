// src/app/couriers/ukrposhta/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Укрпошта відстежити посилку за номером',
  description: 'Відстеження посилок Укрпошти онлайн: введіть трек-номер і побачите весь шлях відправлення українською — з поясненням кожного статусу. Безкоштовно, без реєстрації.',
  alternates: {
    canonical: '/couriers/ukrposhta',
  },
  openGraph: {
    title: 'Укрпошта відстежити посилку за номером — PandaTrack',
    description: 'Відстеження посилок Укрпошти онлайн з поясненням кожного статусу українською.',
    url: 'https://pandatrack.com.ua/couriers/ukrposhta',
    type: 'website',
    locale: 'uk_UA',
  },
}

// Статуси з реальних відповідей API Укрпошти + пояснення що робити далі
const statusGroups = [
  {
    stage: 'Оформлення та приймання',
    items: [
      {
        status: 'Створено онлайн. Очікує приймання',
        meaning: 'Відправник сформував відправлення в системі, але ще не здав його у відділення.',
        action: 'Рух почнеться після фактичного приймання. Якщо статус не змінюється кілька днів — питайте відправника.',
      },
      {
        status: 'Прийнято',
        meaning: 'Відділення прийняло посилку, номер активовано.',
        action: 'Далі очікуйте на відправлення до сортувального центру.',
      },
    ],
  },
  {
    stage: 'Рух Україною',
    items: [
      {
        status: 'Виїхало з Відділення',
        meaning: 'Посилка залишила відділення відправника.',
        action: 'Нічого робити не потрібно — відправлення в дорозі.',
      },
      {
        status: 'Прибуло до Логістичного центру',
        meaning: 'Посилка на сортуванні. У великих вузлах (Київ, Дніпро, Львів) обробка може тривати добу.',
        action: 'Це нормальна пауза, чекайте наступного сканування.',
      },
      {
        status: 'Прибуло до Відділення',
        meaning: 'Відправлення у вашому відділенні.',
        action: 'Можна забирати. Саме з цього моменту рахується безкоштовне зберігання.',
      },
    ],
  },
  {
    stage: 'Міжнародні відправлення',
    items: [
      {
        status: 'Прибуло до установи обміну',
        meaning: 'Посилка в пункті міжнародного обміну — сортування перед вильотом або після прибуття в країну.',
        action: 'Очікуйте: далі йде митниця або передача пошті іншої країни.',
      },
      {
        status: 'Виїхало з установи обміну відправлення',
        meaning: 'Відправлення покинуло країну-відправника.',
        action: 'Після цього статусу можлива тривала пауза без оновлень — див. розділ нижче.',
      },
      {
        status: 'Випущено з митного контролю',
        meaning: 'Митницю пройдено, посилка прямує до відділення видачі.',
        action: 'Далі буде звичайний рух Україною.',
      },
    ],
  },
  {
    stage: 'Завершення',
    items: [
      {
        status: 'Вручено Одержувачу',
        meaning: 'Посилку отримано. Це фінальний статус.',
        action: 'Відстеження завершено.',
      },
      {
        status: 'Передано на зберігання',
        meaning: 'Безкоштовний термін очікування вичерпано, відправлення перемістили на склад.',
        action: 'Заберіть якнайшвидше — зберігання стає платним, далі посилку повернуть відправнику.',
      },
      {
        status: 'Повернення за зворотною адресою',
        meaning: 'Посилка їде назад до відправника.',
        action: 'Зв\'яжіться з відправником щодо повторного надсилання.',
      },
    ],
  },
]

// FAQ — питання, яких немає в основному тексті (без дублювання)
const faqItems = [
  {
    question: 'Чи можна відстежити посилку Укрпошти за номером телефону?',
    answer: 'Ні. Пошук відправлення доступний лише за трек-номером. Номер телефону не є ідентифікатором посилки в системі Укрпошти — за ним можна хіба звернутися до контакт-центру 0 800 300 545, маючи додаткові дані про відправлення.',
  },
  {
    question: 'Чи можна знайти посилку за прізвищем отримувача?',
    answer: 'Ні. Пошук за прізвищем не передбачений — це захист персональних даних. Єдиний ідентифікатор відправлення — його трек-номер.',
  },
  {
    question: 'Номер не знаходиться. Що робити?',
    answer: 'Найчастіше причина в тому, що відправлення ще не потрапило в систему: після оформлення номер активується протягом кількох годин, іноді до доби. Також перевірте, чи не переплутано цифри, і чи це справді номер Укрпошти, а не іншого перевізника — наш сервіс визначає перевізника автоматично.',
  },
  {
    question: 'Чи потрібно реєструватися для відстеження?',
    answer: 'Ні. Відстеження на PandaTrack безкоштовне й не потребує реєстрації — достатньо ввести номер у поле пошуку.',
  },
  {
    question: 'Посилка з AliExpress йде Укрпоштою — як її відстежити?',
    answer: 'Так само, за трек-номером. Міжнародні замовлення часто мають номер у форматі двох літер, дев\'яти цифр і коду країни. Такі відправлення можуть їхати транзитом через треті країни, тому шлях буває довшим за прямий.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Головна', item: 'https://pandatrack.com.ua' },
    { '@type': 'ListItem', position: 2, name: 'Перевізники', item: 'https://pandatrack.com.ua/couriers' },
    { '@type': 'ListItem', position: 3, name: 'Укрпошта', item: 'https://pandatrack.com.ua/couriers/ukrposhta' },
  ],
}

export default function UkrposhtaPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <Header />

      {/* Шапка з формою */}
      <section className="bg-[#f0e5d9] py-10 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <nav className="text-sm text-[#333037]/60 mb-5" aria-label="Навігація">
              <Link href="/" className="hover:text-[#333037]">Головна</Link>
              {' / '}
              <Link href="/couriers" className="hover:text-[#333037]">Перевізники</Link>
              {' / '}
              <span className="text-[#333037]">Укрпошта</span>
            </nav>

            <div className="flex items-start space-x-5 mb-7">
              <Image
                src="/logos/ukrposhta.svg"
                alt="Укрпошта"
                width={60}
                height={60}
                className="rounded-lg flex-shrink-0"
                priority
              />
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Укрпошта — відстежити посилку за номером
                </h1>
                <p className="text-[#333037]/70">
                  Введіть трек-номер і побачите весь шлях відправлення українською
                </p>
              </div>
            </div>

            <TrackingForm placeholder="Наприклад: 0501635744099" />

            <p className="mt-3 text-sm text-[#333037]/70 text-center">
              Перевізник визначається автоматично — якщо номер належить іншій службі,
              ми знайдемо посилку однаково.
            </p>
          </div>
        </div>
      </section>

      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">

            {/* Формати номерів */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">Який вигляд має трек-номер Укрпошти</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-5">
                  Формат номера підказує, куди прямує відправлення. Укрпошта використовує
                  два основні типи ідентифікаторів.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#f5f5f5] rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Відправлення в межах України</h3>
                    <p className="font-mono text-sm bg-white rounded px-3 py-2 mb-3">0501635744099</p>
                    <p className="text-sm text-[#333037]/80">
                      Тринадцять цифр без літер. Такий номер друкується на чеку, який
                      видають при оформленні у відділенні.
                    </p>
                  </div>

                  <div className="bg-[#f5f5f5] rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Міжнародні відправлення</h3>
                    <p className="font-mono text-sm bg-white rounded px-3 py-2 mb-3">RA123456789UA</p>
                    <p className="text-sm text-[#333037]/80">
                      Дві літери, дев&apos;ять цифр і код країни. Останні символи вказують
                      на країну, звідки посилка вирушила — наприклад UA, PL, LV, DE.
                    </p>
                  </div>
                </div>

                <p className="text-[#333037]/80 leading-relaxed mt-5">
                  Замовлення з закордонних майданчиків часто їдуть транзитом: посилка
                  з Китаю може мати номер із європейським кодом країни, бо проходила
                  через тамтешній сортувальний вузол. Детальніше про це —
                  на сторінці{' '}
                  <Link href="/stores/aliexpress" className="text-blue-600 hover:underline">
                    відстеження замовлень AliExpress
                  </Link>.
                </p>
              </div>
            </section>

            {/* Статуси — головний унікальний блок */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-3">Статуси Укрпошти: що вони означають</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Найчастіше запитання при відстеженні — не «де посилка», а «що цей напис
                  взагалі означає». Нижче — статуси, які реально приходять від Укрпошти,
                  з поясненням і підказкою, чи потрібні від вас якісь дії.
                </p>

                <div className="space-y-8">
                  {statusGroups.map((group) => (
                    <div key={group.stage}>
                      <h3 className="text-lg font-semibold mb-3 text-[#333037]">
                        {group.stage}
                      </h3>
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div key={item.status} className="bg-[#f5f5f5] rounded-lg p-4">
                            <p className="font-semibold text-[#333037] mb-1">
                              {item.status}
                            </p>
                            <p className="text-sm text-[#333037]/80 mb-1">
                              {item.meaning}
                            </p>
                            <p className="text-sm text-[#333037]/60">
                              {item.action}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Чому статус завмер — унікальне пояснення */}
            <section className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Чому статус посилки не оновлюється
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Найпоширеніша причина стосується міжнародних відправлень. Укрпошта
                  показує рух посилки лише в межах власної мережі. Щойно відправлення
                  передають поштовій службі іншої країни, українська система перестає
                  отримувати оновлення — і трекінг ніби завмирає на статусі про вихід
                  з установи обміну. Посилка при цьому їде далі, просто її сканує вже
                  інша пошта.
                </p>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Інші звичні причини пауз:
                </p>
                <ul className="list-disc pl-6 text-[#333037]/80 space-y-2 mb-4">
                  <li>вихідні та святкові дні — сканування не відбувається;</li>
                  <li>митне оформлення міжнародного відправлення;</li>
                  <li>довгий перегін між сортувальними вузлами, коли між скануваннями минає доба й більше.</li>
                </ul>
                <p className="text-[#333037]/80 leading-relaxed">
                  Насторожитися варто, якщо статус не змінюється понад тиждень для
                  відправлення в межах України. У такому разі є сенс звернутися до
                  контакт-центру Укрпошти за номером 0 800 300 545 та мати під рукою
                  трек-номер.
                </p>
              </div>
            </section>

            {/* Терміни */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">Скільки часу йде посилка</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Тривалість доставки залежить від відстані та від того, чи є у населеному
                  пункті власне відділення. У межах міста відправлення зазвичай долає шлях
                  за кілька днів, обласні напрямки потребують близько тижня, а доставка
                  через усю країну до віддалених сіл може розтягнутися до двох тижнів.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Для міжнародних посилок передбачити термін складніше: на нього впливають
                  спосіб перевезення, черга на митниці та швидкість пошти країни
                  призначення. Авіадоставка помітно швидша за наземну чи морську, але
                  саме митний етап найчастіше й додає непередбачувані дні.
                </p>
              </div>
            </section>

            {/* Отримання та зберігання */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">Отримання та зберігання</h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Коли посилка надходить у відділення, отримувачу приходить повідомлення.
                  Для видачі потрібен документ, що посвідчує особу, та номер відправлення
                  або повідомлення. Забрати посилку може й інша людина — за довіреністю
                  або як член родини, залежно від правил конкретного відділення.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Відлік часу зберігання починається з моменту, коли відправлення прибуло
                  у відділення видачі. Якщо не забрати його вчасно, посилку спершу
                  переміщують на зберігання, а згодом повертають відправнику — тож
                  зволікати не варто.
                </p>
              </div>
            </section>

            {/* FAQ */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-6">Часті запитання</h2>
                <div className="space-y-3">
                  {faqItems.map((item, index) => (
                    <details
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                      {...(index === 0 ? { open: true } : {})}
                    >
                      <summary className="font-semibold cursor-pointer">
                        {item.question}
                      </summary>
                      <p className="text-[#333037]/80 mt-3 leading-relaxed">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </div>
            </section>

            {/* Перелінковка з описовими анкорами */}
            <section className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-xl font-bold mb-4">Відстеження інших служб доставки</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-blue-600">
                  <li><Link href="/couriers/nova-poshta" className="hover:underline">Нова Пошта — відстежити за ТТН</Link></li>
                  <li><Link href="/couriers/meest-express" className="hover:underline">Meest Express — міжнародні посилки</Link></li>
                  <li><Link href="/couriers/dhl" className="hover:underline">DHL — експрес-доставка</Link></li>
                  <li><Link href="/couriers/sat" className="hover:underline">SAT — відстеження вантажів</Link></li>
                  <li><Link href="/couriers/delivery-auto" className="hover:underline">Delivery Auto — відстежити відправлення</Link></li>
                  <li><Link href="/stores/aliexpress" className="hover:underline">AliExpress — відстеження замовлень</Link></li>
                </ul>
              </div>
            </section>

            <PandaTrackComments pageId="courier-ukrposhta" />

          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}