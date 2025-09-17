// src/app/admin/comments/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface PendingComment {
  id: string;
  page_id: string;
  content: string;
  author_name: string;
  is_anonymous: boolean;
  spam_score: number;
  created_at: string;
  ip_hash: string;
  vote_count: number;
}

interface AdminStats {
  pending: number;
  approvedToday: number;
  spam: number;
  flagged: number;
  topPages: Array<{ pageId: string; count: number }>;
}

const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://api.pandatrack.com.ua/comments' 
  : 'http://localhost:3003';

export default function AdminCommentsPage() {
  const [pendingComments, setPendingComments] = useState<PendingComment[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [adminToken, setAdminToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Перевірка аутентифікації
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (token) {
      setAdminToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Завантаження даних
  useEffect(() => {
    if (isAuthenticated) {
      loadPendingComments();
      loadStats();
    }
  }, [isAuthenticated]);

  const handleLogin = async (email: string, password: string) => {
    try {
      // Тут має бути реальна аутентифікація
      // Поки що використовуємо простий токен
      const token = 'admin_token_' + Date.now();
      localStorage.setItem('admin_token', token);
      setAdminToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      alert('Помилка авторизації');
    }
  };

  const loadPendingComments = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/pending`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingComments(data.comments || []);
      }
    } catch (error) {
      console.error('Помилка завантаження коментарів:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Помилка завантаження статистики:', error);
    }
  };

  const approveComment = async (commentId: string) => {
    setProcessing(prev => [...prev, commentId]);
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/${commentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
        loadStats(); // Оновити статистику
      } else {
        alert('Помилка схвалення коментаря');
      }
    } catch (error) {
      alert('Помилка: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    } finally {
      setProcessing(prev => prev.filter(id => id !== commentId));
    }
  };

  const rejectComment = async (commentId: string) => {
    const reason = prompt('Причина відхилення (опціонально):');
    
    setProcessing(prev => [...prev, commentId]);
    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/${commentId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ reason: reason || 'Не вказано' }),
      });

      if (response.ok) {
        setPendingComments(prev => prev.filter(c => c.id !== commentId));
        loadStats();
      } else {
        alert('Помилка відхилення коментаря');
      }
    } catch (error) {
      alert('Помилка: ' + (error instanceof Error ? error.message : 'Невідома помилка'));
    } finally {
      setProcessing(prev => prev.filter(id => id !== commentId));
    }
  };

  const bulkApprove = async () => {
    const lowSpamComments = pendingComments
      .filter(c => c.spam_score < 0.3)
      .map(c => c.id);

    if (lowSpamComments.length === 0) {
      alert('Немає коментарів з низьким spam score для масового схвалення');
      return;
    }

    if (!confirm(`Схвалити ${lowSpamComments.length} коментарів з низьким spam score?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/admin/comments/bulk-approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({ commentIds: lowSpamComments }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Схвалено ${data.approvedCount} коментарів`);
        setPendingComments(prev => prev.filter(c => !lowSpamComments.includes(c.id)));
        loadStats();
      }
    } catch (error) {
      alert('Помилка масового схвалення');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('uk-UA');
  };

  const getSpamScoreColor = (score: number) => {
    if (score < 0.3) return 'text-green-600 bg-green-50';
    if (score < 0.7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  // Форма входу
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Адмін панель</h1>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            handleLogin(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="admin@pandatrack.com.ua"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Пароль
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Увійти
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">PandaTrack - Адмін панель</h1>
            <button
              onClick={() => {
                localStorage.removeItem('admin_token');
                setIsAuthenticated(false);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              Вийти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Статистика */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">На модерації</h3>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Схвалено сьогодні</h3>
              <p className="text-2xl font-bold text-green-600">{stats.approvedToday}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Спам</h3>
              <p className="text-2xl font-bold text-red-600">{stats.spam}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Скарги</h3>
              <p className="text-2xl font-bold text-red-600">{stats.flagged}</p>
            </div>
          </div>
        )}

        {/* Дії */}
        <div className="mb-6">
          <div className="flex space-x-4">
            <button
              onClick={bulkApprove}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
            >
              Схвалити всі з низьким spam score
            </button>
            <button
              onClick={loadPendingComments}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Оновити
            </button>
          </div>
        </div>

        {/* Список коментарів */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Коментарі на модерації ({pendingComments.length})</h2>
          </div>

          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : pendingComments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Немає коментарів на модерації
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {pendingComments.map((comment) => (
                <div key={comment.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">
                          {comment.author_name || 'Анонім'}
                        </span>
                        <span className="text-sm text-gray-500">
                          на сторінці: {comment.page_id}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpamScoreColor(comment.spam_score)}`}>
                          Spam: {(comment.spam_score * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">
                        {formatDate(comment.created_at)} • IP: {comment.ip_hash.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {comment.content}
                    </p>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => approveComment(comment.id)}
                      disabled={processing.includes(comment.id)}
                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {processing.includes(comment.id) ? 'Обробка...' : 'Схвалити'}
                    </button>
                    <button
                      onClick={() => rejectComment(comment.id)}
                      disabled={processing.includes(comment.id)}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing.includes(comment.id) ? 'Обробка...' : 'Відхилити'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}