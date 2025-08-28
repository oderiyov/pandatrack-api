export default function PlaceholderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-6">
        {/* Logo */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🐼 <span className="text-indigo-600">PandaTrack</span>
          </h1>
          <p className="text-xl text-gray-600">
            Відстеження посилок в Україні
          </p>
        </div>

        {/* Status */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4 mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Сайт в розробці
          </h2>
          
          <p className="text-gray-600 mb-6 leading-relaxed">
            Ми працюємо над запуском нового сервісу для відстеження посилок 
            з усіх популярних служб доставки України.
          </p>

          <div className="space-y-2 text-sm text-gray-500">
            <p>✓ Нова Пошта</p>
            <p>✓ Укрпошта</p>
            <p>✓ Meest Express</p>
            <p>✓ DHL, FedEx</p>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-4">
            Маєте питання? Напишіть нам:
          </p>
          <a 
            href="mailto:info@pandatrack.com.ua" 
            className="inline-flex items-center text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            info@pandatrack.com.ua
          </a>
        </div>

        {/* Progress */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Прогрес розробки</span>
            <span className="text-sm font-medium text-indigo-600">75%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '75%' }}></div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Очікуваний запуск: вересень 2025
          </p>
        </div>
      </div>
    </div>
  )
}