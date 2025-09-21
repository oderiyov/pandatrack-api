// src/components/comments/comment-notification.tsx v2.0
// ВИПРАВЛЕНО: сірий дизайн, тільки "Новий коментар"

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
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (newComment) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-dismiss after 6 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [newComment]);

  const handleDismiss = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 300); // Animation duration
  };

  const handleClick = () => {
    if (newComment) {
      onNavigateToComment(newComment.id);
      handleDismiss();
    }
  };

  if (!isVisible || !newComment) return null;

  return (
    <>
      {/* Popup - внизу зліва з сірим дизайном */}
      <div className={`
        fixed bottom-6 left-6 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>
        <div className="bg-gray-100 rounded-lg shadow-lg border border-gray-300 overflow-hidden cursor-pointer hover:shadow-xl transition-shadow" onClick={handleClick}>
          
          {/* Header - сірий замість синього */}
          <div className="bg-gray-200 text-gray-800 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">Новий коментар</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDismiss();
              }}
              className="text-gray-600 hover:text-gray-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content - спрощений без показу тексту коментаря */}
          <div className="p-4">
            <div className="flex items-center space-x-3">
              {/* Сірий аватар */}
              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-xs">
                  {newComment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Інформація про коментар */}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">{newComment.authorName}</span> залишив новий коментар
                </div>
                <div className="text-xs text-gray-500">
                  щойно
                </div>
              </div>
            </div>

            {/* Action hint */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Натисніть, щоб переглянути
                </span>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}