// src/app/couriers/ukrposhta/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Укрпошта відстежити посилку за номером — трекінг',
  description: 'Відстеження посилок, листів і вантажів Укрпошти за трек-номером. Показуємо весь шлях відправлення українською з поясненням кожного статусу. Безкоштовно, без реєстрації.',
  alternates: {
    canonical: '/couriers/ukrposhta',
  },
  openGraph: {
    title: 'Укрпошта відстежити посилку за номером — PandaTrack',
    description: 'Трекінг посилок, листів і вантажів Укрпошти з поясненням кожного статусу українською.',
    url: 'https://pandatrack.com.ua/couriers/ukrposhta',
    type: 'website',
    locale: 'uk_UA',
  },
}

// Статуси з реальних відповідей API Укрпошти + що робити далі
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
        meaning: 'Відділення прийняло відправлення, номер активовано.',
        action: 'Далі очікуйте на відправлення до сортувального центру.',
      },
    ],
  },
  {
    stage: 'Рух Україною',
    items: [
      {
        status: 'Виїхало з Відділення',
        meaning: 'Відправлення залишило відділення приймання.',
        action: 'Дій не потрібно — посилка в дорозі.',
      },
      {
        status: 'Прибуло до Логістичного центру',
        meaning: 'Сортування. У великих вузлах — Київ, Дніпро, Львів — обробка може тривати добу.',
        action: 'Це нормальна пауза, чекайте наступного сканування.',
      },
      {
        status: 'Прибуло до Відділення',
        meaning: 'Відправлення у вашому відділенні.',
        action: 'Можна забирати. Саме звідси рахується безкоштовне зберігання.',
      },
    ],
  },
  {
    stage: 'Міжнародні відправлення',
    items: [
      {
        status: 'Прибуло до установи обміну',
        meaning: 'Пункт міжнародного обміну — сортування перед вильотом або після прибуття в країну.',
        action: 'Далі буде митниця або передача пошті іншої країни.',
      },
      {
        status: 'Виїхало з установи обміну відправлення',
        meaning: 'Відправлення покинуло країну-відправника.',
        action: 'Після цього статусу можлива тривала пауза без оновлень — пояснення нижче.',
      },
      {
        status: 'Випущено з митного контролю',
        meaning: 'Митницю пройдено, відправлення прямує до відділення видачі.',
        action: 'Далі — звичайний рух Україною.',
      },
    ],
  },
  {
    stage: 'Завершення',
    items: [
      {
        status: 'Вручено Одержувачу',
        meaning: 'Відправлення отримано. Це фінальний статус.',
        action: 'Відстеження завершено.',
      },
      {
        status: 'Передано на зберігання',
        meaning: 'Безкоштовний термін очікування вичерпано, відправлення перемістили на склад.',
        action: 'Заберіть якнайшвидше — далі його повернуть відправнику.',
      },
      {
        status: 'Повернення за зворотною адресою',
        meaning: 'Відправлення їде назад до відправника.',
        action: 'Зв\'яжіться з відправником щодо повторного надсилання.',
      },
    ],
  },
]

const faqItems = [
  {
    question: 'Чи можна відстежити відправлення Укрпошти за прізвищем?',
    answer: 'Ні. Пошук за прізвищем відправника чи одержувача не передбачений — це вимога захисту персональних даних. Єдиний ідентифікатор відправлення в системі — його трек-номер.',
  },
  {
    question: 'Чи можна відстежити посилку за номером телефону?',
    answer: 'Ні, номер телефону не є ідентифікатором відправлення. За ним можна хіба звернутися до контакт-центру Укрпошти 0 800 300 545, маючи додаткові дані: дату відправлення, відділення, приблизний вміст.',
  },
  {
    question: 'Трек-номер не знаходиться. Що робити?',
    answer: 'Найчастіше номер просто ще не потрапив у систему: після оформлення він активується протягом кількох годин, іноді до доби. Також перевірте, чи не переплутано цифри та чи це справді номер Укрпошти — наш сервіс визначає перевізника автоматично й підкаже, якщо відправлення належить іншій службі.',
  },
  {
    question: 'Чи потрібна реєстрація для перевірки відправлення?',
    answer: 'Ні. Відстеження на PandaTrack безкоштовне й анонімне — достатньо ввести номер у поле пошуку.',
  },
  {
    question: 'Скільки зберігається трек-номер після вручення?',
    answer: 'Історія відправлення залишається доступною ще певний час після вручення, тож ви можете перевірити дату й місце отримання навіть після того, як забрали посилку.',
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
              ми знайдемо відправлення однаково.
            </p>
          </div>
        </div>
      </section>

      <main className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">

            {/* Вступ */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Укрпошта — національний поштовий оператор, через який щодня проходять
                  сотні тисяч відправлень: посилки з інтернет-магазинів, рекомендовані
                  листи, бандеролі та вантажі. Кожному з них присвоюють унікальний номер,
                  за яким можна перевірити, де саме перебуває відправлення просто зараз.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Наш сервіс працює незалежно від офіційного сайту: ми звертаємося
                  напряму до системи Укрпошти й показуємо історію українською —
                  без реєстрації та без оплати.
                </p>
              </div>
            </section>

            {/* Де взяти номер + формати */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Де взяти трек-номер і який він має вигляд
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-5">
                  Номер для відстеження друкується на чеку, який видають при оформленні
                  у відділенні, і дублюється в накладній. Якщо ви замовляли товар онлайн,
                  шукайте його в листі від магазину, у деталях замовлення або в SMS.
                  Формат номера підказує, куди прямує відправлення.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="bg-[#f5f5f5] rounded-lg p-5">
                    <h3 className="font-semibold mb-2">У межах України</h3>
                    <p className="font-mono text-sm bg-white rounded px-3 py-2 mb-3">0501635744099</p>
                    <p className="text-sm text-[#333037]/80">
                      Тринадцять цифр без літер. Такий трек присвоюють посилкам, листам
                      і бандеролям, що не покидають країну.
                    </p>
                  </div>

                  <div className="bg-[#f5f5f5] rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Міжнародні відправлення</h3>
                    <p className="font-mono text-sm bg-white rounded px-3 py-2 mb-3">RA123456789UA</p>
                    <p className="text-sm text-[#333037]/80">
                      Дві літери, дев&apos;ять цифр і код країни. Останні символи вказують,
                      звідки вирушило відправлення — UA, PL, LV, DE, CN.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Типи відправлень — блок, якого немає в конкурентів */}
            <section className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Що можна відстежити: посилки, листи, бандеролі, вантажі
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Трекінг Укрпошти працює не лише для посилок. Номер отримує майже кожне
                  зареєстроване відправлення, тож перевірити можна значно більше, ніж
                  здається на перший погляд.
                </p>

                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Посилки</h3>
                    <p className="text-sm text-[#333037]/80">
                      Найпоширеніший тип — замовлення з інтернет-магазинів та передачі
                      між людьми. Відстежуються за тринадцятизначним номером або
                      міжнародним трек-кодом.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Рекомендовані та заказні листи</h3>
                    <p className="text-sm text-[#333037]/80">
                      На відміну від простих листів, рекомендовані реєструють у системі
                      й видають під підпис. Саме тому їх видно в трекінгу — включно
                      з листами з повідомленням про вручення, які часто надсилають
                      державні установи та суди.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Бандеролі</h3>
                    <p className="text-sm text-[#333037]/80">
                      Друковані матеріали, книги, документи. Відстежуються так само,
                      як посилки, якщо оформлені як реєстровані.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Вантажі</h3>
                    <p className="text-sm text-[#333037]/80">
                      Великогабаритні відправлення мають власну накладну, номер якої
                      теж придатний для пошуку. Перевірити вантаж можна в тому самому
                      полі, що й звичайну посилку.
                    </p>
                  </div>

                  <div className="bg-white rounded-lg p-5">
                    <h3 className="font-semibold mb-2">Грошові перекази</h3>
                    <p className="text-sm text-[#333037]/80">
                      Перекази обліковуються окремо від поштових відправлень, тому
                      їхній статус перевіряють у відділенні або через контакт-центр,
                      а не через звичайний трекінг.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Статуси — унікальний блок */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-3">
                  Статуси Укрпошти: що вони означають
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-6">
                  Найчастіше питання при перевірці відправлення — не «де воно», а «що цей
                  напис узагалі означає». Нижче зібрані статуси, які реально приходять
                  від Укрпошти, з поясненням і підказкою, чи потрібні від вас дії.
                </p>

                <div className="space-y-8">
                  {statusGroups.map((group) => (
                    <div key={group.stage}>
                      <h3 className="text-lg font-semibold mb-3">{group.stage}</h3>
                      <div className="space-y-3">
                        {group.items.map((item) => (
                          <div key={item.status} className="bg-[#f5f5f5] rounded-lg p-4">
                            <p className="font-semibold mb-1">{item.status}</p>
                            <p className="text-sm text-[#333037]/80 mb-1">{item.meaning}</p>
                            <p className="text-sm text-[#333037]/60">{item.action}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Трекінг не працює / статус завмер — під реальний біль */}
            <section className="mb-12">
              <div className="bg-[#eaf0f5] rounded-lg p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Чому трекінг не працює або статус завмер
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Найпоширеніша причина мовчання трекінгу стосується міжнародних
                  відправлень. Укрпошта показує рух лише в межах власної мережі. Щойно
                  відправлення передають поштовій службі іншої країни, українська система
                  перестає отримувати оновлення — і відстеження ніби завмирає на статусі
                  про вихід з установи обміну. Посилка при цьому їде далі, просто її
                  сканує вже інша пошта.
                </p>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Інші звичні причини пауз:
                </p>
                <ul className="list-disc pl-6 text-[#333037]/80 space-y-2 mb-4">
                  <li>вихідні та святкові дні — сканування не відбувається;</li>
                  <li>митне оформлення міжнародного відправлення;</li>
                  <li>довгий перегін між сортувальними вузлами, коли між скануваннями минає доба й більше;</li>
                  <li>технічні перебої на боці офіційного сервісу — у такому разі спробуйте перевірити номер тут, ми звертаємося до системи напряму.</li>
                </ul>
                <p className="text-[#333037]/80 leading-relaxed">
                  Насторожитися варто, якщо статус не змінюється понад тиждень для
                  відправлення в межах країни. Тоді є сенс звернутися до контакт-центру
                  Укрпошти за номером 0 800 300 545, маючи під рукою трек-номер.
                </p>
              </div>
            </section>

            {/* Міжнародні */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Міжнародні відправлення: Китай, Європа, США
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Замовлення з закордонних майданчиків рідко їдуть навпростець. Посилка
                  з Китаю може мати номер із європейським кодом країни, бо проходила
                  через тамтешній сортувальний вузол — це нормально й не означає помилки.
                  Через це шлях виходить довшим, ніж очікує покупець.
                </p>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  На тривалість впливають спосіб перевезення, черга на митниці та
                  швидкість пошти країни призначення. Авіадоставка помітно швидша
                  за наземну чи морську, але саме митний етап найчастіше додає
                  непередбачувані дні.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Якщо ви замовляли на популярних майданчиках, деталі щодо їхніх номерів
                  і термінів зібрані на сторінці{' '}
                  <Link href="/stores/aliexpress" className="text-blue-600 hover:underline">
                    відстеження замовлень AliExpress
                  </Link>.
                </p>
              </div>
            </section>

            {/* Терміни */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">Скільки часу йде відправлення</h2>
                <p className="text-[#333037]/80 leading-relaxed">
                  Тривалість залежить від відстані та від того, чи є у населеному пункті
                  власне відділення. У межах міста відправлення зазвичай долає шлях
                  за кілька днів, обласні напрямки потребують близько тижня, а доставка
                  через усю країну до віддалених сіл може розтягнутися до двох тижнів.
                  Для міжнародних посилок передбачити термін складніше — на нього
                  впливають митниця й пошта країни призначення.
                </p>
              </div>
            </section>

            {/* Отримання та зберігання */}
            <section className="mb-12">
              <div className="bg-white rounded-lg shadow-sm p-8">
                <h2 className="text-2xl font-bold mb-5">
                  Скільки зберігається посилка та як її отримати
                </h2>
                <p className="text-[#333037]/80 leading-relaxed mb-4">
                  Коли відправлення надходить у відділення, одержувачу приходить
                  повідомлення. Для видачі потрібен документ, що посвідчує особу,
                  та номер відправлення або повідомлення. Забрати посилку може й інша
                  людина — за довіреністю чи як член родини, залежно від правил
                  конкретного відділення.
                </p>
                <p className="text-[#333037]/80 leading-relaxed">
                  Відлік часу зберігання починається з моменту, коли відправлення
                  прибуло у відділення видачі. Якщо не забрати його вчасно, посилку
                  спершу переміщують на зберігання, а згодом повертають відправнику —
                  тож зволікати не варто.
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

            {/* Перелінковка */}
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