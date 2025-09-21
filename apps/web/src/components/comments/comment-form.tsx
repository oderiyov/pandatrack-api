// src/components/comments/comment-form.tsx v7.0 
// ВИПРАВЛЕНО: завжди розгорнута форма, без collapsible логіки

'use client';

import { useState, useRef, useEffect } from 'react';

interface CommentFormProps {
  onSubmit: (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
    typingTime?: number;
  }) => Promise<void>;
  submitting: boolean;
  className?: string;
  parentId?: string;
  placeholder?: string;
  showAuthorFields?: boolean;
  buttonText?: string;
}

interface TypingAnalytics {
  startTime: number | null;
  keystrokes: number;
  pauses: number;
  longestPause: number;
  lastKeystroke: number;
}

// Helpful hints based на content analysis
const getHelpfulHints = (content: string): string[] => {
  const hints: string[] = [];
  
  if (content.length > 0) {
    // URL detection
    if (content.match(/https?:\/\/[^\s]+/gi)) {
      hints.push('💡 Коментарі з посиланнями проходять додаткову перевірку');
    }
    
    // Too many caps
    if (content.match(/[A-ZА-Я]{10,}/g)) {
      hints.push('💡 Уникайте великих букв - це може виглядати як спам');
    }
    
    // Very short
    if (content.length < 10 && content.length > 0) {
      hints.push('💡 Детальніший коментар буде кориснішим для інших');
    }
    
    // Question detection
    if (content.includes('?')) {
      hints.push('💡 Питання зазвичай швидко схвалюються');
    }
  }
  
  return hints;
};

export function CommentForm({
  onSubmit,
  submitting,
  className = '',
  parentId,
  placeholder = 'Напишіть свій коментар',
  showAuthorFields = true,
  buttonText = 'Коментувати'
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  
  const [typingAnalytics, setTypingAnalytics] = useState<TypingAnalytics>({
    startTime: null,
    keystrokes: 0,
    pauses: 0,
    longestPause: 0,
    lastKeystroke: 0
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [helpfulHints, setHelpfulHints] = useState<string[]>([]);

  // Load saved author info
  useEffect(() => {
    const savedName = localStorage.getItem('pandatrack_author_name');
    if (savedName) setAuthorName(savedName);
  }, []);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const now = Date.now();
    
    setContent(value);

    // Enhanced typing analytics
    setTypingAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      // First keystroke
      if (!prev.startTime && value.length === 1) {
        newAnalytics.startTime = now;
        newAnalytics.lastKeystroke = now;
        newAnalytics.keystrokes = 1;
      }
      // Subsequent keystrokes  
      else if (prev.startTime && value.length > 0) {
        const pauseDuration = now - prev.lastKeystroke;
        
        // Count significant pauses (>2 seconds)
        if (pauseDuration > 2000) {
          newAnalytics.pauses = prev.pauses + 1;
          newAnalytics.longestPause = Math.max(prev.longestPause, pauseDuration);
        }
        
        newAnalytics.keystrokes = prev.keystrokes + 1;
        newAnalytics.lastKeystroke = now;
      }
      
      return newAnalytics;
    });

    // Update helpful hints
    setHelpfulHints(getHelpfulHints(value));

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  };

  const handleAuthorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorName(value);
    
    // Save для наступних коментарів
    if (value.trim()) {
      localStorage.setItem('pandatrack_author_name', value.trim());
    } else {
      localStorage.removeItem('pandatrack_author_name');
    }
  };

  const calculateTypingTime = (): number | undefined => {
    if (!typingAnalytics.startTime || content.length === 0) return undefined;
    
    const totalTime = (Date.now() - typingAnalytics.startTime) / 1000;
    
    // Subtract long pauses (user was away)
    const pauseTime = typingAnalytics.pauses * 2; // Average pause deduction
    const effectiveTime = Math.max(totalTime - pauseTime, 1);
    
    return Math.floor(effectiveTime);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation з обов'язковим ім'ям
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

    // Обов'язкове поле імені
    if (!authorName.trim()) {
      alert('Будь ласка, введіть ваше ім\'я');
      return;
    }

    if (authorName.trim().length < 2) {
      alert('Ім\'я має містити принаймні 2 символи');
      return;
    }

    const typingTime = calculateTypingTime();

    try {
      await onSubmit({
        content: content.trim(),
        authorName: authorName.trim(),
        authorEmail: undefined, // ВИПРАВЛЕНО: email завжди undefined
        parentId,
        typingTime
      });

      // Clear form після успішної відправки
      setContent('');
      setTypingAnalytics({
        startTime: null,
        keystrokes: 0,
        pauses: 0,
        longestPause: 0,
        lastKeystroke: 0
      });
      setHelpfulHints([]);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Don't clear author info - user might want to comment again

    } catch {
      // Error is handled in parent component
    }
  };

  // Перевірка валідності форми з обов'язковим ім'ям
  const isFormValid = content.trim().length >= 3 && content.length <= 3000 && authorName.trim().length >= 2;

  return (
    <form onSubmit={handleSubmit} className={`comment-form ${className}`}>
      {/* ВИПРАВЛЕНО: Завжди розгорнута форма */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-4 shadow-sm">
        {/* Content textarea */}
        <div>
          <textarea
            ref={textareaRef}
            placeholder={placeholder}
            value={content}
            onChange={handleContentChange}
            rows={4}
            className="w-full px-0 py-2 border-none outline-none resize-none text-gray-900 placeholder-gray-500 focus:ring-0"
            maxLength={3000}
            disabled={submitting}
            style={{ minHeight: '100px', maxHeight: '200px' }}
          />
          
          {/* Character counter */}
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

        {/* ВИПРАВЛЕНО: Тільки поле імені, без email */}
        {showAuthorFields && (
          <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-gray-200">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Ваше ім'я *"
                value={authorName}
                onChange={handleAuthorNameChange}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                maxLength={100}
                disabled={submitting}
                required
              />
              {authorName.trim().length > 0 && authorName.trim().length < 2 && (
                <p className="text-red-500 text-xs mt-1">Ім\'я має містити принаймні 2 символи</p>
              )}
            </div>
            
            {/* Кнопка */}
            <button
              type="submit"
              disabled={submitting || !isFormValid}
              className={`
                px-6 py-2 rounded-md font-medium text-white text-sm transition-colors whitespace-nowrap
                ${submitting || !isFormValid
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
        )}

        {/* Helpful hints */}
        {helpfulHints.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="space-y-1">
              {helpfulHints.map((hint, index) => (
                <p key={index} className="text-sm text-blue-700">
                  {hint}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Debug info */}
        {process.env.NODE_ENV === 'development' && typingAnalytics.startTime && content.length > 10 && (
          <div className="text-xs text-gray-500">
            Час набору: {calculateTypingTime()}с, натискання: {typingAnalytics.keystrokes}
          </div>
        )}
      </div>

      {/* ВИПРАВЛЕНО: Usage guidelines завжди показуються */}
      <div className="mt-3 text-xs text-gray-500 leading-relaxed">
        Коментуючи, ви погоджуєтеся з правилами використання. 
        Забороняється спам, реклама та образливі коментарі. 
        Коментарі з посиланнями проходять додаткову модерацію.
        {parentId && (
          <span className="block mt-1">
            Відповіді зазвичай схвалюються швидше.
          </span>
        )}
      </div>
    </form>
  );
}