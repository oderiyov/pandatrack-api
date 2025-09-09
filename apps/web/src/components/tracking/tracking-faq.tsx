// components/tracking/tracking-faq.tsx
'use client'

import { useState } from 'react'

interface TrackingFAQProps {
  carriers: string[]
  status: string
}

export default function TrackingFAQ({ carriers, status }: TrackingFAQProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0])) // First item open by default

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }

  // Generate dynamic FAQ based on carriers and status
  const generateFAQ = () => {
    const baseFAQ = [
      {
        question: "Як часто оновлюється інформація про відстеження?",
        answer: "Інформація оновлюється кожні 30 хвилин для активних посилок. Деякі перевізники можуть мати затримки в оновленні статусів до 24 годин."
      },
      {
        question: "Що означає статус 'В дорозі'?",
        answer: "Статус 'В дорозі' означає, що посилка покинула склад відправника та прямує до країни призначення. Це може включати транспортування літаком, кораблем або автотранспортом."
      },
      {
        question: "Чому посилка довго не оновлюється?",
        answer: "Причини можуть бути різні: митні процедури, вихідні дні, технічні проблеми у перевізника. Зазвичай оновлення з'являються протягом 3-7 днів."
      }
    ]

    // Add carrier-specific FAQ
    const carrierFAQ = []
    
    if (carriers.some(c => c.toLowerCase().includes('ukr'))) {
      carrierFAQ.push({
        question: "Особливості відстеження Укрпошти",
        answer: "Укрпошта оновлює статуси при проходженні основних логістичних центрів. Міжнародні посилки можуть не відстежуватися 5-14 днів при перетині кордону."
      })
    }

    if (carriers.some(c => c.toLowerCase().includes('nova'))) {
      carrierFAQ.push({
        question: "Як працює відстеження Нової Пошти?",
        answer: "Нова Пошта надає детальне відстеження від моменту прийняття до доставки. Зазвичай статуси оновлюються в реальному часі."
      })
    }

    if (carriers.some(c => c.toLowerCase().includes('china') || c.toLowerCase().includes('cainiao'))) {
      carrierFAQ.push({
        question: "Чому китайські посилки довго не відстежуються?",
        answer: "Посилки з Китаю можуть йти авіа або морським транспортом. Морські відправлення не відстежуються 20-45 днів. Після надходження в Україну відстеження відновлюється."
      })
    }

    // Add status-specific FAQ
    if (status.toLowerCase().includes('митн')) {
      carrierFAQ.push({
        question: "Посилка затримана на митниці - що робити?",
        answer: "Зверніться в митну службу або очікуйте SMS з інструкціями. Зазвичай потрібно надати документи про вартість товару. Терміни: 5-10 робочих днів."
      })
    }

    return [...baseFAQ, ...carrierFAQ]
  }

  const faqItems = generateFAQ()

  return (
    <section className="bg-white rounded-lg shadow-sm p-6 mt-8">
      {/* Schema.org structured data for FAQ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqItems.map(item => ({
              "@type": "Question",
              "name": item.question,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": item.answer
              }
            }))
          })
        }}
      />

      <h2 className="text-xl font-bold mb-6 text-[#333037]">Часті питання</h2>
      
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg">
            <button
              onClick={() => toggleItem(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-[#333037] pr-4">
                {item.question}
              </h3>
              <svg
                className={`w-5 h-5 text-[#333037] transform transition-transform ${
                  openItems.has(index) ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {openItems.has(index) && (
              <div className="px-4 pb-4">
                <p className="text-[#333037]/70 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Contact help */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="bg-[#f0e5d9] rounded-lg p-4">
          <h4 className="font-semibold text-[#333037] mb-2">Не знайшли відповідь?</h4>
          <p className="text-[#333037]/70 text-sm mb-3">
            Напишіть питання в коментарях нижче або ознайомтеся з нашими докладними гайдами:
          </p>
          <div className="flex flex-wrap gap-2">
            <a href="/guides/delivery-statuses" className="text-blue-600 hover:underline text-sm">
              Розшифровка статусів
            </a>
            <a href="/guides/customs-help" className="text-blue-600 hover:underline text-sm">
              Допомога з митницею
            </a>
            <a href="/guides/delivery-times" className="text-blue-600 hover:underline text-sm">
              Терміни доставки
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}