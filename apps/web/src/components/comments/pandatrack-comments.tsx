// src/components/comments/pandatrack-comments.tsx v2.0

'use client';

import { useState, useEffect, useCallback } from 'react';
import { CommentForm } from './comment-form';
import { CommentsList } from './comments-list';
import { CommentsStats } from './comments-stats';
import { CommentsInfo } from './comments-info';

// Types
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

// Context-aware placeholders
const getContextualPlaceholder = (pageId: string): string => {
  if (pageId.startsWith('track-')) {
    const trackNumber = pageId.replace('track-', '');
    return `Поділіться досвідом з посилкою ${trackNumber}: коли прийшла, чи були проблеми...`;
  }
  if (pageId === 'homepage') {
    return 'Задайте питання про відстеження посилок або поділіться досвідом з доставкою...';
  }
  return 'Напишіть ваш коментар, питання або поділіться досвідом...';
};

// Local storage helpers для pending коментарів
const PENDING_COMMENTS_KEY = 'pandatrack_pending_comments';

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

const removePendingComment = (pageId: string, commentId: string) => {
  const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
  if (existing[pageId]) {
    existing[pageId] = existing[pageId].filter((c: PendingComment) => c.id !== commentId);
    localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(existing));
  }
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

  const commentsPerPage = 20;

  // Завантаження коментарів з pagination
  const loadComments = useCallback(async (reset = true) => {
    try {
      setError(null);
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const response = await fetch(
        `${API_BASE}/api/comments/${pageId}?limit=${commentsPerPage}&offset=${currentOffset}`, 
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
      
      if (reset) {
        setComments(data.comments || []);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      
      setTotalComments(data.total || 0);
      setHasMore((data.comments || []).length === commentsPerPage);
      setOffset(currentOffset + commentsPerPage);

      // Завантажуємо pending коментарі з localStorage
      setPendingComments(getPendingComments(pageId));

    } catch (err) {
      console.error('Помилка завантаження коментарів:', err);
      setError('Не вдалося завантажити коментарі. Спробуйте перезавантажити сторінку.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [pageId, offset]);

  // Load more коментарів
  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      loadComments(false);
    }
  };

  // Додавання нового коментаря
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
          pageId,
          ...commentData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Помилка створення коментаря');
      }

      const result = await response.json();
      
      // Conditional pending status logic
      if (result.comment.approved) {
        // Автосхвалений коментар - показуємо успіх
        alert('✅ Коментар додано успішно!');
        await loadComments(true); // Перезавантажуємо коментарі
      } else {
        // Коментар на модерації - показуємо pending status
        alert('⏳ Коментар відправлено на модерацію');
        
        // Додаємо в pending коментарі для показу автору
        const pendingComment: PendingComment = {
          id: result.comment.id,
          content: result.comment.content,
          authorName: result.comment.author_name || 'Анонім',
          createdAt: result.comment.created_at,
          approved: false
        };
        
        savePendingComment(pageId, pendingComment);
        setPendingComments(getPendingComments(pageId));
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

  // Голосування за коментар
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
      
      // Оновлюємо vote score в локальному стані
      setComments(prevComments => 
        updateCommentVoteScore(prevComments, commentId, result.voteScore)
      );

    } catch (err) {
      console.error('Помилка голосування:', err);
      alert('❌ Помилка голосування: ' + (err instanceof Error ? err.message : 'Невідома помилка'));
    }
  };

  // Скарга на коментар
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

  // Допоміжна функція для оновлення vote score
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

  // Початкове завантаження
  useEffect(() => {
    loadComments(true);
  }, [pageId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadComments(true);
    }, 60000); // Кожну хвилину

    return () => clearInterval(interval);
  }, [autoRefresh, loadComments]);

  // Cleanup pending коментарів які вже схвалені
  useEffect(() => {
    const approvedIds = comments.map(c => c.id);
    const filteredPending = pendingComments.filter(pc => !approvedIds.includes(pc.id));
    
    if (filteredPending.length !== pendingComments.length) {
      setPendingComments(filteredPending);
      // Оновлюємо localStorage
      const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
      existing[pageId] = filteredPending;
      localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(existing));
    }
  }, [comments, pendingComments, pageId]);

  // Render
  return (
    <div className={`pandatrack-comments ${className}`}>
      {/* Заголовок */}
      <h2 className="text-2xl font-bold mb-4">{title}</h2>

      {/* Статистика */}
      {showStats && (
        <CommentsStats 
          pageId={pageId} 
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
        placeholder={getContextualPlaceholder(pageId)}
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
            <div className="text-center mt-6">
              <button
                onClick={handleLoadMore}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Завантажити більше коментарів
              </button>
            </div>
          )}

          {/* Loading more indicator */}
          {loadingMore && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* No more comments */}
          {!hasMore && comments.length > 0 && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">Це всі коментарі</p>
            </div>
          )}
        </>
      )}

      {!loading && !error && comments.length === 0 && pendingComments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">Поки що коментарів немає</p>
          <p className="text-sm mt-2">Станьте першим, хто залишить коментар!</p>
        </div>
      )}
    </div>
  );
}