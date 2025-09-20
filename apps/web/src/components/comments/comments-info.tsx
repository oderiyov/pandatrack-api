// src/components/comments/comments-info.tsx v3.0

'use client';

interface CommentsInfoProps {
  className?: string;
}

export function CommentsInfo({ className = '' }: CommentsInfoProps) {
  return (
    <div className={`comments-info ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-3">
              Правила коментування та корисна інформація
            </h3>
            <div className="text-sm text-blue-800 space-y-2">
              <div>
                <p className="font-medium mb-1">Що вітається:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Питання про відстеження посилок і проблеми з доставкою</li>
                  <li>Досвід з різними перевізниками та поради користувачам</li>
                  <li>Інформація про актуальні телефони служб підтримки</li>
                  <li>Допомога у визначенні перевізника за трек-номером</li>
                </ul>
              </div>
              
              <div>
                <p className="font-medium mb-1">Модерація:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Коментарі проходять автоматичну та ручну перевірку</li>
                  <li>Питання та відповіді схвалюються швидше за інші типи</li>
                  <li>Заборонено спам, рекламу, образи та неправдиву інформацію</li>
                  <li>Коментарі з посиланнями потребують додаткової перевірки</li>
                </ul>
              </div>

              <div className="bg-blue-100 rounded p-2 mt-3">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">⚠️ Важливо:</span> У коментарях відповідають звичайні користувачі, 
                  а не працівники поштових служб. Для офіційної підтримки звертайтеся напряму до служби доставки.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}