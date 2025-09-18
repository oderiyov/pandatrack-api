// src/components/comments/comment-form.tsx v2.0

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
  placeholder = 'Напишіть ваш коментар...',
  showAuthorFields = true,
  buttonText = 'Коментувати'
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
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
    const savedEmail = localStorage.getItem('pandatrack_author_email');
    
    if (savedName) setAuthorName(savedName);
    if (savedEmail) setAuthorEmail(savedEmail);
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

  const handleAuthorEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorEmail(value);
    
    // Save для наступних коментарів
    if (value.trim()) {
      localStorage.setItem('pandatrack_author_email', value.trim());
    } else {
      localStorage.removeItem('pandatrack_author_email');
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

    // Client-side validation
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

    // Email validation if provided
    if (authorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
      alert('Будь ласка, введіть правильний email або залиште поле порожнім');
      return;
    }

    const typingTime = calculateTypingTime();

    try {
      await onSubmit({
        content: content.trim(),
        authorName: authorName.trim() || undefined,
        authorEmail: authorEmail.trim() || undefined,
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

  const isFormValid = content.trim().length >= 3 && content.length <= 3000;

  return (
    <form onSubmit={handleSubmit} className={`comment-form ${className}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
        {/* Author fields */}
        {showAuthorFields && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <input
                type="text"
                placeholder="Ваше ім'я (опціонально)"
                value={authorName}
                onChange={handleAuthorNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
                disabled={submitting}
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Ваш email (не публікується)"
                value={authorEmail}
                onChange={handleAuthorEmailChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={255}
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {/* Content textarea */}
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

        {/* Form actions */}
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500 space-y-1">
            <p>Коментарі проходять модерацію</p>
            {typingAnalytics.startTime && content.length > 10 && (
              <p>
                Час набору: {calculateTypingTime()}с, натискання: {typingAnalytics.keystrokes}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={submitting || !isFormValid}
            className={`
              px-6 py-2 rounded-md font-medium text-white transition-colors
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
      </div>

      {/* Usage guidelines */}
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