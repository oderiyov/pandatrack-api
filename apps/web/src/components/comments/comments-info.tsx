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

        {/* Важливе застереження */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mt-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="h-5 w-5 text-yellow-400 flex items-center justify-center">
                <span className="text-lg">⚠️</span>
              </div>
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
            <strong>Наші контакти:</strong> {' '}
            <a href="mailto:help@pandatrack.com.ua" className="hover:underline">
              help@pandatrack.com.ua
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}