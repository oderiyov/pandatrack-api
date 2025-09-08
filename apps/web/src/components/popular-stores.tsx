// src/components/popular-stores.tsx
import Link from 'next/link'

const stores = [
  { name: 'AliExpress', slug: 'aliexpress' },
  { name: 'Temu', slug: 'temu' },
  { name: 'Amazon', slug: 'amazon' },
  { name: 'eBay', slug: 'ebay' },
  { name: 'Rozetka', slug: 'rozetka' },
  { name: 'Makeup', slug: 'makeup' },
  { name: 'ASOS', slug: 'asos' },
  { name: 'Shein', slug: 'shein' },
]

export function PopularStores() {
  return (
    <section className="mb-16">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
        🏪 Відстеження з магазинів
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stores.map((store) => (
          <Link
            key={store.slug}
            href={`/stores/${store.slug}`}
            className="bg-[#ebebef] rounded-[20px] p-6 text-center hover:shadow-lg transition-shadow"
          >
            <h3 className="font-medium mb-2">{store.name}</h3>
            <p className="text-sm text-[#333037]/60">Відстежити замовлення</p>
          </Link>
        ))}
      </div>
    </section>
  )
}