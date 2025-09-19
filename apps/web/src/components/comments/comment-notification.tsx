// src/components/comments/comment-notification.tsx v1.0
'use client';
/* eslint-disable react-hooks/exhaustive-deps */

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
      
      // Auto-dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [newComment, onDismiss]);

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
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/20 z-40 transition-opacity duration-300"
        onClick={handleDismiss}
      />
      
      {/* Popup - внизу зліва */}
      <div className={`
        fixed bottom-6 left-6 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-out
        ${isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}
      `}>
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          
          {/* Header */}
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-medium">Новий коментар</span>
            </div>
            
            <button
              onClick={handleDismiss}
              className="text-white/80 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div 
            onClick={handleClick}
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-medium text-xs">
                  {newComment.authorName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Comment content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-gray-900 text-sm">
                    {newComment.authorName}
                  </span>
                  <span className="text-xs text-gray-500">
                    щойно
                  </span>
                </div>
                
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-2">
                  {newComment.content}
                </p>
              </div>
            </div>

            {/* Action hint */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Натисніть, щоб перейти до коментаря
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