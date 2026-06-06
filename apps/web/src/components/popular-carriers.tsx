// src/components/popular-carriers.tsx
import Link from 'next/link'

const carriers = [
  { name: 'Нова Пошта', slug: 'nova-poshta', color: 'bg-blue-100 text-blue-800' },
  { name: 'Укрпошта', slug: 'ukrposhta', color: 'bg-yellow-100 text-yellow-800' },
  { name: 'DHL', slug: 'dhl', color: 'bg-red-100 text-red-800' },
  { name: 'Міст Експрес', slug: 'meest-express', color: 'bg-green-100 text-green-800' },
  { name: 'САТ', slug: 'sat', color: 'bg-purple-100 text-purple-800' },
  { name: 'Делівері', slug: 'delivery-auto', color: 'bg-orange-100 text-orange-800' },
]

export function PopularCarriers() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        🚚 Популярні перевізники в Україні
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {carriers.map((carrier) => (
          <Link
            key={carrier.slug}
            href={`/couriers/${carrier.slug}`}
            className="bg-white rounded-[20px] p-6 text-center hover:shadow-lg transition-shadow"
          >
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-2 ${carrier.color}`}>
              {carrier.name}
            </div>
            <p className="text-sm text-[#333037]/60">Відстежити посилку</p>
          </Link>
        ))}
      </div>
    </section>
  )
}