// src/app/couriers/ukrposhta/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { TrackingForm } from '@/components/tracking-form'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { PandaTrackComments } from '@/components/comments/pandatrack-comments'

export const metadata: Metadata = {
  title: 'Укрпошта відстежити посилку за номером — трекінг Укрпошти онлайн',
  description: 'Відстеження посилок Укрпошти за номером накладної онлайн. Введіть 13-значний трек-номер і дізнайтесь де ваша посилка. Швидко, безкоштовно, українською.',
  keywords: ['укрпошта відстежити', 'відстеження посилки укрпошта', 'укрпошта трекінг', 'відстежити посилку укрпошта за номером', 'укрпошта відстеження посилок'],
  alternates: {
    canonical: '/couriers/ukrposhta',
  },
  openGraph: {
    title: 'Укрпошта відстежити посилку за номером — трекінг Укрпошти',
    description: 'Відстеження посилок Укрпошти за номером накладної онлайн. Швидко та безкоштовно.',
    url: 'https://pandatrack.com.ua/couriers/ukrposhta',
    type: 'website',
    locale: 'uk_UA',
  },
}

// FAQ дані — на основі реальних пошукових запитів користувачів
const faqItems = [
  {
    question: 'Як відстежити посилку Укрпошти за номером?',
    answer: 'Введіть 13-значний трек-номер у поле відстеження вгорі сторінки та натисніть «Відстежити». За кілька секунд ви побачите поточний статус і весь шлях посилки — від приймання до вручення.',
  },
  {
    question: 'Скільки цифр у трек-номері Укрпошти?',
    answer: 'Внутрішні відправлення Укрпошти мають номер із 13 цифр (наприклад, 0500123456789). Міжнародні відправлення можуть мати формат із літер і цифр — наприклад RA123456789UA або RK123456789LV.',
  },
  {
    question: 'Чи можна відстежити посилку Укрпошти за номером телефону?',
    answer: 'Ні, Укрпошта не дозволяє відстежувати відправлення за номером телефону. Пошук доступний лише за трек-номером із чека або підтвердження замовлення. За номером телефону можна звернутися лише на гарячу лінію Укрпошти 0 800 300 545.',
  },
  {
    question: 'Чи можна знайти посилку Укрпошти за прізвищем?',
    answer: 'Ні, відстеження за прізвищем отримувача чи відправника недоступне. Укрпошта щодня обробляє тисячі відправлень, тому єдиний спосіб пошуку — унікальний трек-номер.',
  },
  {
    question: 'Скільки йде посилка Укрпоштою по Україні?',
    answer: 'Терміни залежать від регіону: по місту — 3-4 дні, по області — до 5 днів, по Україні — до 14 днів. Міжнародні відправлення залежать від місцевої пошти країни призначення.',
  },
  {
    question: 'Скільки зберігається посилка у відділенні Укрпошти?',
    answer: 'Посилка безкоштовно зберігається у відділенні протягом 5 робочих днів. Далі може нараховуватися плата за зберігання. Радимо забирати відправлення одразу після отримання повідомлення.',
  },
  {
    question: 'Чому статус посилки Укрпошти довго не оновлюється?',
    answer: 'Причини бувають різні: вихідні дні, митні процедури для міжнародних відправлень, технічні затримки. Для міжнародних посилок Укрпошта бачить рух тільки до передачі місцевій пошті іншої країни.',
  },
]

// JSON-LD structured data для FAQ (Google rich snippets)
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

// Breadcrumb schema
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
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <Header />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="text-sm text-[#333037]/60 mb-6" aria-label="Хлібні крихти">
          <Link href="/" className="hover:text-[#333037]">Головна</Link>
          {' / '}
          <Link href="/couriers" className="hover:text-[#333037]">Перевізники</Link>
          {' / '}
          <span className="text-[#333037]">Укрпошта</span>
        </nav>

        {/* H1 + intro */}
        <div className="flex items-center gap-4 mb-6">
          <Image
            src="/logos/ukrposhta.svg"
            alt="Укрпошта логотип"
            width={56}
            height={56}
            className="rounded"
          />
          <div>
            <h1 className="text-3xl font-bold text-[#333037]">
              Відстеження посилок Укрпошти
            </h1>
            <p className="text-[#333037]/70">
              Введіть трек-номер і дізнайтесь де ваша посилка
            </p>
          </div>
        </div>

        {/* Tracking form — робочий компонент */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <TrackingForm
            placeholder="Введіть 13-значний трек-номер Укрпошти"
          />
        </div>

        {/* Інфо-контент */}
        <article className="bg-white rounded-lg shadow-sm p-6 mb-8 prose prose-sm max-w-none">
          <h2 className="text-2xl font-bold text-[#333037] mb-4">
            Як відстежити посилку Укрпошти за номером
          </h2>
          <p className="text-[#333037]/80 mb-4">
            Щоб відстежити відправлення Укрпошти, введіть трек-номер у поле вище та
            натисніть «Відстежити». PandaTrack покаже актуальний статус посилки українською —
            від приймання у відділенні до вручення одержувачу. Сервіс працює безкоштовно
            та не потребує реєстрації.
          </p>
          <p className="text-[#333037]/80 mb-4">
            Трек-номер внутрішніх відправлень Укрпошти складається з <strong>13 цифр</strong>
            {' '}(наприклад, 0500123456789). Ви знайдете його на чеку, який видають при
            відправленні, або в підтвердженні замовлення з інтернет-магазину.
          </p>

          <h2 className="text-2xl font-bold text-[#333037] mt-8 mb-4">
            Скільки йде посилка Укрпоштою
          </h2>
          <p className="text-[#333037]/80 mb-4">
            Терміни доставки Укрпошти залежать від відстані та населеного пункту:
          </p>
          <ul className="list-disc pl-6 text-[#333037]/80 mb-4 space-y-1">
            <li>по місту — 3-4 дні;</li>
            <li>по області — до 5 днів;</li>
            <li>по Україні — до 14 днів.</li>
          </ul>
          <p className="text-[#333037]/80 mb-4">
            Для міжнародних відправлень Укрпошта відстежує рух посилки лише до передачі
            місцевій поштовій службі країни призначення. Далі статус оновлює пошта тієї країни.
          </p>

          <h2 className="text-2xl font-bold text-[#333037] mt-8 mb-4">
            Як отримати посилку
          </h2>
          <p className="text-[#333037]/80 mb-4">
            Коли посилка прибуває у ваше відділення, ви отримуєте повідомлення (SMS або в
            застосунку). Для отримання потрібен документ, що посвідчує особу, та трек-номер
            або номер повідомлення. Посилка безкоштовно зберігається у відділенні
            <strong> 5 робочих днів</strong>, далі може нараховуватися плата за зберігання.
          </p>
        </article>

        {/* FAQ — видима частина (та сама що в Schema) */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#333037] mb-6">
            Питання та відповіді
          </h2>
          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <details
                key={index}
                className="border border-gray-200 rounded-lg p-4"
                {...(index === 0 ? { open: true } : {})}
              >
                <summary className="font-semibold text-[#333037] cursor-pointer">
                  {item.question}
                </summary>
                <p className="text-[#333037]/80 mt-3">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Перелінковка на інших перевізників */}
        <section className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-[#333037] mb-4">
            Відстеження інших перевізників
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/couriers/nova-poshta" className="text-blue-600 hover:underline">Нова Пошта</Link>
            <Link href="/couriers/meest-express" className="text-blue-600 hover:underline">Meest</Link>
            <Link href="/couriers/dhl" className="text-blue-600 hover:underline">DHL</Link>
            <Link href="/couriers/sat" className="text-blue-600 hover:underline">SAT</Link>
            <Link href="/couriers/delivery-auto" className="text-blue-600 hover:underline">Delivery Auto</Link>
          </div>
        </section>

        <PandaTrackComments pageId="courier-ukrposhta" />
      </main>

      <Footer />
    </div>
  )
}