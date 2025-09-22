// src/components/comments/comment-form.tsx v8.1 - ALL ESLint & TypeScript FIXES
// ВИПРАВЛЕНО: TypeScript any types + React unescaped entities + unused vars + index signatures

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CommentFormProps {
  onSubmit: (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
    typingTime?: number;
    clientInfo?: Record<string, unknown>;
  }) => Promise<void>;
  submitting: boolean;
  className?: string;
  parentId?: string;
  placeholder?: string;
  showAuthorFields?: boolean;
  buttonText?: string;
  showAdvancedFeatures?: boolean;
  disabled?: boolean;
  maxLength?: number;
  minLength?: number;
  autoFocus?: boolean;
  language?: 'uk' | 'en' | 'ru';
}

interface TypingAnalytics {
  startTime: number | null;
  keystrokes: number;
  pauses: number;
  longestPause: number;
  lastKeystroke: number;
  backspaces: number;
  wordsTyped: number;
  averageWPM: number;
}

interface ClientInfo {
  userAgent: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
    downlink: number;
  };
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

// Enhanced helpful hints на основі контент аналізу
const getHelpfulHints = (content: string, language: 'uk' | 'en' | 'ru' = 'uk'): string[] => {
  const hints: string[] = [];
  
  const messages = {
    uk: {
      links: '💡 Коментарі з посиланнями проходять додаткову перевірку',
      caps: '💡 Уникайте великих букв - це може виглядати як спам',
      short: '💡 Детальніший коментар буде кориснішим для інших',
      question: '💡 Питання зазвичай швидко схвалюються',
      long: '💡 Довгий коментар - розділіть на абзаци для кращого читання',
      spam: '⚠️ Уникайте повторень та рекламних фраз',
      emoji: '😊 Емоджі роблять коментар більш живим',
      experience: '✨ Поділіться власним досвідом - це найцінніший контент'
    },
    en: {
      links: '💡 Comments with links require additional verification',
      caps: '💡 Avoid using all caps - it may look like spam',
      short: '💡 More detailed comments are more helpful',
      question: '💡 Questions are usually approved quickly',
      long: '💡 Long comment - split into paragraphs for better readability',
      spam: '⚠️ Avoid repetitions and promotional phrases',
      emoji: '😊 Emojis make comments more engaging',
      experience: '✨ Share your own experience - it\'s the most valuable content'
    },
    ru: {
      links: '💡 Комментарии со ссылками проходят дополнительную проверку',
      caps: '💡 Избегайте заглавных букв - это может выглядеть как спам',
      short: '💡 Подробный комментарий будет полезнее для других',
      question: '💡 Вопросы обычно быстро одобряются',
      long: '💡 Длинный комментарий - разделите на абзацы',
      spam: '⚠️ Избегайте повторений и рекламных фраз',
      emoji: '😊 Эмоджи делают комментарий живее',
      experience: '✨ Поделитесь опытом - это самый ценный контент'
    }
  };

  const msgs = messages[language];
  
  if (content.length > 0) {
    // URL detection
    if (content.match(/https?:\/\/[^\s]+/gi)) {
      hints.push(msgs.links);
    }
    
    // Too many caps
    if (content.match(/[A-ZА-ЯЁІЇЄҐ]{10,}/g)) {
      hints.push(msgs.caps);
    }
    
    // Very short
    if (content.length < 15 && content.length > 0) {
      hints.push(msgs.short);
    }
    
    // Very long
    if (content.length > 1000) {
      hints.push(msgs.long);
    }
    
    // Question detection
    if (content.includes('?') || content.includes('？')) {
      hints.push(msgs.question);
    }
    
    // Spam-like patterns
    const spamPatterns = [
      /(.)\1{4,}/g, // Repeated characters
      /(купуй|продам|телеграм|скидка)/gi, // Spam words
      /[0-9]{10,}/g // Long numbers
    ];
    
    if (spamPatterns.some(pattern => pattern.test(content))) {
      hints.push(msgs.spam);
    }
    
    // Encourage emojis for engagement
    if (content.length > 100 && !/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content)) {
      hints.push(msgs.emoji);
    }
    
    // Experience sharing detection
    const experienceWords = language === 'uk' 
      ? ['мій досвід', 'я замовляв', 'отримав', 'доставили', 'рекомендую']
      : language === 'en'
      ? ['my experience', 'I ordered', 'received', 'delivered', 'recommend']
      : ['мой опыт', 'заказывал', 'получил', 'доставили', 'рекомендую'];
      
    const hasExperience = experienceWords.some(word => content.toLowerCase().includes(word.toLowerCase()));
    if (!hasExperience && content.length > 50) {
      hints.push(msgs.experience);
    }
  }
  
  return hints.slice(0, 3); // Limit to 3 hints max
};

// Enhanced client info collection
const getClientInfo = (): ClientInfo => {
  if (typeof window === 'undefined') return {} as ClientInfo;
  
  const navWithMemory = navigator as { deviceMemory?: number };
  const navWithConnection = navigator as { 
    connection?: { 
      effectiveType: string; 
      downlink: number; 
    } 
  };
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language || 'uk',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    deviceMemory: navWithMemory.deviceMemory || undefined,
    connection: navWithConnection.connection ? {
      effectiveType: navWithConnection.connection.effectiveType,
      downlink: navWithConnection.connection.downlink
    } : undefined
  };
};

// Enhanced word count and reading time calculation
const getTextStats = (text: string) => {
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  const characters = text.length;
  const charactersNoSpaces = text.replace(/\s/g, '').length;
  const readingTimeMinutes = Math.ceil(words / 200); // Average reading speed
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  
  return {
    words,
    characters,
    charactersNoSpaces,
    sentences,
    readingTimeMinutes
  };
};

export function CommentForm({
  onSubmit,
  submitting,
  className = '',
  parentId,
  placeholder = 'Напишіть свій коментар',
  showAuthorFields = true,
  buttonText = 'Коментувати',
  showAdvancedFeatures = false,
  disabled = false,
  maxLength = 3000,
  minLength = 3,
  autoFocus = false,
  language = 'uk'
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  
  // Enhanced state management
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [estimatedReadTime, setEstimatedReadTime] = useState(0);
  
  const [typingAnalytics, setTypingAnalytics] = useState<TypingAnalytics>({
    startTime: null,
    keystrokes: 0,
    pauses: 0,
    longestPause: 0,
    lastKeystroke: 0,
    backspaces: 0,
    wordsTyped: 0,
    averageWPM: 0
  });
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [helpfulHints, setHelpfulHints] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Enhanced autosave functionality
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const AUTOSAVE_KEY = `pandatrack_draft_${parentId || 'main'}`;

  // Load saved data on mount
  useEffect(() => {
    const savedName = localStorage.getItem('pandatrack_author_name');
    const savedEmail = localStorage.getItem('pandatrack_author_email');
    const savedDraft = localStorage.getItem(AUTOSAVE_KEY);
    
    if (savedName) setAuthorName(savedName);
    if (savedEmail && showAdvancedFeatures) setAuthorEmail(savedEmail);
    
    // Load draft if exists and not older than 1 hour
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        const hourAgo = Date.now() - 60 * 60 * 1000;
        if (draft.timestamp > hourAgo && draft.content.length > minLength) {
          setContent(draft.content);
          setIsDirty(true);
        }
      } catch (error) {
        console.warn('Failed to parse saved draft:', error);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }

    // Auto-focus if requested
    if (autoFocus && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [AUTOSAVE_KEY, minLength, autoFocus, showAdvancedFeatures]);

  // Enhanced autosave with debouncing
  const autosave = useCallback((content: string) => {
    if (content.length > minLength) {
      const draft = {
        content,
        timestamp: Date.now(),
        parentId
      };
      
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft));
        setLastSaved(Date.now());
      } catch (error) {
        console.warn('Failed to autosave draft:', error);
      }
    }
  }, [AUTOSAVE_KEY, minLength, parentId]);

  // Enhanced content change handler
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const now = Date.now();
    const isBackspace = value.length < content.length;
    
    setContent(value);
    setIsDirty(true);

    // Enhanced typing analytics
    setTypingAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      // First keystroke
      if (!prev.startTime && value.length === 1) {
        newAnalytics.startTime = now;
        newAnalytics.lastKeystroke = now;
        newAnalytics.keystrokes = 1;
        newAnalytics.wordsTyped = value.trim().split(/\s+/).length;
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
        
        if (isBackspace) {
          newAnalytics.backspaces = prev.backspaces + 1;
        }
        
        const currentWords = value.trim().split(/\s+/).length;
        newAnalytics.wordsTyped = Math.max(prev.wordsTyped, currentWords);
        
        // Calculate WPM
        if (prev.startTime) {
          const minutesElapsed = (now - prev.startTime) / 60000;
          newAnalytics.averageWPM = Math.round(newAnalytics.wordsTyped / Math.max(minutesElapsed, 0.1));
        }
      }
      
      return newAnalytics;
    });

    // Update text statistics
    const stats = getTextStats(value);
    setWordCount(stats.words);
    setEstimatedReadTime(stats.readingTimeMinutes);

    // Update helpful hints
    setHelpfulHints(getHelpfulHints(value, language));

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 100), 300);
      textareaRef.current.style.height = newHeight + 'px';
    }

    // Autosave with debouncing
    if (value.length > minLength) {
      const timeoutId = setTimeout(() => autosave(value), 2000);
      return () => clearTimeout(timeoutId);
    }
  };

  // Enhanced author fields handlers
  const handleAuthorNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAuthorName(value);
    setIsDirty(true);
    
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
    setIsDirty(true);
    
    if (value.trim() && value.includes('@')) {
      localStorage.setItem('pandatrack_author_email', value.trim());
    } else {
      localStorage.removeItem('pandatrack_author_email');
    }
  };

  // Enhanced typing time calculation
  const calculateTypingTime = (): number | undefined => {
    if (!typingAnalytics.startTime || content.length === 0) return undefined;
    
    const totalTime = (Date.now() - typingAnalytics.startTime) / 1000;
    const pauseTime = typingAnalytics.pauses * 2; // Average pause deduction
    const effectiveTime = Math.max(totalTime - pauseTime, 1);
    
    return Math.floor(effectiveTime);
  };

  // Enhanced form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced client-side validation
    if (!content.trim()) {
      alert('Будь ласка, напишіть коментар');
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    if (content.length < minLength) {
      alert(`Коментар має містити принаймні ${minLength} символи`);
      if (textareaRef.current) textareaRef.current.focus();
      return;
    }

    if (content.length > maxLength) {
      alert(`Коментар занадто довгий (максимум ${maxLength} символів)`);
      if (textareaRef.current) textareaRef.current.focus();
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

    // Email validation if provided
    if (authorEmail.trim() && !authorEmail.includes('@')) {
      alert('Введіть коректну email адресу або залиште поле порожнім');
      return;
    }

    // Enhanced spam detection client-side
    const suspiciousPatterns = [
      /(.)\1{10,}/g, // Too many repeated chars
      /(https?:\/\/[^\s]+.*){3,}/gi, // Too many links
      /[0-9]{15,}/g, // Very long numbers
      /(телеграм|telegram|купуй|продам|скидка|акція){3,}/gi // Multiple spam words
    ];
    
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(content));
    if (isSuspicious && !confirm('Ваш коментар може бути розцінений як спам. Продовжити?')) {
      return;
    }

    const typingTime = calculateTypingTime();
    const clientInfo = showAdvancedFeatures ? getClientInfo() : undefined;

    try {
      await onSubmit({
        content: content.trim(),
        authorName: authorName.trim(),
        authorEmail: authorEmail.trim() || undefined,
        parentId,
        typingTime,
        clientInfo
      });

      // Enhanced form cleanup після успішної відправки
      setContent('');
      setWordCount(0);
      setEstimatedReadTime(0);
      setIsDirty(false);
      setTypingAnalytics({
        startTime: null,
        keystrokes: 0,
        pauses: 0,
        longestPause: 0,
        lastKeystroke: 0,
        backspaces: 0,
        wordsTyped: 0,
        averageWPM: 0
      });
      setHelpfulHints([]);
      
      // Clear draft
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }

      // Success feedback
      if (showAdvancedFeatures) {
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded shadow-lg z-50';
        successMessage.textContent = 'Коментар відправлено!';
        document.body.appendChild(successMessage);
        setTimeout(() => document.body.removeChild(successMessage), 3000);
      }

      // Don't clear author info - user might want to comment again

    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling в батьківському компоненті
    }
  };

  // Keyboard shortcuts handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (isFormValid) {
        handleSubmit(e as React.FormEvent);
      }
    }
    
    // Ctrl/Cmd + S to save draft
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      autosave(content);
    }

    // Escape to clear form
    if (e.key === 'Escape' && e.shiftKey) {
      if (confirm('Очистити форму?')) {
        setContent('');
        setIsDirty(false);
        localStorage.removeItem(AUTOSAVE_KEY);
      }
    }
  };

  // Enhanced form validation
  const isFormValid = content.trim().length >= minLength && 
                      content.length <= maxLength && 
                      authorName.trim().length >= 2 &&
                      (!authorEmail.trim() || authorEmail.includes('@'));

  // Clear draft handler
  const clearDraft = () => {
    if (confirm('Видалити збережений чернетка?')) {
      localStorage.removeItem(AUTOSAVE_KEY);
      setLastSaved(null);
      setContent('');
      setIsDirty(false);
    }
  };

  // Toggle preview mode
  const togglePreview = () => {
    setShowPreview(!showPreview);
  };

  // Enhanced emoji picker (simple implementation)
  const commonEmojis = ['😊', '👍', '❤️', '😅', '🤔', '👌', '😭', '🔥', '💯', '🙏'];
  
  const insertEmoji = (emoji: string) => {
    const newContent = content + emoji;
    setContent(newContent);
    setShowEmojiPicker(false);
    
    // Focus back to textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <form 
      ref={formRef}
      onSubmit={handleSubmit} 
      className={`comment-form ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Enhanced form container */}
      <div className="bg-white border border-gray-300 rounded-lg p-4 space-y-4 shadow-sm relative">
        
        {/* Advanced features toolbar */}
        {showAdvancedFeatures && (
          <div className="flex items-center justify-between text-xs text-gray-500 border-b border-gray-200 pb-2">
            <div className="flex items-center gap-4">
              <span>Слів: {wordCount}</span>
              <span>Читання: ~{estimatedReadTime}хв</span>
              {typingAnalytics.averageWPM > 0 && (
                <span>Швидкість: {typingAnalytics.averageWPM} сл/хв</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {lastSaved && (
                <span className="text-green-600">
                  Збережено {new Date(lastSaved).toLocaleTimeString()}
                </span>
              )}
              {isDirty && (
                <button
                  type="button"
                  onClick={clearDraft}
                  className="text-red-500 hover:text-red-700"
                  title="Очистити чернетку"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {/* Main content area */}
        <div className="relative">
          {/* Preview mode */}
          {showPreview ? (
            <div className="min-h-[100px] max-h-[300px] overflow-y-auto p-3 bg-gray-50 rounded border prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap">{content || 'Попередній перегляд...'}</div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                ref={textareaRef}
                placeholder={placeholder}
                value={content}
                onChange={handleContentChange}
                rows={4}
                className={`w-full px-0 py-2 border-none outline-none resize-none text-gray-900 placeholder-gray-500 focus:ring-0 ${
                  disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                }`}
                maxLength={maxLength}
                minLength={minLength}
                disabled={submitting || disabled}
                style={{ minHeight: '100px', maxHeight: '300px' }}
                aria-label="Текст коментаря"
              />
              
              {/* Enhanced toolbar */}
              {showAdvancedFeatures && (
                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  {/* Emoji picker */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="p-1 text-gray-400 hover:text-gray-600 rounded"
                      title="Додати емоджі"
                    >
                      😊
                    </button>
                    
                    {showEmojiPicker && (
                      <div className="absolute bottom-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-10">
                        {commonEmojis.map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => insertEmoji(emoji)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Preview toggle */}
                  <button
                    type="button"
                    onClick={togglePreview}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded text-xs"
                    title="Попередній перегляд"
                  >
                    👁
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Enhanced character counter */}
          <div className="flex justify-between items-center mt-2 text-sm">
            <div className="flex items-center gap-4 text-gray-500">
              <span>
                {content.length}/{maxLength} символів
              </span>
              
              {showAdvancedFeatures && wordCount > 0 && (
                <>
                  <span>•</span>
                  <span>{wordCount} слів</span>
                </>
              )}
            </div>
            
            {content.length > maxLength * 0.8 && (
              <span className={`text-sm ${
                content.length > maxLength * 0.95 ? 'text-red-600' : 'text-orange-600'
              }`}>
                Залишилось: {maxLength - content.length}
              </span>
            )}
          </div>
        </div>

        {/* Enhanced author fields */}
        {showAuthorFields && (
          <div className="space-y-3 pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Name field */}
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Введіть ваше ім&apos;я *"
                  value={authorName}
                  onChange={handleAuthorNameChange}
                  className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                    disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                  }`}
                  maxLength={100}
                  disabled={submitting || disabled}
                  required
                  aria-label="Ім'я автора"
                />
                {authorName.trim().length > 0 && authorName.trim().length < 2 && (
                  <p className="text-red-500 text-xs mt-1">Ім&apos;я має містити принаймні 2 символи</p>
                )}
              </div>
              
              {/* Email field (advanced features only) */}
              {showAdvancedFeatures && (
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Email (опціонально)"
                    value={authorEmail}
                    onChange={handleAuthorEmailChange}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                      disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                    maxLength={255}
                    disabled={submitting || disabled}
                    aria-label="Email автора"
                  />
                  {authorEmail.trim().length > 0 && !authorEmail.includes('@') && (
                    <p className="text-red-500 text-xs mt-1">Введіть коректну email адресу</p>
                  )}
                </div>
              )}
              
              {/* Enhanced submit button */}
              <button
                type="submit"
                disabled={submitting || !isFormValid || disabled}
                className={`
                  px-6 py-2 rounded-md font-medium text-white text-sm transition-all duration-200 whitespace-nowrap flex items-center gap-2
                  ${submitting || !isFormValid || disabled
                    ? 'bg-gray-400 cursor-not-allowed transform scale-95' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105 active:scale-95'
                  }
                `}
                aria-label={buttonText}
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Відправка...</span>
                  </>
                ) : (
                  <>
                    <span>{buttonText}</span>
                    {showAdvancedFeatures && (
                      <kbd className="text-xs opacity-75">Ctrl+↵</kbd>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Enhanced helpful hints */}
        {helpfulHints.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <div className="space-y-1">
              {helpfulHints.map((hint, index) => (
                <p key={index} className="text-sm text-blue-700 flex items-start gap-2">
                  <span className="flex-shrink-0">{hint}</span>
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Enhanced development debug info */}
        {(process.env.NODE_ENV === 'development' || showAdvancedFeatures) && typingAnalytics.startTime && content.length > 10 && (
          <details className="text-xs text-gray-500 border-t border-gray-200 pt-2">
            <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>Час набору: {calculateTypingTime()}с</div>
              <div>Натискання: {typingAnalytics.keystrokes}</div>
              <div>Паузи: {typingAnalytics.pauses}</div>
              <div>Backspace: {typingAnalytics.backspaces}</div>
              <div>WPM: {typingAnalytics.averageWPM}</div>
              <div>Слів набрано: {typingAnalytics.wordsTyped}</div>
            </div>
          </details>
        )}
      </div>

      {/* Enhanced usage guidelines */}
      <div className="mt-3 text-xs text-gray-500 leading-relaxed">
        Коментуючи, ви погоджуєтеся з правилами використання. 
        Забороняється спам, реклама та образливі коментарі. 
        Коментарі з посиланнями проходять додаткову модерацію.
        
        {parentId && (
          <span className="block mt-1">
            Відповіді зазвичай схвалюються швидше.
          </span>
        )}
        
        {showAdvancedFeatures && (
          <div className="mt-2 flex flex-wrap gap-4 text-xs">
            <span><kbd>Ctrl+Enter</kbd> відправити</span>
            <span><kbd>Ctrl+S</kbd> зберегти</span>
            <span><kbd>Shift+Esc</kbd> очистити</span>
          </div>
        )}
        
        {isDirty && lastSaved && (
          <div className="mt-1 text-green-600">
            Чернетка збережена автоматично
          </div>
        )}
      </div>

      {/* Enhanced click outside handler для emoji picker */}
      {showEmojiPicker && (
        <div 
          className="fixed inset-0 z-5"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </form>
  );
}