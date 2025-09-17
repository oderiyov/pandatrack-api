// src/components/comments/comment-form.tsx
'use client';

import { useState, useRef } from 'react';

interface CommentFormProps {
  onSubmit: (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
  }) => Promise<void>;
  submitting: boolean;
  className?: string;
  parentId?: string;
  placeholder?: string;
  showAuthorFields?: boolean;
  buttonText?: string;
}

export function CommentForm({
  onSubmit,
  submitting,
  className = '',
  parentId,
  placeholder = 'Напишіть ваш коментар...',
  showAuthorFields = true,
  buttonText = 'Коментувати'
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [typingStartTime, setTypingStartTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);

    // Відслідковуємо час початку набору для антиспам
    if (!typingStartTime && value.length === 1) {
      setTypingStartTime(Date.now());
    }

    // Автоматично змінюємо висоту textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Будь ласка, напишіть коментар');
      return;
    }

    if (content.length < 3) {
      alert('Коментар має містити принаймні 3 символи');
      return;
    }

    if (content.length > 3000) {
      alert('Коментар занадто довгий (максимум 3000 символів)');
      return;
    }

    const typingTime = typingStartTime ? Math.floor((Date.now() - typingStartTime) / 1000) : undefined;

    try {
      await onSubmit({
        content: content.trim(),
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
        parentId,
        ...(typingTime && { typingTime })
      });

      // Очищуємо форму після успішної відправки
      setContent('');
      setAuthorName('');
      setAuthorEmail('');
      setTypingStartTime(null);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

    } catch (error) {
      // Помилка обробляється в батьківському компоненті
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`comment-form ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Поля автора (опціонально) */}
        {showAuthorFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Ваше ім'я (опціонально)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                disabled={submitting}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Ваш email (опціонально, не публікується)"
                value={authorEmail}
                onChange={(e) => setAuthorEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={255}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {/* Текстове поле для коментаря */}
        <div>
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={handleContentChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            maxLength={3000}
            disabled={submitting}
            style={{ minHeight: '80px', maxHeight: '200px' }}
          />
          
          {/* Лічильник символів */}
          <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
            <span>
              {content.length}/3000 символів
            </span>
            {content.length > 2500 && (
              <span className="text-orange-600">
                Залишилось: {3000 - content.length}
              </span>
            )}
          </div>
        </div>

        {/* Кнопки */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Коментарі проходять модерацію
          </div>
          
          <button
            type="submit"
            disabled={submitting || !content.trim() || content.length < 3}
            className={`
              px-6 py-2 rounded-md font-medium text-white transition-colors
              ${submitting || !content.trim() || content.length < 3
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              }
            `}
          >
            {submitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Відправка...
              </span>
            ) : buttonText}
          </button>
        </div>
      </div>

      {/* Правила коментування */}
      <div className="mt-3 text-xs text-gray-500 leading-relaxed">
        Коментуючи, ви погоджуєтеся з правилами використання. 
        Забороняється спам, реклама та образливі коментарі. 
        Коментарі з посиланнями проходять додаткову модерацію.
      </div>
    </form>
  );
}