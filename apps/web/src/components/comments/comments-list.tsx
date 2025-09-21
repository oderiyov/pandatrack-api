// src/components/comments/comments-list.tsx v8.0
// ФІНАЛЬНА ВЕРСІЯ: плоска структура, прямі лінії, однакові розміри

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

// НОВА ФУНКЦІЯ: Перетворення ієрархії в плоский список з thread indicators
const flattenCommentsWithThreads = (comments: Comment[]): Array<Comment & { 
  isFirstInThread?: boolean; 
  isLastInThread?: boolean; 
  threadDepth: number;
  hasRepliesBelow?: boolean;
}> => {
  const result: Array<Comment & { 
    isFirstInThread?: boolean; 
    isLastInThread?: boolean; 
    threadDepth: number;
    hasRepliesBelow?: boolean;
  }> = [];

  const processComment = (comment: Comment, depth: number = 0, isLast: boolean = true) => {
    const hasReplies = comment.replies.length > 0;
    
    result.push({
      ...comment,
      threadDepth: depth,
      isFirstInThread: depth === 0,
      isLastInThread: isLast && !hasReplies,
      hasRepliesBelow: hasReplies
    });

    // Обробляємо replies
    comment.replies.forEach((reply, index) => {
      const isLastReply = index === comment.replies.length - 1;
      processComment(reply, depth + 1, isLastReply);
    });
  };

  comments.forEach(comment => processComment(comment));
  return result;
};

export function CommentsList({
  comments,
  onVote,
  onFlag,
  onReply,
  maxRepliesDepth = 3,
  submittingReply = false
}: CommentsListProps) {
  const [showAllThreads, setShowAllThreads] = useState<Record<string, boolean>>({});

  if (comments.length === 0) {
    return null;
  }

  // НОВИЙ ПІДХІД: плоский список з thread indicators
  const flatComments = flattenCommentsWithThreads(comments);

  // Фільтруємо коментарі для показу (з урахуванням "показати більше")
  const visibleComments = flatComments.filter((comment, index) => {
    if (comment.threadDepth === 0) return true; // Основні коментарі завжди видимі
    
    // Знаходимо батьківський коментар
    let parentComment = null;
    for (let i = index - 1; i >= 0; i--) {
      if (flatComments[i].threadDepth === comment.threadDepth - 1) {
        parentComment = flatComments[i];
        break;
      }
    }
    
    if (!parentComment) return true;
    
    // Перевіряємо чи показувати цей reply
    const showAllForParent = showAllThreads[parentComment.id];
    if (showAllForParent) return true;
    
    // Показуємо тільки перші 2 replies
    const repliesBeforeThis = flatComments
      .slice(0, index)
      .filter(c => c.threadDepth === comment.threadDepth && c.parentId === comment.parentId);
    
    return repliesBeforeThis.length < 2;
  });

  return (
    <div className="comments-list space-y-4">
      {visibleComments.map((comment, index) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onVote={onVote}
          onFlag={onFlag}
          onReply={onReply}
          maxRepliesDepth={maxRepliesDepth}
          submittingReply={submittingReply}
          allComments={comments}
          threadDepth={comment.threadDepth}
          showMoreButton={
            // Показуємо кнопку "більше" якщо є приховані replies
            comment.hasRepliesBelow && 
            !showAllThreads[comment.id] && 
            comment.replies.length > 2
          }
          onShowMore={() => setShowAllThreads(prev => ({ ...prev, [comment.id]: true }))}
        />
      ))}
    </div>
  );
}

interface CommentItemProps {
  comment: Comment & { threadDepth: number };
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
  threadDepth: number;
  showMoreButton?: boolean;
  onShowMore?: () => void;
}

function CommentItem({
  comment,
  onVote,
  onFlag,
  onReply,
  maxRepliesDepth,
  submittingReply,
  allComments,
  threadDepth,
  showMoreButton,
  onShowMore
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

  // Знаходимо ім'я автора батьківського коментаря
  const parentAuthorName = comment.parentId ? findParentAuthorName(allComments, comment.parentId) : null;

  return (
    <div className="comment-item" data-comment-id={comment.id}>
      {/* НОВИЙ ДИЗАЙН: Thread lines тільки зліва */}
      <div className="flex">
        {/* Thread indicator column */}
        {threadDepth > 0 && (
          <div className="flex-shrink-0 w-8 mr-4 relative">
            {/* Пряма вертикальна лінія */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-300"></div>
            {/* Горизонтальна лінія до коментаря */}
            <div className="absolute left-4 top-6 w-4 h-px bg-gray-300"></div>
          </div>
        )}
        
        {/* ГОЛОВНИЙ КОМЕНТАР - ОДНАКОВИЙ РОЗМІР ДЛЯ ВСІХ */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition-shadow">
          
          {/* Заголовок коментаря */}
          <div className="flex items-start space-x-3 mb-3">
            {/* Аватар - сірий для всіх */}
            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-sm">
                {comment.authorName.charAt(0).toUpperCase()}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Ім'я автора + reply info + час */}
              <div className="flex items-center flex-wrap gap-2 mb-2">
                <span className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                  {comment.authorName}
                </span>
                
                {/* Reply addressee без синього кольору */}
                {threadDepth > 0 && parentAuthorName && (
                  <span className="text-sm text-gray-600">
                    відповідь для <span className="font-medium text-gray-900">{parentAuthorName}</span>
                  </span>
                )}
                
                {comment.isAnonymous && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    анонім
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {formatTimeAgo(comment.createdAt)}
                </span>
              </div>

              {/* Текст коментаря */}
              <div className="prose prose-sm max-w-none mb-3">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap m-0">
                  {comment.content}
                </p>
              </div>

              {/* ВИПРАВЛЕНО: Дії поряд, БЕЗ лічильника відповідей */}
              <div className="flex items-center gap-3 text-sm">
                
                {/* 1. Голосування */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleVote(1)}
                    disabled={voting !== null}
                    className={`p-1.5 rounded-md hover:bg-green-50 transition-colors ${
                      userVote === 'up' ? 'text-green-600 bg-green-50' : 'text-gray-600'
                    } ${voting === 'up' ? 'animate-pulse' : ''}`}
                    title="Подобається"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"/>
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

                {/* 4. Reply */}
                {threadDepth < maxRepliesDepth && (
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
      </div>

      {/* КНОПКА "Показати більше коментарів" для thread */}
      {showMoreButton && onShowMore && (
        <div className="mt-4 ml-12">
          <button
            onClick={onShowMore}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>показати більше коментарів ({comment.replies.length - 2})</span>
          </button>
        </div>
      )}
    </div>
  );
}