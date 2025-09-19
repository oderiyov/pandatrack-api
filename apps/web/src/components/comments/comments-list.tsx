// src/components/comments/comments-list.tsx v4.0
// ВИПРАВЛЕНО: mobile верстка, відступи, порядок кнопок, вирівнювання

'use client';

import { useState } from 'react';
import { CommentForm } from './comment-form';

interface Comment {
  id: string;
  pageId: string;
  parentId?: string;
  replyDepth: number;
  authorName: string;
  isAnonymous: boolean;
  content: string;
  voteScore: number;
  replyCount: number;
  createdAt: string;
  replies: Comment[];
  commentType?: string;
}

interface CommentsListProps {
  comments: Comment[];
  onVote: (commentId: string, voteType: number) => Promise<void>;
  onFlag: (commentId: string, reason: string) => Promise<void>;
  onReply: (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
  }) => Promise<void>;
  maxRepliesDepth?: number;
  submittingReply?: boolean;
}

// Функція для формату "щойно", "1 година тому", "2 дні тому"
const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const commentDate = new Date(dateString);
  const diffMs = now.getTime() - commentDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'щойно';
  if (diffMinutes < 60) return `${diffMinutes} хв${diffMinutes === 1 ? '' : diffMinutes < 5 ? 'и' : ''} тому`;
  if (diffHours < 24) return `${diffHours} год${diffHours === 1 ? 'ину' : diffHours < 5 ? 'ини' : 'ин'} тому`;
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дні' : 'днів'} тому`;
  if (diffWeeks < 4) return `${diffWeeks} тижд${diffWeeks === 1 ? 'ень' : diffWeeks < 5 ? 'ні' : 'нів'} тому`;
  if (diffMonths < 12) return `${diffMonths} міс${diffMonths === 1 ? 'яць' : diffMonths < 5 ? 'яці' : 'яців'} тому`;
  
  // Більше року - показуємо дату
  return commentDate.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// Генерація кольору аватара на основі імені
const getAvatarColor = (name: string): string => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export function CommentsList({
  comments,
  onVote,
  onFlag,
  onReply,
  maxRepliesDepth = 3,
  submittingReply = false
}: CommentsListProps) {
  if (comments.length === 0) {
    return null;
  }

  return (
    <div className="comments-list space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onVote={onVote}
          onFlag={onFlag}
          onReply={onReply}
          maxRepliesDepth={maxRepliesDepth}
          submittingReply={submittingReply}
        />
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  onVote: (commentId: string, voteType: number) => Promise<void>;
  onFlag: (commentId: string, reason: string) => Promise<void>;
  onReply: (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
  }) => Promise<void>;
  maxRepliesDepth: number;
  submittingReply: boolean;
}

function CommentItem({
  comment,
  onVote,
  onFlag,
  onReply,
  maxRepliesDepth,
  submittingReply
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [voting, setVoting] = useState<'up' | 'down' | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);

  const handleVote = async (voteType: number) => {
    const voteDirection = voteType === 1 ? 'up' : 'down';
    setVoting(voteDirection);
    
    try {
      await onVote(comment.id, voteType);
      if (userVote === voteDirection) {
        setUserVote(null);
      } else {
        setUserVote(voteDirection);
      }
    } finally {
      setVoting(null);
    }
  };

  const handleReply = async (data: {
    content: string;
    authorName?: string;
    authorEmail?: string;
  }) => {
    await onReply({
      ...data,
      parentId: comment.id
    });
    setShowReplyForm(false);
  };

  const handleFlag = async () => {
    if (!flagReason.trim()) {
      alert('Будь ласка, вкажіть причину скарги');
      return;
    }
    
    try {
      await onFlag(comment.id, flagReason);
      setShowFlagForm(false);
      setFlagReason('');
      alert('Скаргу відправлено. Дякуємо!');
    } catch {
      // Помилка обробляється в батьківському компоненті
    }
  };

  const copyCommentLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?comment=${comment.id}`;
    navigator.clipboard.writeText(url).then(() => {
      alert('Посилання скопійовано в буфер!');
    }).catch(() => {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Посилання скопійовано в буфер!');
    });
  };

  // ВИПРАВЛЕННЯ: відступи тільки для replies, не для нових коментарів
  const getIndentClass = (depth: number) => {
    if (depth === 0) return ''; // Нові коментарі без відступу
    const indents = {
      1: 'ml-12 pl-4 border-l-2 border-gray-200',
      2: 'ml-12 pl-4 border-l-2 border-gray-300', 
      3: 'ml-12 pl-4 border-l-2 border-gray-400'
    };
    return indents[Math.min(depth, 3) as keyof typeof indents] || indents[3];
  };

  const avatarColor = getAvatarColor(comment.authorName);

  return (
    <div className={`comment-item ${getIndentClass(comment.replyDepth)}`} data-comment-id={comment.id}>
      <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
        
        {/* Заголовок коментаря */}
        <div className="flex items-start space-x-3 mb-3">
          {/* Аватар */}
          <div className={`w-10 h-10 ${avatarColor} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-medium text-sm">
              {comment.authorName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* Ім'я автора + час */}
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                {comment.authorName}
              </span>
              {comment.isAnonymous && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                  анонім
                </span>
              )}
              <span className="text-sm text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
              
              {/* Debug info в development */}
              {process.env.NODE_ENV === 'development' && comment.commentType && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                  {comment.commentType}
                </span>
              )}
            </div>

            {/* Текст коментаря - ВИПРАВЛЕНО: правильне вирівнювання */}
            <div className="prose prose-sm max-w-none mb-3">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap m-0">
                {comment.content}
              </p>
            </div>

            {/* ВИПРАВЛЕННЯ: Дії з коментарем - новий порядок та вирівнювання */}
            <div className="flex items-center gap-4 text-sm">
              
              {/* Голосування - ПЕРШЕ МІСЦЕ */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleVote(1)}
                  disabled={voting !== null}
                  className={`p-1.5 rounded-md hover:bg-green-50 transition-colors ${
                    userVote === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-600'
                  } ${voting === 'up' ? 'animate-pulse' : ''}`}
                  title="Подобається"
                >
                  <svg className="w-4 h-4" fill={userVote === 'up' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>

                <span className={`px-2 py-1 rounded text-xs font-medium min-w-[2rem] text-center ${
                  comment.voteScore > 0 ? 'text-green-600 bg-green-50' :
                  comment.voteScore < 0 ? 'text-red-600 bg-red-50' :
                  'text-gray-600 bg-gray-100'
                }`}>
                  {comment.voteScore}
                </span>

                <button
                  onClick={() => handleVote(-1)}
                  disabled={voting !== null}
                  className={`p-1.5 rounded-md hover:bg-red-50 transition-colors ${
                    userVote === 'down' ? 'text-red-600 bg-red-50' : 'text-gray-600'
                  } ${voting === 'down' ? 'animate-pulse' : ''}`}
                  title="Не подобається"
                >
                  <svg className="w-4 h-4" fill={userVote === 'down' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {/* Поскаржитись - ДРУГЕ МІСЦЕ, ТІЛЬКИ ІКОНКА */}
              <button
                onClick={() => setShowFlagForm(!showFlagForm)}
                className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-gray-600"
                title="Поскаржитись на коментар"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>

              {/* Кнопка "Відповісти" - ТРЕТЄ МІСЦЕ з іконкою та текстом */}
              {comment.replyDepth < maxRepliesDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Відповісти</span>
                </button>
              )}

              {/* Кнопка поділитися (копіювання лінка) - ЧЕТВЕРТЕ МІСЦЕ */}
              <button
                onClick={copyCommentLink}
                className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-colors text-gray-600"
                title="Копіювати посилання на коментар"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                </svg>
              </button>

              {/* Кількість відповідей */}
              {comment.replyCount > 0 && (
                <span className="text-gray-500 text-xs ml-auto">
                  {comment.replyCount} відповід{comment.replyCount === 1 ? 'ь' : comment.replyCount < 5 ? 'і' : 'ей'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Форма відповіді */}
        {showReplyForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <CommentForm
              onSubmit={handleReply}
              submitting={submittingReply}
              placeholder={`Відповідь для ${comment.authorName}...`}
              showAuthorFields={true}
              buttonText="Відповісти"
            />
            <button
              onClick={() => setShowReplyForm(false)}
              className="mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Скасувати
            </button>
          </div>
        )}

        {/* Форма скарги */}
        {showFlagForm && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="bg-red-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-red-900">Поскаржитись на коментар</h4>
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Опишіть причину скарги (спам, образа, неправдива інформація тощо)..."
                rows={3}
                className="w-full px-3 py-2 border border-red-200 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                maxLength={500}
              />
              <div className="text-xs text-red-600 mb-3">
                {flagReason.length}/500 символів
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={handleFlag}
                  disabled={!flagReason.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Відправити скаргу
                </button>
                <button
                  onClick={() => {
                    setShowFlagForm(false);
                    setFlagReason('');
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors text-sm"
                >
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Відповіді (рекурсивно) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onFlag={onFlag}
              onReply={onReply}
              maxRepliesDepth={maxRepliesDepth}
              submittingReply={submittingReply}
            />
          ))}
        </div>
      )}
    </div>
  );
}