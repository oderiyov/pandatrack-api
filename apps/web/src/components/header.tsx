// components/header.tsx - З функціональним мобільним меню
'use client'

import { useState } from 'react'
import Link from 'next/link'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className="bg-[#f0e5d9] border-b border-[#f0e5d9] relative">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-2xl font-bold text-[#333037]" onClick={closeMobileMenu}>
            [ ПандаТрек ]
          </Link>
          
          {/* Desktop Navigation */}
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
            <Link href="/promocodes" className="text-[#333037] hover:text-blue-600 transition-colors">
              Промокоди
            </Link>
          </nav>
          
          {/* Mobile menu button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-[#333037]/10 transition-colors"
            onClick={toggleMobileMenu}
            aria-label="Відкрити меню"
            aria-expanded={isMobileMenuOpen}
          >
            <svg 
              className={`w-6 h-6 transform transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-45' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>
      
      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#f0e5d9] border-t border-[#333037]/10 shadow-lg md:hidden z-50">
          <nav className="container mx-auto px-4 py-4">
            <div className="space-y-4">
              <Link 
                href="/couriers" 
                className="block text-[#333037] hover:text-blue-600 transition-colors py-2 border-b border-[#333037]/10"
                onClick={closeMobileMenu}
              >
                Перевізники
              </Link>
              <Link 
                href="/stores" 
                className="block text-[#333037] hover:text-blue-600 transition-colors py-2 border-b border-[#333037]/10"
                onClick={closeMobileMenu}
              >
                Магазини
              </Link>
              <Link 
                href="/guides" 
                className="block text-[#333037] hover:text-blue-600 transition-colors py-2 border-b border-[#333037]/10"
                onClick={closeMobileMenu}
              >
                Довідники
              </Link>
              <Link 
                href="/promocodes" 
                className="block text-[#333037] hover:text-blue-600 transition-colors py-2"
                onClick={closeMobileMenu}
              >
                Промокоди
              </Link>
            </div>
          </nav>
        </div>
      )}
      
      {/* Backdrop для закриття меню при кліку поза ним */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}
    </header>
  )
}