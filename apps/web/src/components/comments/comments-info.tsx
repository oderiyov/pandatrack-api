// src/components/comments/comments-info.tsx
'use client';

interface CommentsInfoProps {
  className?: string;
}

export function CommentsInfo({ className = '' }: CommentsInfoProps) {
  return (
    <div className={`comments-info bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="space-y-3 text-sm">
        {/* Головне повідомлення */}
        <div className="font-semibold text-blue-800">
          В коментарях ти можеш запитати про своє відправлення, написати про помилки у відстеженні або свій відгук про поштову службу.
        </div>

        {/* Контакти служб доставки */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
          <div>
            <strong>Укрпошта:</strong><br />
            Тел: 0 800 300 545<br />
            <a href="https://www.facebook.com/ukrposhta" target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:underline">Facebook</a>
          </div>
          <div>
            <strong>Nova Poshta:</strong><br />
            Тел: 0 800 500 609<br />
            <a href="https://novaposhta.ua" target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline">novaposhta.ua</a>
          </div>
        </div>

        {/* Корисна інформація */}
        <div className="space-y-2">
          <div className="text-blue-700">
            <strong>Якщо статус "Відправлення прямує до точки видачі/доставки"</strong> не змінюється протягом тижня, 
            рекомендуємо звернутися до вашого відділення.
          </div>
          
          <div className="text-blue-700">
            <strong>Перевірка на митниці:</strong> {' '}
            <a href="https://cabinet.customs.gov.ua/post" target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:underline">
              cabinet.customs.gov.ua/post
            </a>
          </div>
        </div>

        {/* Відгуки про служби доставки */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-blue-600 font-medium">Відгуки про служби доставки:</span>
          <a href="/couriers/ukrposhta" className="text-blue-600 hover:underline">Укрпошта Відгуки</a>
          <span>|</span>
          <a href="/couriers/nova-poshta" className="text-blue-600 hover:underline">Nova Poshta Відгуки</a>
          <span>|</span>
          <a href="/couriers/meest" className="text-blue-600 hover:underline">Міст Відгуки</a>
        </div>

        {/* Важливе застереження */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 text-sm text-yellow-700">
              <strong>Важливо:</strong> У коментарях відповідають звичайні користувачі, а не працівники поштових служб чи сайту. 
              Для офіційної підтримки звертайтеся напряму до служби доставки.
            </div>
          </div>
        </div>

        {/* Контакти адміністрації */}
        <div className="text-center pt-2 border-t border-blue-200">
          <div className="text-xs text-blue-600">
            <strong>Контакти адміністрації:</strong> {' '}
            <a href="mailto:support@pandatrack.com.ua" className="hover:underline">
              support@pandatrack.com.ua
            </a>
          </div>
          
          {/* Telegram бот лінк (якщо буде) */}
          <div className="text-xs text-blue-600 mt-1">
            <strong>Telegram бот:</strong> {' '}
            <a href="https://t.me/PandaTrackBot" target="_blank" rel="noopener noreferrer" 
               className="hover:underline">
              @PandaTrackBot
            </a> (скоро)
          </div>
        </div>
      </div>
    </div>
  );
}