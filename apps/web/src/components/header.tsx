// src/components/header.tsx
import Link from 'next/link'

export function Header() {
  return (
    <header className="bg-[#f0e5d9] border-b border-[#f0e5d9]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-[#333037]">
            PandaTrack
          </Link>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/couriers" className="text-[#333037] hover:text-blue-600 transition-colors">
              Перевізники
            </Link>
            <Link href="/stores" className="text-[#333037] hover:text-blue-600 transition-colors">
              Магазини
            </Link>
            <Link href="/guides" className="text-[#333037] hover:text-blue-600 transition-colors">
              Довідники
            </Link>
            <Link href="/business" className="text-[#333037] hover:text-blue-600 transition-colors">
              Для бізнесу
            </Link>
          </nav>
          
          {/* Mobile menu button */}
          <button className="md:hidden p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}