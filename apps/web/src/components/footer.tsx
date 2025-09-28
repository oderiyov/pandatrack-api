// src/components/footer.tsx
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Популярні перевізники */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Популярні перевізники</h3>
            <ul className="space-y-2">
              <li><Link href="/couriers/nova-poshta" className="text-[#333037]/60 hover:text-blue-600">Нова Пошта</Link></li>
              <li><Link href="/couriers/ukrposhta" className="text-[#333037]/60 hover:text-blue-600">Укрпошта</Link></li>
              <li><Link href="/couriers/dhl" className="text-[#333037]/60 hover:text-blue-600">DHL</Link></li>
              <li><Link href="/couriers/meest-express" className="text-[#333037]/60 hover:text-blue-600">Міст Експрес</Link></li>
              <li><Link href="/couriers/sat" className="text-[#333037]/60 hover:text-blue-600">САТ</Link></li>
              <li><Link href="/couriers/delivery-auto" className="text-[#333037]/60 hover:text-blue-600">Делівері</Link></li>
            </ul>
          </div>

          {/* Популярні магазини */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Популярні магазини</h3>
            <ul className="space-y-2">
              <li><Link href="/stores/aliexpress" className="text-[#333037]/60 hover:text-blue-600">AliExpress</Link></li>
            </ul>
          </div>

          {/* Промокоди */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Промокоди</h3>
            <ul className="space-y-2">
              <li><Link href="/promocodes/aliexpress" className="text-[#333037]/60 hover:text-blue-600">AliExpress</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-[#333037]/60">
            © 2025 PandaTrack. Всі права захищені | 
            help@pandatrack.com.ua
          </p>
        </div>
      </div>
    </footer>
  )
}