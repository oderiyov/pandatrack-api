// src/components/comments/pandatrack-comments.tsx v3.2 - ВИПРАВЛЕНА ВЕРСІЯ БЕЗ LOOP
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CommentForm } from './comment-form';
import { CommentsList } from './comments-list';
import { CommentsStats } from './comments-stats';
import { CommentsInfo } from './comments-info';
import { CommentNotification } from './comment-notification';

// Types (залишаємо без змін)
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

interface PendingComment {
  id: string;
  content: string;
  authorName: string;
  createdAt: string;
  approved: boolean;
}

interface CommentsData {
  comments: Comment[];
  total: number;
  limit: number;
  offset: number;
}

interface CommentsProps {
  pageId: string;
  className?: string;
  title?: string;
  showStats?: boolean;
  showInfo?: boolean;
  maxRepliesDepth?: number;
  autoRefresh?: boolean;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.pandatrack.com.ua/comments' 
  : 'http://localhost:3003';

// Context-aware placeholders (залишаємо без змін)
const getContextualPlaceholder = (pageId: string): string => {
  if (pageId === 'homepage') {
    return 'Задайте питання про відстеження посилок або поділіться досвідом з доставкою...';
  }
  if (pageId === 'global-tracking') {
    return 'Поділіться досвідом з відстеженням, задайте питання про доставку або розкажіть про проблеми...';
  }
  return 'Напишіть ваш коментар, питання або поділіться досвідом...';
};

// Local storage helpers (залишаємо без змін)
const PENDING_COMMENTS_KEY = 'pandatrack_pending_comments';
const LAST_COMMENT_TIME_KEY = 'pandatrack_last_comment_time';

const savePendingComment = (pageId: string, comment: PendingComment) => {
  const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
  if (!existing[pageId]) existing[pageId] = [];
  existing[pageId].push(comment);
  localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(existing));
};

const getPendingComments = (pageId: string): PendingComment[] => {
  const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
  return existing[pageId] || [];
};

export function PandaTrackComments({ 
  pageId, 
  className = '',
  title = 'Запитання Про Відстеження Відправлень',
  showStats = true,
  showInfo = true,
  maxRepliesDepth = 3,
  autoRefresh = false
}: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Ref для запобігання повторним запитам
  const loadingRef = useRef(false);

  // Popup нотифікації
  const [newCommentNotification, setNewCommentNotification] = useState<Comment | null>(null);
  
  const commentsRef = useRef<HTMLDivElement>(null);
  const commentsPerPage = 20;
  
  // Глобальна гілка коментарів - використовуємо фіксований pageId
  const globalPageId = pageId === 'homepage' ? 'homepage' : 'global-tracking';

  // ВИПРАВЛЕННЯ: Завантаження коментарів БЕЗ offset в dependencies
  const loadComments = useCallback(async (reset = true) => {
    // Запобігання одночасним запитам
    if (loadingRef.current) {
      console.log('Already loading, skipping request');
      return;
    }
    
    loadingRef.current = true;
    
    try {
      setError(null);
      
      let currentOffset = 0;
      if (reset) {
        setLoading(true);
        setOffset(0);
        currentOffset = 0;
      } else {
        setLoadingMore(true);
        // Використовуємо поточний offset з state
        currentOffset = offset;
      }

      console.log(`Loading comments: reset=${reset}, offset=${currentOffset}, pageId=${globalPageId}`);

      const response = await fetch(
        `${API_BASE}/api/comments/${globalPageId}?limit=${commentsPerPage}&offset=${currentOffset}`, 
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CommentsData = await response.json();
      
      // Detect new comments for popup notification
      if (!reset && data.comments && data.comments.length > 0) {
        const newestComment = data.comments[0];
        const lastTime = localStorage.getItem(LAST_COMMENT_TIME_KEY);
        
        if (lastTime && new Date(newestComment.createdAt) > new Date(lastTime)) {
          const userName = localStorage.getItem('pandatrack_author_name');
          if (!userName || userName !== newestComment.authorName) {
            setNewCommentNotification(newestComment);
          }
        }
      }
      
      if (reset) {
        setComments(data.comments || []);
        if (data.comments && data.comments.length > 0) {
          localStorage.setItem(LAST_COMMENT_TIME_KEY, data.comments[0].createdAt);
        }
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      
      setTotalComments(data.total || 0);
      setHasMore((data.comments || []).length === commentsPerPage);
      
      // ВИПРАВЛЕННЯ: Оновлюємо offset тільки для load more
      if (!reset) {
        setOffset(prev => prev + commentsPerPage);
      }

      // Завантажуємо pending коментарі з localStorage
      setPendingComments(getPendingComments(globalPageId));

    } catch (err) {
      console.error('Помилка завантаження коментарів:', err);
      setError('Не вдалося завантажити коментарі. Спробуйте перезавантажити сторінку.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [globalPageId]); // ВИПРАВЛЕННЯ: Тільки globalPageId в dependencies

  // Load more коментарів
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      loadComments(false);
    }
  }, [loadComments, loadingMore, hasMore]);

  // Navigation to specific comment (залишаємо без змін)
  const handleNavigateToComment = (commentId: string) => {
    const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
    if (commentElement) {
      commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      commentElement.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-75');
      setTimeout(() => {
        commentElement.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-75');
      }, 3000);
    } else {
      if (commentsRef.current) {
        commentsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  // Додавання нового коментаря (залишаємо без змін)
  const handleCommentSubmit = async (commentData: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
    typingTime?: number;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          pageId: globalPageId,
          ...commentData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка створення коментаря');
      }

      const result = await response.json();
      
      if (result.comment.approved) {
        alert('✅ Коментар додано успішно!');
        await loadComments(true);
      } else {
        alert('⏳ Коментар відправлено на модерацію');
        
        const pendingComment: PendingComment = {
          id: result.comment.id,
          content: result.comment.content,
          authorName: result.comment.author_name || 'Анонім',
          createdAt: result.comment.created_at,
          approved: false
        };
        
        savePendingComment(globalPageId, pendingComment);
        setPendingComments(getPendingComments(globalPageId));
      }

    } catch (err) {
      console.error('Помилка додавання коментаря:', err);
      
      if (err instanceof Error && err.message.includes('429')) {
        alert('⚠️ Перевищено ліміт коментарів. Спробуйте пізніше.');
      } else {
        alert('❌ Помилка додавання коментаря: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Голосування за коментар (залишаємо без змін)
  const handleVote = async (commentId: string, voteType: number) => {
    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ voteType }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 429) {
          alert('⚠️ Перевищено ліміт голосів. Спробуйте пізніше.');
          return;
        }
        throw new Error(errorData.error || 'Помилка голосування');
      }

      const result = await response.json();
      
      setComments(prevComments => 
        updateCommentVoteScore(prevComments, commentId, result.voteScore)
      );

    } catch (err) {
      console.error('Помилка голосування:', err);
      alert('❌ Помилка голосування: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
    }
  };

  // Скарга на коментар (залишаємо без змін)
  const handleFlag = async (commentId: string, reason: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/comments/${commentId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка відправки скарги');
      }

      alert('✅ Скаргу отримано. Дякуємо!');

    } catch (err) {
      console.error('Помилка скарги:', err);
      alert('❌ Помилка відправки скарги: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
    }
  };

  // Допоміжна функція для оновлення vote score (залишаємо без змін)
  const updateCommentVoteScore = (comments: Comment[], commentId: string, newScore: number): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, voteScore: newScore };
      }
      if (comment.replies.length > 0) {
        return { 
          ...comment, 
          replies: updateCommentVoteScore(comment.replies, commentId, newScore) 
        };
      }
      return comment;
    });
  };

  // ВИПРАВЛЕННЯ: Початкове завантаження ТІЛЬКИ один раз
  useEffect(() => {
    console.log('Initial load for pageId:', globalPageId);
    loadComments(true);
  }, [globalPageId]); // ВИПРАВЛЕННЯ: Тільки globalPageId

  // ВИПРАВЛЕННЯ: Auto-refresh БЕЗ loadComments в dependencies
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loadingRef.current) {
        console.log('Auto-refresh triggered');
        loadComments(false);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, globalPageId]); // ВИПРАВЛЕННЯ: Прибрали loadComments

  // Cleanup pending коментарів (залишаємо без змін)
  useEffect(() => {
    const approvedIds = comments.map(c => c.id);
    const filteredPending = pendingComments.filter(pc => !approvedIds.includes(pc.id));
    
    if (filteredPending.length !== pendingComments.length) {
      setPendingComments(filteredPending);
      const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
      existing[globalPageId] = filteredPending;
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(existing));
    }
  }, [comments, pendingComments, globalPageId]);

  // Render (залишаємо БЕЗ змін)
  return (
    <div className={`pandatrack-comments ${className}`} ref={commentsRef}>
      {/* Popup нотифікація */}
      <CommentNotification
        newComment={newCommentNotification}
        onNavigateToComment={handleNavigateToComment}
        onDismiss={() => setNewCommentNotification(null)}
      />

      {/* Заголовок */}
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* Статистика */}
      {showStats && (
        <CommentsStats 
          pageId={globalPageId} 
          totalComments={totalComments}
          className="mb-6"
        />
      )}

      {/* Інформаційний блок */}
      {showInfo && (
        <CommentsInfo className="mb-6" />
      )}

      {/* Форма додавання коментаря */}
      <CommentForm 
        onSubmit={handleCommentSubmit}
        submitting={submitting}
        placeholder={getContextualPlaceholder(globalPageId)}
        className="mb-8"
      />

      {/* Pending коментарі (тільки для автора) */}
      {pendingComments.length > 0 && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-yellow-800 mb-3">
            Ваші коментарі в очікуванні модерації ({pendingComments.length})
          </h3>
          <div className="space-y-3">
            {pendingComments.map((comment) => (
              <div key={comment.id} className="bg-white rounded-lg p-3 border border-yellow-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {comment.authorName} 
                    <span className="ml-2 text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      в очікуванні
                    </span>
                  </span>
                  <time className="text-sm text-gray-500">
                    {new Date(comment.createdAt).toLocaleString('uk-UA')}
                  </time>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-wrap">
                  {comment.content}
                </p>
                <p className="text-xs text-yellow-700 mt-2">
                  Ваш коментар буде опубліковано після утвердження модераторами.
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список коментарів */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => loadComments(true)}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {!loading && !error && (
        <>
          <CommentsList
            comments={comments}
            onVote={handleVote}
            onFlag={handleFlag}
            onReply={handleCommentSubmit}
            maxRepliesDepth={maxRepliesDepth}
            submittingReply={submitting}
          />

          {/* Load More кнопка */}
          {hasMore && !loadingMore && comments.length > 0 && (
            <div className="text-center mt-8">
              <button
                onClick={handleLoadMore}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm inline-flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <span>Показати більше коментарів</span>
              </button>
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Завантаження...</span>
              </div>
            </div>
          )}

          {/* No more comments */}
          {!hasMore && comments.length > 0 && (
            <div className="text-center py-6 text-gray-500 border-t border-gray-200 mt-6">
              <p className="text-sm">Це всі коментарі</p>
              <p className="text-xs mt-1">Станьте першим, хто залишить новий коментар!</p>
            </div>
          )}
        </>
      )}

      {!loading && !error && comments.length === 0 && pendingComments.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-gray-900 mb-2">Поки що коментарів немає</p>
          <p className="text-sm text-gray-600">Станьте першим, хто поділиться досвідом або задасть питання!</p>
        </div>
      )}
    </div>
  );
}