// src/components/comments/comment-notification.tsx v4.1
'use client';

import { useState, useEffect } from 'react';

interface Comment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

interface CommentNotificationProps {
  newComment: Comment | null;
  onNavigateToComment: (commentId: string) => void;
  onDismiss: () => void;
}

export function CommentNotification({ 
  newComment, 
  onNavigateToComment, 
  onDismiss 
}: CommentNotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [newCommentsCount, setNewCommentsCount] = useState(0);
  const [allNewComments, setAllNewComments] = useState<Comment[]>([]);

  // Показуємо нотифікацію при новому коментарі
  useEffect(() => {
    if (newComment) {
      // Додаємо новий коментар до списку
      setAllNewComments(prev => {
        // Перевіряємо чи вже є цей коментар
        const exists = prev.some(c => c.id === newComment.id);
        if (exists) return prev;
        
        const updated = [...prev, newComment];
        setNewCommentsCount(updated.length);
        setIsVisible(true);
        return updated;
      });
    }
  }, [newComment]);

  const handleDismiss = () => {
    setIsVisible(false);
    setNewCommentsCount(0);
    setAllNewComments([]);
    onDismiss();
  };

  const handleClick = () => {
    if (allNewComments.length > 0) {
      // Переходимо до найновішого коментаря
      const latestComment = allNewComments[allNewComments.length - 1];
      onNavigateToComment(latestComment.id);
      handleDismiss();
    }
  };

  if (!isVisible || newCommentsCount === 0) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={handleDismiss}
      />

      {/* Notification popup */}
      <div className="fixed bottom-6 left-6 z-50">
        {/* ВИПРАВЛЕНО: 167px width замість 166px */}
        <div 
          className="w-[167px] h-[61px] bg-gray-100 rounded-lg shadow-lg border border-gray-300 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow flex"
          onClick={handleClick}
        >
          {/* Ліва частина - іконка */}
          <div className="w-12 bg-gray-200 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>

          {/* Права частина - СПРОЩЕНИЙ контент */}
          <div className="flex-1 p-2 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <div>
                {/* ВИПРАВЛЕНО: Тільки заголовок, БЕЗ "Натисніть для перегляду" */}
                <div className="text-xs font-medium text-gray-800 leading-tight">
                  {newCommentsCount === 1 ? 'Новий коментар' : 'Нові коментарі'}
                </div>
              </div>
              
              {/* Лічильник нових коментарів */}
              <div className="flex items-center space-x-1">
                <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {newCommentsCount > 9 ? '9+' : newCommentsCount}
                  </span>
                </div>
                
                {/* Кнопка закриття */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                  }}
                  className="w-4 h-4 text-gray-500 hover:text-gray-700 transition-colors flex items-center justify-center"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}