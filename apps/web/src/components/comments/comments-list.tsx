// src/components/comments/comments-list.tsx v7.0
// ВИПРАВЛЕНО: правильні connecting lines, кнопки поряд, show more replies, аватари без кольорів

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
  
  return commentDate.toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

// ВИПРАВЛЕНО: Аватари без кольорів - тільки сірі
const getAvatarStyle = (): string => {
  return 'bg-gray-400'; // Єдиний сірий колір для всіх
};

// Функція для знаходження ім'я батьківського коментаря
const findParentAuthorName = (comments: Comment[], parentId: string): string | null => {
  for (const comment of comments) {
    if (comment.id === parentId) {
      return comment.authorName;
    }
    if (comment.replies.length > 0) {
      const found = findParentAuthorName(comment.replies, parentId);
      if (found) return found;
    }
  }
  return null;
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
          allComments={comments}
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
  allComments: Comment[];
}

function CommentItem({
  comment,
  onVote,
  onFlag,
  onReply,
  maxRepliesDepth,
  submittingReply,
  allComments
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [voting, setVoting] = useState<'up' | 'down' | null>(null);
  const [userVote, setUserVote] = useState<'up' | 'down' | null>(null);
  const [showAllReplies, setShowAllReplies] = useState(false);

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

  const avatarStyle = getAvatarStyle();

  // Знаходимо ім'я автора батьківського коментаря
  const parentAuthorName = comment.parentId ? findParentAuthorName(allComments, comment.parentId) : null;

  // ВИПРАВЛЕНО: Show more replies логіка
  const REPLIES_LIMIT = 2; // Показуємо тільки 2 replies, решта під кнопкою
  const hasMoreReplies = comment.replies.length > REPLIES_LIMIT;
  const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, REPLIES_LIMIT);

  return (
    <div className={`comment-item ${comment.replyDepth > 0 ? 'ml-8 md:ml-12' : ''}`} data-comment-id={comment.id}>
      {/* ВИПРАВЛЕНО: Правильні connecting lines */}
      {comment.replyDepth > 0 && (
        <div className="absolute -left-8 md:-left-12 top-0 bottom-0 flex items-start">
          {/* Головна вертикальна лінія від батьківського коментаря */}
          <div className="w-px bg-gray-300 h-12 ml-4 md:ml-6"></div>
          {/* Горизонтальна лінія до аватарки */}
          <div className="w-4 md:w-6 h-px bg-gray-300 mt-12"></div>
          {/* Закруглений кут */}
          <div className="absolute left-4 md:left-6 top-12 w-3 h-3 border-l border-b border-gray-300 rounded-bl-lg transform -translate-x-px -translate-y-px"></div>
        </div>
      )}
      
      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4 hover:shadow-sm transition-shadow relative">
        
        {/* Заголовок коментаря */}
        <div className="flex items-start space-x-3 mb-3">
          {/* ВИПРАВЛЕНО: Аватар без кольорів */}
          <div className={`w-8 h-8 md:w-10 md:h-10 ${avatarStyle} rounded-full flex items-center justify-center flex-shrink-0`}>
            <span className="text-white font-medium text-xs md:text-sm">
              {comment.authorName.charAt(0).toUpperCase()}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            {/* ВИПРАВЛЕНО: Ім'я автора + "Відповідь для [Ім'я]" + час */}
            <div className="flex items-center flex-wrap gap-1 md:gap-2 mb-2">
              <span className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer text-sm md:text-base">
                {comment.authorName}
              </span>
              
              {/* ВИПРАВЛЕНО: Правильний reply addressee без синього кольору */}
              {comment.replyDepth > 0 && parentAuthorName && (
                <span className="text-xs md:text-sm text-gray-600">
                  відповідь для <span className="font-medium text-gray-900">{parentAuthorName}</span>
                </span>
              )}
              
              {comment.isAnonymous && (
                <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                  анонім
                </span>
              )}
              <span className="text-xs md:text-sm text-gray-500">
                {formatTimeAgo(comment.createdAt)}
              </span>
              
              {/* Debug info в development */}
              {process.env.NODE_ENV === 'development' && comment.commentType && (
                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                  {comment.commentType}
                </span>
              )}
            </div>

            {/* Текст коментаря */}
            <div className="prose prose-sm max-w-none mb-3">
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap m-0 text-sm md:text-base">
                {comment.content}
              </p>
            </div>

            {/* ВИПРАВЛЕНО: Дії поряд одна з одною, без ml-auto */}
            <div className="flex items-center gap-3 text-sm">
              
              {/* 1. Голосування з правильними іконками */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleVote(1)}
                  disabled={voting !== null}
                  className={`p-1.5 rounded-md hover:bg-green-50 transition-colors ${
                    userVote === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-600'
                  } ${voting === 'up' ? 'animate-pulse' : ''}`}
                  title="Подобається"
                >
                  {/* ВИПРАВЛЕНО: Правильна іконка thumb up */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
                  </svg>
                </button>

                <span className={`px-1.5 py-0.5 rounded text-xs font-medium min-w-[1.5rem] text-center ${
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
                  {/* ВИПРАВЛЕНО: Правильна іконка thumb down */}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.106-1.79l-.05-.025A4 4 0 0011.057 2H5.641a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z"/>
                  </svg>
                </button>
              </div>

              {/* 2. Report */}
              <button
                onClick={() => setShowFlagForm(!showFlagForm)}
                className="p-1.5 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors text-gray-600 flex-shrink-0"
                title="Поскаржитись"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </button>

              {/* 3. Share */}
              <button
                onClick={copyCommentLink}
                className="p-1.5 rounded-md hover:bg-gray-100 hover:text-gray-800 transition-colors text-gray-600 flex-shrink-0"
                title="Поділитися"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>

              {/* 4. ВИПРАВЛЕНО: Reply поряд, не на краю */}
              {comment.replyDepth < maxRepliesDepth && (
                <button
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-blue-50 hover:text-blue-600 transition-colors text-gray-600 flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  <span>Відповісти</span>
                </button>
              )}

              {/* Кількість відповідей */}
              {comment.replyCount > 0 && (
                <span className="text-gray-500 text-xs">
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

      {/* ВИПРАВЛЕНО: Відповіді з "показати більше коментарів" */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {visibleReplies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onVote={onVote}
              onFlag={onFlag}
              onReply={onReply}
              maxRepliesDepth={maxRepliesDepth}
              submittingReply={submittingReply}
              allComments={allComments}
            />
          ))}
          
          {/* ВИПРАВЛЕНО: Кнопка "показати більше коментарів" для replies */}
          {hasMoreReplies && !showAllReplies && (
            <div className="ml-8 md:ml-12">
              <button
                onClick={() => setShowAllReplies(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>показати більше коментарів ({comment.replies.length - REPLIES_LIMIT})</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}