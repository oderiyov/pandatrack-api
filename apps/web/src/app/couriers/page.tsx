// src/app/couriers/page.tsx
import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { TrackingForm } from '@/components/tracking-form'

export const metadata: Metadata = {
  title: "Служби доставки та кур'єрські компанії України | PandaTrack",
  description: "Повний список служб доставки, транспортних та кур'єрських компаній України та світу. Відстежити посилку з будь-якого перевізника швидко та безкоштовно.",
  keywords: "служби доставки, кур'єрські компанії, транспортні компанії, відстежити посилку, україна",
  openGraph: {
    title: "Служби доставки та кур'єрські компанії | PandaTrack",
    description: "Повний список українських та міжнародних служб доставки для відстеження посилок",
    type: "website",
    locale: "uk_UA",
  }
}

const ukrainianCarriers = [
  {
    id: 'nova-poshta',
    name: 'Нова Пошта',
    description: 'Найпопулярніша транспортна компанія України з понад 9000 відділень та 11000 поштоматів по всій країні',
    logo: '/logos/nova-poshta.svg',
    url: '/couriers/nova-poshta',
    features: ['9000+ відділень', '11000+ поштоматів', 'Експрес доставка']
  },
  {
    id: 'ukrposhta',
    name: 'Укрпошта',
    description: 'Національний поштовий оператор України, найстаріша служба доставки з найширшою мережею покриття',
    logo: '/logos/ukrposhta.svg',
    url: '/couriers/ukrposhta',
    features: ['Національний оператор', 'Найширше покриття', 'Доступні ціни']
  },
  {
    id: 'meest-express',
    name: 'Міст Експрес',
    description: 'Міжнародна логістична компанія, спеціалізується на доставці між Україною, США, Канадою та Європою',
    logo: '/logos/meest.svg',
    url: '/couriers/meest-express',
    features: ['США-Україна', 'Канада-Україна', '1500+ відділень']
  },
  {
    id: 'sat',
    name: 'SAT',
    description: 'Транспортна компанія з 19-річним досвідом, 150+ міст покриття, власний GPS автопарк',
    logo: '/logos/sat.svg',
    url: '/couriers/sat',
    features: ['19 років досвіду', '150+ міст', 'GPS відстеження']
  },
  {
    id: 'delivery-auto',
    name: 'Delivery Auto',
    description: 'Експрес-доставка по всій Україні з персональним підходом та гнучкими рішеннями',
    logo: '/logos/delivery-auto.svg',
    url: '/couriers/delivery-auto',
    features: ['Персональний підхід', 'Гнучкі рішення', 'Швидка доставка']
  }
]

const internationalCarriers = [
  {
    id: 'dhl',
    name: 'DHL Express',
    description: 'Світовий лідер експрес-доставки, міжнародні перевезення з гарантованими термінами',
    logo: '/logos/dhl.svg',
    url: '/couriers/dhl',
    features: ['Світовий лідер', 'Експрес доставка', 'Гарантовані терміни']
  }
]

function CarrierCard({ carrier }: { carrier: typeof ukrainianCarriers[0] }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4 mb-4">
        <div className="flex-shrink-0">
          <Image
            src={carrier.logo}
            alt={`${carrier.name} логотип`}
            width={48}
            height={48}
            className="rounded-lg"
          />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[#333037] mb-2">{carrier.name}</h3>
          <p className="text-[#333037]/70 text-sm leading-relaxed mb-4">
            {carrier.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {carrier.features.map((feature, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-[#f0e5d9] text-[#333037] text-xs rounded-md"
              >
                {feature}
              </span>
            ))}
          </div>
          <Link
            href={carrier.url}
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            Відстежити посилку
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CouriersPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] text-[#333037] font-sans">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-[#f0e5d9] py-12 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-6 text-[#333037]">
              Служби доставки та кур&apos;єрські компанії
            </h1>
            <p className="text-lg text-[#333037]/70 mb-8 max-w-3xl mx-auto leading-relaxed">
              Повний каталог українських та міжнародних служб доставки. Знайдіть свого перевізника 
              та відстежте посилку швидко і безкоштовно з єдиного сервісу.
            </p>
            
            <TrackingForm />
            
            <p className="text-sm mt-4 text-[#333037]/60">
              Підтримуємо 50+ перевізників з усього світу
            </p>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12">
        {/* Ukrainian Carriers */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            🇺🇦 Українські служби доставки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ukrainianCarriers.map((carrier) => (
              <CarrierCard key={carrier.id} carrier={carrier} />
            ))}
          </div>
        </section>

        {/* International Carriers */}
        <section>
          <h2 className="text-2xl font-bold mb-8 text-[#333037]">
            🌍 Міжнародні служби доставки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {internationalCarriers.map((carrier) => (
              <CarrierCard key={carrier.id} carrier={carrier} />
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  )
}