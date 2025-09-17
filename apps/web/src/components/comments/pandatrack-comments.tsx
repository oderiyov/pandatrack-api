// src/components/comments/pandatrack-comments.tsx
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalComments, setTotalComments] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Завантаження коментарів
  const loadComments = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE}/api/comments/${pageId}?limit=50`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: CommentsData = await response.json();
      setComments(data.comments || []);
      setTotalComments(data.total || 0);

    } catch (err) {
      console.error('Помилка завантаження коментарів:', err);
      setError('Не вдалося завантажити коментарі. Спробуйте перезавантажити сторінку.');
    } finally {
      setLoading(false);
    }
  }, [pageId]);

  // Додавання нового коментаря
  const handleCommentSubmit = async (commentData: {
    content: string;
    authorName?: string;
    authorEmail?: string;
    parentId?: string;
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
      
      // Показуємо повідомлення користувачу
      if (result.comment.approved) {
        alert('✅ Коментар додано успішно!');
      } else {
        alert('⏳ Коментар відправлено на модерацію');
      }

      // Перезавантажуємо коментарі
      await loadComments();

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
    loadComments();
  }, [loadComments]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadComments();
    }, 60000); // Кожну хвилину

    return () => clearInterval(interval);
  }, [autoRefresh, loadComments]);

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
        className="mb-8"
      />

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
            onClick={loadComments}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Спробувати знову
          </button>
        </div>
      )}

      {!loading && !error && (
        <CommentsList
          comments={comments}
          onVote={handleVote}
          onFlag={handleFlag}
          onReply={handleCommentSubmit}
          maxRepliesDepth={maxRepliesDepth}
          submittingReply={submitting}
        />
      )}

      {!loading && !error && comments.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-lg">Поки що коментарів немає</p>
          <p className="text-sm mt-2">Станьте першим, хто залишить коментар!</p>
        </div>
      )}
    </div>
  );
}