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
              <li><Link href="/couriers/meest" className="text-[#333037]/60 hover:text-blue-600">Міст Експрес</Link></li>
              <li><Link href="/couriers/sat" className="text-[#333037]/60 hover:text-blue-600">САТ</Link></li>
              <li><Link href="/couriers/delivery-auto" className="text-[#333037]/60 hover:text-blue-600">Делівері</Link></li>
            </ul>
          </div>

          {/* Популярні магазини */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Популярні магазини</h3>
            <ul className="space-y-2">
              <li><Link href="/stores/aliexpress" className="text-[#333037]/60 hover:text-blue-600">AliExpress</Link></li>
              <li><Link href="/stores/temu" className="text-[#333037]/60 hover:text-blue-600">Temu</Link></li>
              <li><Link href="/stores/amazon" className="text-[#333037]/60 hover:text-blue-600">Amazon</Link></li>
              <li><Link href="/stores/ebay" className="text-[#333037]/60 hover:text-blue-600">eBay</Link></li>
              <li><Link href="/stores/shein" className="text-[#333037]/60 hover:text-blue-600">Shein</Link></li>
            </ul>
          </div>

          {/* Довідники */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Довідники</h3>
            <ul className="space-y-2">
              <li><Link href="/guides/tracking-formats" className="text-[#333037]/60 hover:text-blue-600">Формати номерів</Link></li>
              <li><Link href="/guides/delivery-statuses" className="text-[#333037]/60 hover:text-blue-600">Статуси доставки</Link></li>
              <li><Link href="/guides/customs-help" className="text-[#333037]/60 hover:text-blue-600">Митні процедури</Link></li>
              <li><Link href="/guides/delivery-times" className="text-[#333037]/60 hover:text-blue-600">Терміни доставки</Link></li>
            </ul>
          </div>

          {/* Промокоди */}
          <div>
            <h3 className="font-bold mb-4 text-[#333037]">Промокоди</h3>
            <ul className="space-y-2">
              <li><Link href="/promocodes/aliexpress" className="text-[#333037]/60 hover:text-blue-600">AliExpress промокоди</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 text-center">
          <p className="text-[#333037]/60">
            © 2025 PandaTrack. Всі права захищені. | 
            <Link href="/about" className="hover:text-blue-600 ml-2">Про нас</Link> | 
            <Link href="/contact" className="hover:text-blue-600 ml-2">Контакти</Link>
          </p>
        </div>
      </div>
    </footer>
  )
}