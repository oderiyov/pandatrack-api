// src/components/comments/pandatrack-comments.tsx v8.0
// ФІНАЛЬНА ВЕРСІЯ: правильна пагінація (20 коментарів), рахунок replies

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { CommentForm } from './comment-form';
import { CommentsList } from './comments-list';
import { CommentsStats } from './comments-stats';
import { CommentsInfo } from './comments-info';
import { CommentNotification } from './comment-notification';

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
  if (pageId === 'homepage') {
    return 'Задайте питання про відстеження посилок або поділіться досвідом з доставкою...';
  }
  if (pageId === 'global-tracking') {
    return 'Поділіться досвідом з відстеженням, задайте питання про доставку або розкажіть про проблеми...';
  }
  return 'Напишіть ваш коментар, питання або поділіться досвідом...';
};

// Local storage helpers для pending коментарів
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

const removePendingComment = (pageId: string, commentId: string) => {
  const existing = JSON.parse(localStorage.getItem(PENDING_COMMENTS_KEY) || '{}');
  if (existing[pageId]) {
    existing[pageId] = existing[pageId].filter((c: PendingComment) => c.id !== commentId);
    localStorage.setItem(PENDING_COMMENTS_KEY, JSON.stringify(existing));
  }
};

// НОВА ФУНКЦІЯ: Підрахунок всіх коментарів включаючи replies
const countAllComments = (comments: Comment[]): number => {
  let count = 0;
  
  const countRecursive = (commentsArray: Comment[]) => {
    commentsArray.forEach(comment => {
      count++;
      if (comment.replies && comment.replies.length > 0) {
        countRecursive(comment.replies);
      }
    });
  };
  
  countRecursive(comments);
  return count;
};

export function PandaTrackComments({ 
  pageId, 
  className = '',
  title = 'Запитання Про Відстеження Відправлень',
  showStats = true,
  showInfo = true,
  maxRepliesDepth = 3,
  autoRefresh = true
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
  const [lastKnownCommentTime, setLastKnownCommentTime] = useState<string | null>(null);
  
  const commentsRef = useRef<HTMLDivElement>(null);
  const commentsPerPage = 20; // ВИПРАВЛЕНО: завжди 20 коментарів на сторінку
  
  const globalPageId = pageId;

  console.log('PandaTrackComments rendered with pageId:', pageId, '→ globalPageId:', globalPageId);

  // Auto-refresh для нових коментарів
  const checkForNewComments = useCallback(async () => {
    if (loadingRef.current) return;
    
    try {
      console.log('Checking for new comments...');
      
      const response = await fetch(
        `${API_BASE}/api/comments/${globalPageId}?limit=1&offset=0`, 
        {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
        }
      );

      if (response.ok) {
        const data: CommentsData = await response.json();
        
        if (data.comments && data.comments.length > 0) {
          const newestComment = data.comments[0];
          const newestCommentTime = newestComment.createdAt;
          
          if (lastKnownCommentTime && new Date(newestCommentTime) > new Date(lastKnownCommentTime)) {
            const currentUserName = localStorage.getItem('pandatrack_author_name');
            
            if (!currentUserName || currentUserName !== newestComment.authorName) {
              console.log('New comment detected for notification:', newestComment);
              setNewCommentNotification(newestComment);
            }
            
            setLastKnownCommentTime(newestCommentTime);
            localStorage.setItem(LAST_COMMENT_TIME_KEY, newestCommentTime);
          }
        }
      }
    } catch (error) {
      console.log('Error checking for new comments:', error);
    }
  }, [globalPageId, lastKnownCommentTime]);

  // Завантаження коментарів
  const loadComments = useCallback(async (reset = true) => {
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
      
      if (reset && data.comments && data.comments.length > 0) {
        const newestTime = data.comments[0].createdAt;
        if (!lastKnownCommentTime) {
          setLastKnownCommentTime(newestTime);
          localStorage.setItem(LAST_COMMENT_TIME_KEY, newestTime);
        }
      }
      
      if (reset) {
        setComments(data.comments || []);
      } else {
        setComments(prev => [...prev, ...(data.comments || [])]);
      }
      
      // ВИПРАВЛЕНО: Підрахунок всіх коментарів включаючи replies
      const loadedComments = reset ? (data.comments || []) : [...comments, ...(data.comments || [])];
      const totalDisplayedComments = countAllComments(loadedComments);
      setTotalComments(totalDisplayedComments);
      
      // ВИПРАВЛЕНО: hasMore логіка на основі top-level коментарів
      const loadedTopLevelCount = (data.comments || []).length;
      setHasMore(loadedTopLevelCount === commentsPerPage);
      
      if (!reset) {
        setOffset(prev => prev + commentsPerPage);
      }

      setPendingComments(getPendingComments(globalPageId));

    } catch (err) {
      console.error('Помилка завантаження коментарів:', err);
      setError('Не вдалося завантажити коментарі. Спробуйте перезавантажити сторінку.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    }
  }, [globalPageId, offset, lastKnownCommentTime, comments]);

  // Load more коментарів
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loadingRef.current) {
      loadComments(false);
    }
  }, [loadComments, loadingMore, hasMore]);

  // Navigation to specific comment
  const handleNavigateToComment = (commentId: string) => {
    console.log('Navigating to comment:', commentId);
    
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    setTimeout(() => {
      const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        commentElement.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-75');
        setTimeout(() => {
          commentElement.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-75');
        }, 3000);
      }
    }, 1000);
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

  // Функція для перевірки існування pending коментарів на сервері
  const checkPendingCommentsStatus = useCallback(async () => {
    const pendingIds = pendingComments.map(pc => pc.id);
    if (pendingIds.length === 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/comments/check-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ commentIds: pendingIds }),
      });

      if (response.ok) {
        const { deletedIds, approvedIds } = await response.json();
        
        deletedIds.forEach((id: string) => {
          removePendingComment(globalPageId, id);
        });
        
        if (approvedIds.length > 0) {
          loadComments(true);
        }
        
        setPendingComments(getPendingComments(globalPageId));
      }
    } catch (error) {
      console.error('Error checking pending status:', error);
    }
  }, [pendingComments, globalPageId, loadComments]);

  // Початкове завантаження
  useEffect(() => {
    console.log('Initial load for pageId:', pageId, '→ globalPageId:', globalPageId);
    
    const savedTime = localStorage.getItem(LAST_COMMENT_TIME_KEY);
    if (savedTime) {
      setLastKnownCommentTime(savedTime);
    }
    
    loadComments(true);
  }, [globalPageId, loadComments, pageId]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (!loadingRef.current) {
        console.log('Auto-refresh: checking for new comments');
        checkForNewComments();
        checkPendingCommentsStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, checkForNewComments, checkPendingCommentsStatus]);

  // Cleanup pending коментарів
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

  // Періодична перевірка pending коментарів
  useEffect(() => {
    const interval = setInterval(checkPendingCommentsStatus, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [checkPendingCommentsStatus]);

  // Render
  return (
    <div className={`pandatrack-comments ${className}`} ref={commentsRef}>
      {/* Popup нотифікація */}
      <CommentNotification
        newComment={newCommentNotification}
        onNavigateToComment={handleNavigateToComment}
        onDismiss={() => setNewCommentNotification(null)}
      />

      {/* Заголовок */}
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}

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

      {/* Pending коментарі */}
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

          {/* ВИПРАВЛЕНО: Load More кнопка з'являється коли є 20+ коментарів */}
          {hasMore && !loadingMore && totalComments >= 20 && (
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